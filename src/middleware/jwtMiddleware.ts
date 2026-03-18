import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const jwtMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Missing Authorization header' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user_uuid = (decoded as any).user_uuid;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
