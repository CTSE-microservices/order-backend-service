export const redisConfig = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT ?? 6379),
  tls: process.env.REDIS_TLS === 'true',
  cluster: process.env.REDIS_CLUSTER === 'true',
};
