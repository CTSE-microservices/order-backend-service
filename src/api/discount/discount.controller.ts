import { Request, Response } from 'express';
import { DiscountService } from './discount.service.js';

const getUserUuid = (req: Request): number => req.user_uuid as number;

export class DiscountController {
  static applyDiscount(req: Request, res: Response) {
    try {
      const code = String(req.body.code);
      const data = DiscountService.applyDiscount(getUserUuid(req), code);
      res.json({ message: 'Discount applied', data });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      res.status(400).json({ error: message });
    }
  }

  static removeDiscount(req: Request, res: Response) {
    const data = DiscountService.removeDiscount(getUserUuid(req));
    res.json({ message: 'Discount removed', data });
  }

  static validateDiscount(req: Request, res: Response) {
    const code = String(req.body.code);
    const orderAmount = Number(req.body.orderAmount);
    const data = DiscountService.validateDiscount(code, orderAmount);
    res.json({ message: 'Discount validation completed', data });
  }
}
