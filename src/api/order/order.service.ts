type CartItemInput = {
	productId: string;
	productName?: string;
	quantity: number;
	price: number;
};

type CartItem = {
	itemId: string;
	productId: string;
	productName: string;
	quantity: number;
	unitPrice: number;
	totalPrice: number;
};

type CartSnapshot = {
	userUuid: string;
	items: CartItem[];
	subtotal: number;
	discountAmount: number;
	finalAmount: number;
	discountCode?: string;
};

type OrderRecord = {
	id: number;
	userUuid: string;
	status: string;
	totalAmount: number;
	discountAmount: number;
	finalAmount: number;
	createdAt: string;
	items: CartItem[];
};

const carts = new Map<string, CartSnapshot>();
const orders = new Map<string, OrderRecord[]>();

const buildCart = (userUuid: string): CartSnapshot => {
	const cart = carts.get(userUuid);
	if (cart) {
		return cart;
	}

	const initialCart: CartSnapshot = {
		userUuid,
		items: [],
		subtotal: 0,
		discountAmount: 0,
		finalAmount: 0
	};
	carts.set(userUuid, initialCart);
	return initialCart;
};

const recalcCart = (cart: CartSnapshot): CartSnapshot => {
	const subtotal = cart.items.reduce((acc, item) => acc + item.totalPrice, 0);
	const discountAmount = Math.min(cart.discountAmount, subtotal);
	const updated: CartSnapshot = {
		...cart,
		subtotal,
		discountAmount,
		finalAmount: subtotal - discountAmount
	};
	carts.set(cart.userUuid, updated);
	return updated;
};

export class OrderService {
	static getCart(userUuid: string): CartSnapshot {
		return recalcCart(buildCart(userUuid));
	}

	static addCartItem(userUuid: string, input: CartItemInput): CartSnapshot {
		const cart = buildCart(userUuid);
		const existing = cart.items.find((item) => item.productId === input.productId);

		if (existing) {
			existing.quantity += input.quantity;
			existing.totalPrice = existing.quantity * existing.unitPrice;
			return recalcCart(cart);
		}

		cart.items.push({
			itemId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
			productId: input.productId,
			productName: input.productName ?? input.productId,
			quantity: input.quantity,
			unitPrice: input.price,
			totalPrice: input.quantity * input.price
		});

		return recalcCart(cart);
	}

	static updateCartItem(userUuid: string, itemId: string, quantity: number): CartSnapshot {
		const cart = buildCart(userUuid);
		const item = cart.items.find((cartItem) => cartItem.itemId === itemId);

		if (!item) {
			throw new Error('Cart item not found');
		}

		item.quantity = quantity;
		item.totalPrice = item.quantity * item.unitPrice;
		return recalcCart(cart);
	}

	static removeCartItem(userUuid: string, itemId: string): CartSnapshot {
		const cart = buildCart(userUuid);
		cart.items = cart.items.filter((item) => item.itemId !== itemId);
		return recalcCart(cart);
	}

	static clearCart(userUuid: string): CartSnapshot {
		const emptyCart: CartSnapshot = {
			userUuid,
			items: [],
			subtotal: 0,
			discountAmount: 0,
			finalAmount: 0
		};
		carts.set(userUuid, emptyCart);
		return emptyCart;
	}

	static applyDiscount(userUuid: string, code: string): CartSnapshot {
		const cart = buildCart(userUuid);
		cart.discountCode = code;
		cart.discountAmount = Number((cart.subtotal * 0.1).toFixed(2));
		return recalcCart(cart);
	}

	static removeDiscount(userUuid: string): CartSnapshot {
		const cart = buildCart(userUuid);
		cart.discountCode = undefined;
		cart.discountAmount = 0;
		return recalcCart(cart);
	}

	static validateDiscount(code: string, orderAmount: number) {
		const valid = code.trim().length > 0 && orderAmount >= 0;
		return {
			valid,
			code,
			orderAmount,
			discountAmount: valid ? Number((orderAmount * 0.1).toFixed(2)) : 0
		};
	}

	static createOrder(userUuid: string): OrderRecord {
		const cart = buildCart(userUuid);
		const normalizedCart = recalcCart(cart);

		if (normalizedCart.items.length === 0) {
			throw new Error('Cart is empty');
		}

		const record: OrderRecord = {
			id: Date.now(),
			userUuid,
			status: 'PLACED',
			totalAmount: normalizedCart.subtotal,
			discountAmount: normalizedCart.discountAmount,
			finalAmount: normalizedCart.finalAmount,
			createdAt: new Date().toISOString(),
			items: normalizedCart.items
		};

		const userOrders = orders.get(userUuid) ?? [];
		userOrders.unshift(record);
		orders.set(userUuid, userOrders);
		this.clearCart(userUuid);

		return record;
	}

	static listOrders(userUuid: string): OrderRecord[] {
		return orders.get(userUuid) ?? [];
	}

	static getOrderById(userUuid: string, orderId: number): OrderRecord {
		const order = (orders.get(userUuid) ?? []).find((entry) => entry.id === orderId);
		if (!order) {
			throw new Error('Order not found');
		}
		return order;
	}

	static updateOrderStatus(userUuid: string, orderId: number, status: string): OrderRecord {
		const order = this.getOrderById(userUuid, orderId);
		order.status = status;
		return order;
	}

	static cancelOrder(userUuid: string, orderId: number): OrderRecord {
		return this.updateOrderStatus(userUuid, orderId, 'CANCELLED');
	}

	static getOrderStatusHistory(userUuid: string, orderId: number) {
		const order = this.getOrderById(userUuid, orderId);
		return [
			{
				status: order.status,
				changedAt: new Date().toISOString(),
				changedBy: userUuid
			}
		];
	}
}
