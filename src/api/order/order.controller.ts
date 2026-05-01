import { Request, Response } from 'express';
import { OrderService } from './order.service.js';

const getUserUuid = (req: Request): number => req.user_uuid as number;

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

const parseOrderId = (value: string | string[] | undefined): number => {
	const id = Number(toSingleParam(value, 'order id'));
	if (!Number.isFinite(id)) {
		throw new Error('Invalid order id');
	}
	return id;
};

const extractErrorMessage = (err: unknown): string => {
	if (err instanceof Error) {
		return err.message;
	}
	return 'Unexpected error';
};

export class OrderController {
	static health(_req: Request, res: Response) {
		res.json({ status: 'ok', service: 'orders' });
	}

	static async createOrder(req: Request, res: Response) {
		try {
			const order = await OrderService.createOrder(getUserUuid(req));
			res.status(201).json({ message: 'Order created', data: order });
		} catch (err) {
			res.status(400).json({ error: extractErrorMessage(err) });
		}
	}

	static async listOrders(req: Request, res: Response) {
		const data = await OrderService.listOrders(getUserUuid(req));
		res.json({ message: 'Orders fetched', data });
	}

	static async getOrderById(req: Request, res: Response) {
		try {
			const orderId = parseOrderId(req.params.orderId);
			const data = await OrderService.getOrder(orderId, getUserUuid(req));
			res.json({ message: 'Order fetched', data });
		} catch (err) {
			res.status(404).json({ error: extractErrorMessage(err) });
		}
	}

	static async getCheckoutUrl(req: Request, res: Response) {
		try {
			const orderId = parseOrderId(req.params.orderId);
			const checkoutUrl = await OrderService.getCheckoutUrl(orderId, getUserUuid(req));
			if (!checkoutUrl) {
				return res.status(202).json({ message: 'Checkout URL not ready yet', data: null });
			}
			res.json({ message: 'Checkout URL ready', data: { checkoutUrl } });
		} catch (err) {
			res.status(404).json({ error: extractErrorMessage(err) });
		}
	}

	static async updateOrderStatus(req: Request, res: Response) {
		try {
			const orderId = parseOrderId(req.params.orderId);
			const status = String(req.body.status ?? '').trim();
			if (!status) {
				return res.status(400).json({ error: 'status is required' });
			}

			const data = await OrderService.updateOrderStatus(orderId, status, getUserUuid(req));
			res.json({ message: 'Order status updated', data });
		} catch (err) {
			res.status(400).json({ error: extractErrorMessage(err) });
		}
	}

	static async cancelOrder(req: Request, res: Response) {
		try {
			const orderId = parseOrderId(req.params.orderId);
			const data = await OrderService.cancelOrder(orderId, getUserUuid(req));
			res.json({ message: 'Order cancelled', data });
		} catch (err) {
			res.status(400).json({ error: extractErrorMessage(err) });
		}
	}

	static async orderHistory(req: Request, res: Response) {
		try {
			const orderId = parseOrderId(req.params.orderId);
			const data = await OrderService.getOrderHistory(orderId, getUserUuid(req));
			res.json({ message: 'Order history fetched', data });
		} catch (err) {
			res.status(400).json({ error: extractErrorMessage(err) });
		}
	}
}
