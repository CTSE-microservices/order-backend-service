import { createCluster } from 'redis';
import { logger } from './logger.js';
import { redisConfig } from '../config/redis.js';

export const redisClient = createCluster({
  rootNodes: [
    {
      socket: {
        host: redisConfig.host,
        port: redisConfig.port,
      },
    },
  ],
  defaults: {
    socket: {
      tls: redisConfig.tls,
      // ElastiCache uses Amazon internal CA; disable strict cert verification
      rejectUnauthorized: false,
    },
  },
});

redisClient.on('error', (err) => logger.debug({ err }, 'Redis Cluster Error'));

(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    logger.debug({ err }, 'Redis cluster connect failed');
  }
})();
