import { Request, Response } from 'express';
import { OrderService } from './order.service.js';

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

	static createOrder(req: Request, res: Response) {
		try {
			const order = OrderService.createOrder(getUserUuid(req));
			res.status(201).json({ message: 'Order created', data: order });
		} catch (err) {
			res.status(400).json({ error: extractErrorMessage(err) });
		}
	}

	static listOrders(req: Request, res: Response) {
		const data = OrderService.listOrders(getUserUuid(req));
		res.json({ message: 'Orders fetched', data });
	}

	static getOrderById(req: Request, res: Response) {
		try {
			const orderId = parseOrderId(req.params.orderId);
			const data = OrderService.getOrderById(getUserUuid(req), orderId);
			res.json({ message: 'Order fetched', data });
		} catch (err) {
			res.status(404).json({ error: extractErrorMessage(err) });
		}
	}

	static updateOrderStatus(req: Request, res: Response) {
		try {
			const orderId = parseOrderId(req.params.orderId);
			const status = String(req.body.status ?? '').trim();
			if (!status) {
				return res.status(400).json({ error: 'status is required' });
			}

			const data = OrderService.updateOrderStatus(getUserUuid(req), orderId, status);
			res.json({ message: 'Order status updated', data });
		} catch (err) {
			res.status(400).json({ error: extractErrorMessage(err) });
		}
	}

	static cancelOrder(req: Request, res: Response) {
		try {
			const orderId = parseOrderId(req.params.orderId);
			const data = OrderService.cancelOrder(getUserUuid(req), orderId);
			res.json({ message: 'Order cancelled', data });
		} catch (err) {
			res.status(400).json({ error: extractErrorMessage(err) });
		}
	}

	static orderHistory(req: Request, res: Response) {
		try {
			const orderId = parseOrderId(req.params.orderId);
			const data = OrderService.getOrderStatusHistory(getUserUuid(req), orderId);
			res.json({ message: 'Order history fetched', data });
		} catch (err) {
			res.status(400).json({ error: extractErrorMessage(err) });
		}
	}
}
