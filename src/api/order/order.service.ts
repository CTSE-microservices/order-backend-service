import { prisma } from '../../config/database.js';
import { publishOrderEvent } from '../../utils/rabbitmqPublisher.js';
import { RK_ORDER_CONFIRMED } from '../../config/rabbitmq.js';

// Fire-and-forget stock reduction — non-fatal if product service is unreachable
async function reduceStock(productId: string, quantity: number): Promise<void> {
  const url = process.env.PRODUCT_SERVICE_URL;
  if (!url) return;
  try {
    await fetch(`${url}/api/products/reduce-stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // product_id in cart is stored as String; product service uses Int PKs
      body: JSON.stringify({ productId: parseInt(productId, 10), quantity }),
    });
  } catch (err) {
    console.error('[order-service] stock reduction failed (non-fatal):', err);
  }
}

async function upsertStatus(code: string, description?: string, type?: string) {
  return prisma.order_status.upsert({
    where: { code },
    update: {},
    create: { code, description: description ?? code, type: type ?? 'system' },
  });
}

export class OrderService {
  // ── Cart discount helpers (used by DiscountService) ──────────────────────

  static async applyDiscount(userUuid: string, code: string) {
    const discount = await prisma.discount.findFirst({
      where: { code, is_active: true, is_deleted: false },
    });
    if (!discount) throw new Error('Invalid or expired discount code');

    const cart = await prisma.cart.findFirst({
      where: { user_uuid: userUuid, is_deleted: false },
    });
    if (!cart) throw new Error('Cart not found');

    return prisma.cart.update({
      where: { id: cart.id },
      data: { discount_id: discount.id },
    });
  }

  static async removeDiscount(userUuid: string) {
    const cart = await prisma.cart.findFirst({
      where: { user_uuid: userUuid, is_deleted: false },
    });
    if (!cart) throw new Error('Cart not found');
    return prisma.cart.update({
      where: { id: cart.id },
      data: { discount_id: null, discount_amount: 0 },
    });
  }

  static async validateDiscount(code: string, orderAmount: number) {
    const discount = await prisma.discount.findFirst({
      where: {
        code,
        is_active: true,
        is_deleted: false,
        OR: [{ expires_at: null }, { expires_at: { gte: new Date() } }],
      },
    });
    if (!discount) return { valid: false, reason: 'Invalid or expired discount code' };
    if (discount.min_order_amount && orderAmount < Number(discount.min_order_amount)) {
      return { valid: false, reason: `Minimum order amount is ${discount.min_order_amount}` };
    }
    return { valid: true, discount };
  }

  // ── Orders ───────────────────────────────────────────────────────────────

  static async createOrder(userUuid: string, _data: Record<string, unknown> = {}) {
    const cart = await prisma.cart.findFirst({
      where: { user_uuid: userUuid, is_deleted: false },
      include: {
        cart_item: { where: { is_deleted: false } },
        discount: true,
      },
    });

    if (!cart || cart.cart_item.length === 0) throw new Error('Cart is empty');

    const totalAmount = cart.cart_item.reduce(
      (sum, item) => sum + Number(item.unit_price) * item.quantity,
      0
    );

    // Calculate discount
    let discountAmount = 0;
    const discount = cart.discount;
    if (discount) {
      const meetsMinimum =
        !discount.min_order_amount || totalAmount >= Number(discount.min_order_amount);
      if (meetsMinimum) {
        if (discount.type === 'PERCENTAGE') {
          discountAmount = totalAmount * (Number(discount.value) / 100);
        } else {
          discountAmount = Number(discount.value);
        }
        if (discount.max_discount_amount) {
          discountAmount = Math.min(discountAmount, Number(discount.max_discount_amount));
        }
        discountAmount = Math.min(discountAmount, totalAmount);
      }
    }

    const finalAmount = totalAmount - discountAmount;
    const pendingStatus = await upsertStatus('PENDING', 'Order placed, awaiting payment', 'initial');

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.orders.create({
        data: {
          user_uuid: userUuid,
          status_id: pendingStatus.id,
          total_amount: totalAmount,
          discount_id: discount?.id ?? null,
          discount_amount: discountAmount,
          final_amount: finalAmount,
          created_by: userUuid,
          order_item: {
            create: cart.cart_item.map((item) => ({
              product_id: item.product_id,
              product_name: item.product_name,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: Number(item.unit_price) * item.quantity,
              created_by: userUuid,
            })),
          },
          order_status_history: {
            create: { status_id: pendingStatus.id, changed_by: userUuid },
          },
        },
        include: {
          order_item: true,
          order_status: true,
          order_status_history: { include: { order_status: true } },
        },
      });

      // Soft-delete the cart and its items
      await tx.cart_item.updateMany({
        where: { cart_id: cart.id },
        data: { is_deleted: true, deleted_at: new Date() },
      });
      await tx.cart.update({
        where: { id: cart.id },
        data: { is_deleted: true, deleted_at: new Date(), updated_by: userUuid },
      });

      return newOrder;
    });

    // Reduce stock in product service (non-blocking)
    for (const item of cart.cart_item) {
      reduceStock(item.product_id, item.quantity);
    }

    // Publish order.confirmed so the payment service can create a Stripe session
    await publishOrderEvent(RK_ORDER_CONFIRMED, {
      orderId: String(order.id),
      userId: userUuid,
      amount: Number(order.final_amount),
      currency: 'usd',
      items: order.order_item.map((item) => ({
        name: item.product_name,
        quantity: item.quantity,
        price: Number(item.unit_price),
      })),
    });

    return order;
  }

  static async listOrders(userUuid: string) {
    return prisma.orders.findMany({
      where: { user_uuid: userUuid, is_deleted: false },
      include: { order_item: { where: { is_deleted: false } }, order_status: true },
      orderBy: { created_at: 'desc' },
    });
  }

  static async getOrder(orderId: number, userUuid: string) {
    const order = await prisma.orders.findFirst({
      where: { id: orderId, user_uuid: userUuid, is_deleted: false },
      include: {
        order_item: { where: { is_deleted: false } },
        order_status: true,
        order_status_history: {
          where: { is_deleted: false },
          include: { order_status: true },
          orderBy: { changed_at: 'desc' },
        },
      },
    });
    if (!order) throw new Error('Order not found');
    return order;
  }

  static async getOrderHistory(orderId: number, userUuid: string) {
    const order = await prisma.orders.findFirst({
      where: { id: orderId, user_uuid: userUuid, is_deleted: false },
    });
    if (!order) throw new Error('Order not found');
    return prisma.order_status_history.findMany({
      where: { order_id: orderId, is_deleted: false },
      include: { order_status: true },
      orderBy: { changed_at: 'desc' },
    });
  }

  static async updateOrderStatus(orderId: number, statusCode: string, userUuid: string) {
    const order = await prisma.orders.findFirst({
      where: { id: orderId, is_deleted: false },
    });
    if (!order) throw new Error('Order not found');

    const status = await upsertStatus(statusCode);

    return prisma.$transaction(async (tx) => {
      await tx.order_status_history.create({
        data: { order_id: orderId, status_id: status.id, changed_by: userUuid },
      });
      return tx.orders.update({
        where: { id: orderId },
        data: { status_id: status.id, updated_by: userUuid },
        include: { order_status: true, order_item: { where: { is_deleted: false } } },
      });
    });
  }

  static async cancelOrder(orderId: number, userUuid: string) {
    const order = await prisma.orders.findFirst({
      where: { id: orderId, user_uuid: userUuid, is_deleted: false },
      include: { order_status: true },
    });
    if (!order) throw new Error('Order not found');
    if (order.order_status.code === 'CANCELLED') throw new Error('Order is already cancelled');
    if (['SHIPPED', 'DELIVERED'].includes(order.order_status.code)) {
      throw new Error('Cannot cancel an order that has already been shipped or delivered');
    }

    const cancelledStatus = await upsertStatus('CANCELLED', 'Order cancelled by user', 'terminal');

    return prisma.$transaction(async (tx) => {
      await tx.order_status_history.create({
        data: { order_id: orderId, status_id: cancelledStatus.id, changed_by: userUuid },
      });
      return tx.orders.update({
        where: { id: orderId },
        data: { status_id: cancelledStatus.id, updated_by: userUuid },
        include: { order_status: true },
      });
    });
  }
}