import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { redisClient } from '../utils/redisClient.js';
import { logger } from '../utils/logger.js';

export const jwtMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing Authorization header' });
  if (!authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Invalid Authorization header' });

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return res.status(401).json({ error: 'Missing token' });

  const jwtSecret = process.env.JWT_SECRET;
  const jwtIssuer = process.env.JWT_ISSUER;
  const jwtAudience = process.env.JWT_AUDIENCE;

  if (!jwtSecret || !jwtIssuer || !jwtAudience) {
    return res.status(500).json({ error: 'Auth configuration missing' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret, { issuer: jwtIssuer, audience: jwtAudience });
    if (typeof decoded !== 'object' || decoded === null) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const payload = decoded as JwtPayload;
    if (!payload.jti) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    try {
      if (!redisClient.isOpen) {
        return res.status(503).json({ error: 'Redis unavailable' });
      }

      const allowListed = await redisClient.get(`auth:token:${payload.jti}`);
      if (!allowListed) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    } catch (err) {
      logger.error({ err }, 'Redis allow-list lookup failed');
      return res.status(503).json({ error: 'Redis unavailable' });
    }

    if ('user_uuid' in payload) {
      const { user_uuid } = payload as { user_uuid?: unknown };
      if (typeof user_uuid === 'string') {
        req.user_uuid = user_uuid;
      }
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
