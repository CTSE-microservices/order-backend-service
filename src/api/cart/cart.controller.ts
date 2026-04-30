import { Request, Response } from 'express';
import { CartService } from './cart.service.js';

const getUserUuid = (req: Request): string => req.user_uuid ?? 'demo-user';

const toSingleParam = (value: string | string[] | undefined, label: string): string => {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      throw new Error(`Invalid ${label}`);
    }
    return value[0];
  }

  if (!value) {
    throw new Error(`Invalid ${label}`);
  }

  return value;
};

const parseItemId = (value: string | string[] | undefined): string => toSingleParam(value, 'item id');

const extractErrorMessage = (err: unknown): string => {
  if (err instanceof Error) {
    return err.message;
  }
  return 'Unexpected error';
};

export class CartController {
  static getCart(req: Request, res: Response) {
    const data = CartService.getCart(getUserUuid(req));
    res.json({ message: 'Cart fetched', data });
  }

  static addCartItem(req: Request, res: Response) {
    try {
      const data = CartService.addCartItem(getUserUuid(req), {
        productId: String(req.body.productId),
        productName: req.body.productName ? String(req.body.productName) : undefined,
        quantity: Number(req.body.quantity),
        price: Number(req.body.price)
      });
      res.status(201).json({ message: 'Cart item added', data });
    } catch (err) {
      res.status(400).json({ error: extractErrorMessage(err) });
    }
  }

  static updateCartItem(req: Request, res: Response) {
    try {
      const itemId = parseItemId(req.params.itemId);
      const quantity = Number(req.body.quantity);
      if (!Number.isFinite(quantity) || quantity < 1) {
        return res.status(400).json({ error: 'quantity must be >= 1' });
      }

      const data = CartService.updateCartItem(getUserUuid(req), itemId, { quantity });
      res.json({ message: 'Cart item updated', data });
    } catch (err) {
      res.status(400).json({ error: extractErrorMessage(err) });
    }
  }

  static removeCartItem(req: Request, res: Response) {
    try {
      const itemId = parseItemId(req.params.itemId);
      const data = CartService.removeCartItem(getUserUuid(req), itemId);
      res.json({ message: 'Cart item removed', data });
    } catch (err) {
      res.status(400).json({ error: extractErrorMessage(err) });
    }
  }

  static clearCart(req: Request, res: Response) {
    const data = CartService.clearCart(getUserUuid(req));
    res.json({ message: 'Cart cleared', data });
  }
}
