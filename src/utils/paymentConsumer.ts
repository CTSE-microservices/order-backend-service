import { logger } from './logger.js';
import {
  rabbitMQ,
  QUEUE_ORDER_SERVICE,
  RK_PAYMENT_SESSION_CREATED,
  RK_PAYMENT_SUCCESS,
  RK_PAYMENT_FAILED,
} from '../config/rabbitmq.js';
import { prisma } from '../config/database.js';

interface SessionCreatedMessage {
  orderId: string;
  transactionId: number;
  checkoutUrl: string;
  stripeSessionId: string;
  status: string;
}

interface PaymentOutcomeMessage {
  orderId: string;
  transactionId: number;
  status?: string;
}

async function upsertStatus(code: string, description?: string, type?: string) {
  return prisma.order_status.upsert({
    where: { code },
    update: {},
    create: { code, description: description ?? code, type: type ?? 'system' },
  });
}

export async function startPaymentConsumer(): Promise<void> {
  const channel = await rabbitMQ.getChannel();

  channel.prefetch(1);

  channel.consume(QUEUE_ORDER_SERVICE, async (msg) => {
    if (!msg) return;

    const routingKey = msg.fields.routingKey;
    let data: Record<string, unknown>;

    try {
      data = JSON.parse(msg.content.toString()) as Record<string, unknown>;
    } catch {
      logger.error({ routingKey }, 'Received non-JSON message on order_service_queue — discarding');
      channel.nack(msg, false, false);
      return;
    }

    logger.info({ routingKey, orderId: data.orderId }, 'Processing payment event');

    try {
      const orderId = Number(data.orderId);

      if (routingKey === RK_PAYMENT_SESSION_CREATED) {
        const payload = data as unknown as SessionCreatedMessage;
        const result = await prisma.orders.updateMany({
          where: { id: orderId },
          data: { checkout_url: payload.checkoutUrl },
        });

        if (result.count === 0) {
          logger.warn({ orderId }, 'Order not found for checkout URL update');
        } else {
          logger.info({ orderId, checkoutUrl: payload.checkoutUrl }, 'Checkout URL stored on order');
        }
      } else if (routingKey === RK_PAYMENT_SUCCESS) {
        const payload = data as unknown as PaymentOutcomeMessage;
        const status = await upsertStatus('PAYMENT_SUCCESS', 'Payment completed successfully', 'payment');
        const result = await prisma.orders.updateMany({
          where: { id: orderId },
          data: { status_id: status.id },
        });

        if (result.count === 0) {
          logger.warn({ orderId }, 'Order not found for payment success');
        } else {
          await prisma.order_status_history.create({
            data: { order_id: orderId, status_id: status.id, changed_by: payload.orderId },
          });
          logger.info({ orderId }, 'Order status updated to PAYMENT_SUCCESS');
        }
      } else if (routingKey === RK_PAYMENT_FAILED) {
        const payload = data as unknown as PaymentOutcomeMessage;
        const status = await upsertStatus('PAYMENT_FAILED', 'Payment failed', 'payment');
        const result = await prisma.orders.updateMany({
          where: { id: orderId },
          data: { status_id: status.id },
        });

        if (result.count === 0) {
          logger.warn({ orderId }, 'Order not found for payment failure');
        } else {
          await prisma.order_status_history.create({
            data: { order_id: orderId, status_id: status.id, changed_by: payload.orderId },
          });
          logger.info({ orderId }, 'Order status updated to PAYMENT_FAILED');
        }
      } else {
        logger.warn({ routingKey }, 'Unknown routing key — discarding message');
      }

      channel.ack(msg);
    } catch (err) {
      logger.error({ err, routingKey, orderId: data.orderId }, 'Failed to process payment event');
      channel.nack(msg, false, false);
    }
  });

  logger.info('Payment consumer started — listening on order_service_queue');
}
