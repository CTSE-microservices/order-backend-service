import amqplib, { ChannelModel, Channel } from 'amqplib';
import { logger } from '../utils/logger.js';

// Backward-compat export for /ready health check in app.ts
export const rabbitmqConfig = { url: process.env.RABBITMQ_URL };

// Exchange names — shared constants so publisher and consumer always agree
export const EXCHANGE_ORDER_EVENTS = 'order_events';
export const EXCHANGE_PAYMENT_EVENTS = 'payment_events';

// Queue names
export const QUEUE_PAYMENT_SERVICE = 'payment_service_queue';
export const QUEUE_ORDER_SERVICE = 'order_service_queue';

// Routing keys
export const RK_ORDER_CONFIRMED = 'order.confirmed';
export const RK_PAYMENT_SESSION_CREATED = 'payment.session_created';
export const RK_PAYMENT_SUCCESS = 'payment.success';
export const RK_PAYMENT_FAILED = 'payment.failed';

class RabbitMQConnection {
  private model: ChannelModel | null = null;
  private channel: Channel | null = null;

  async connect(): Promise<Channel> {
    this.model = await amqplib.connect(process.env.RABBITMQ_URL!);
    this.channel = await this.model.createChannel();

    await this.channel.assertExchange(EXCHANGE_ORDER_EVENTS, 'topic', { durable: true });
    await this.channel.assertExchange(EXCHANGE_PAYMENT_EVENTS, 'topic', { durable: true });

    await this.channel.assertQueue(QUEUE_PAYMENT_SERVICE, { durable: true });
    await this.channel.assertQueue(QUEUE_ORDER_SERVICE, { durable: true });

    // payment service listens for order confirmed events
    await this.channel.bindQueue(QUEUE_PAYMENT_SERVICE, EXCHANGE_ORDER_EVENTS, RK_ORDER_CONFIRMED);

    // order service listens for all payment outcome events
    await this.channel.bindQueue(QUEUE_ORDER_SERVICE, EXCHANGE_PAYMENT_EVENTS, RK_PAYMENT_SESSION_CREATED);
    await this.channel.bindQueue(QUEUE_ORDER_SERVICE, EXCHANGE_PAYMENT_EVENTS, RK_PAYMENT_SUCCESS);
    await this.channel.bindQueue(QUEUE_ORDER_SERVICE, EXCHANGE_PAYMENT_EVENTS, RK_PAYMENT_FAILED);

    this.model.connection.on('error', (err: Error) => {
      logger.error({ err }, 'RabbitMQ connection error — will reconnect on next use');
      this.model = null;
      this.channel = null;
    });

    this.model.connection.on('close', () => {
      logger.warn('RabbitMQ connection closed');
      this.model = null;
      this.channel = null;
    });

    logger.info('RabbitMQ connected — exchanges and queues ready');
    return this.channel;
  }

  async getChannel(): Promise<Channel> {
    if (this.channel) return this.channel;
    return this.connect();
  }
}

export const rabbitMQ = new RabbitMQConnection();
