import { prisma } from '../../config/database.js';

export type CartItemInput = {
  productId: string;
  quantity: number;
  price: number;
  productName?: string;
};

export class CartService {
  private static async getOrCreateCart(userUuid: number) {
    let cart = await prisma.cart.findFirst({
      where: { user_uuid: userUuid, is_deleted: false },
      include: { cart_item: { where: { is_deleted: false } } },
    });
    if (!cart) {
      cart = await prisma.cart.create({
        data: { user_uuid: userUuid, created_by: userUuid },
        include: { cart_item: { where: { is_deleted: false } } },
      });
    }
    return cart;
  }

  static async getCart(userUuid: number) {
    return CartService.getOrCreateCart(userUuid);
  }

  static async addCartItem(userUuid: number, input: CartItemInput) {
    const cart = await CartService.getOrCreateCart(userUuid);

    // If same product already in cart, increment quantity
    const existing = cart.cart_item.find((i) => i.product_id === input.productId);
    if (existing) {
      return prisma.cart_item.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + input.quantity,
          total_price: Number(existing.unit_price) * (existing.quantity + input.quantity),
        },
      });
    }

    return prisma.cart_item.create({
      data: {
        cart_id: cart.id,
        product_id: input.productId,
        product_name: input.productName ?? input.productId,
        quantity: input.quantity,
        unit_price: input.price,
        total_price: input.price * input.quantity,
        created_by: userUuid,
      },
    });
  }

  static async updateCartItem(
    userUuid: number,
    itemId: string,
    data: { quantity: number }
  ) {
    const id = parseInt(itemId, 10);
    const item = await prisma.cart_item.findFirst({
      where: {
        id,
        is_deleted: false,
        cart: { user_uuid: userUuid, is_deleted: false },
      },
    });
    if (!item) throw new Error('Cart item not found');
    return prisma.cart_item.update({
      where: { id },
      data: {
        quantity: data.quantity,
        total_price: Number(item.unit_price) * data.quantity,
      },
    });
  }

  static async removeCartItem(userUuid: number, itemId: string) {
    const id = parseInt(itemId, 10);
    const item = await prisma.cart_item.findFirst({
      where: {
        id,
        is_deleted: false,
        cart: { user_uuid: userUuid, is_deleted: false },
      },
    });
    if (!item) throw new Error('Cart item not found');
    return prisma.cart_item.update({
      where: { id },
      data: { is_deleted: true, deleted_at: new Date() },
    });
  }

  static async clearCart(userUuid: number) {
    const cart = await prisma.cart.findFirst({
      where: { user_uuid: userUuid, is_deleted: false },
    });
    if (!cart) return;
    await prisma.cart_item.updateMany({
      where: { cart_id: cart.id, is_deleted: false },
      data: { is_deleted: true, deleted_at: new Date() },
    });
  }
}