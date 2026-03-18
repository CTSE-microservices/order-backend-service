import { OrderService } from '../order/order.service.js';

type CartItemInput = {
  productId: string;
  productName?: string;
  quantity: number;
  price: number;
};

export class CartService {
  static getCart(userUuid: string) {
    return OrderService.getCart(userUuid);
  }

  static addCartItem(userUuid: string, input: CartItemInput) {
    return OrderService.addCartItem(userUuid, input);
  }

  static updateCartItem(userUuid: string, itemId: string, quantity: number) {
    return OrderService.updateCartItem(userUuid, itemId, quantity);
  }

  static removeCartItem(userUuid: string, itemId: string) {
    return OrderService.removeCartItem(userUuid, itemId);
  }

  static clearCart(userUuid: string) {
    return OrderService.clearCart(userUuid);
  }
}
