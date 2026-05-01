import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const parseUserId = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isInteger(parsed)) return parsed;
  }
  return null;
};

export const jwtMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing Authorization header' });
  if (!authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Invalid Authorization header' });

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return res.status(401).json({ error: 'Missing token' });

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) return res.status(500).json({ error: 'Auth configuration missing' });

  try {
    const decoded = jwt.verify(token, jwtSecret);
    if (typeof decoded !== 'object' || decoded === null) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const payload = decoded as JwtPayload;
    const userIdCandidate = parseUserId(payload.user_id ?? payload.user_uuid ?? payload.sub);
    if (userIdCandidate !== null) {
      req.user_uuid = userIdCandidate;
    } else {
      const devUserId = parseUserId(process.env.DEV_USER_ID);
      if (devUserId !== null) {
        req.user_uuid = devUserId;
      } else {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
