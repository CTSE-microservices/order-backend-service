import { logger } from './logger.js';
import { rabbitMQ, EXCHANGE_ORDER_EVENTS } from '../config/rabbitmq.js';

export async function publishOrderEvent(routingKey: string, message: unknown): Promise<void> {
  try {
    const channel = await rabbitMQ.getChannel();
    channel.publish(
      EXCHANGE_ORDER_EVENTS,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      { persistent: true },
    );
    logger.info({ routingKey }, 'Order event published');
  } catch (err) {
    logger.error({ err, routingKey }, 'Failed to publish order event');
  }
}
