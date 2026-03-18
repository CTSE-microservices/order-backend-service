import { OrderService } from '../order/order.service.js';

export class DiscountService {
  static applyDiscount(userUuid: string, code: string) {
    return OrderService.applyDiscount(userUuid, code);
  }

  static removeDiscount(userUuid: string) {
    return OrderService.removeDiscount(userUuid);
  }

  static validateDiscount(code: string, orderAmount: number) {
    return OrderService.validateDiscount(code, orderAmount);
  }
}
