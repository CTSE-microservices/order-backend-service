import { OrderService } from '../order/order.service.js';

export class DiscountService {
  static async applyDiscount(userUuid: number, code: string) {
    return OrderService.applyDiscount(userUuid, code);
  }

  static async removeDiscount(userUuid: number) {
    return OrderService.removeDiscount(userUuid);
  }

  static async validateDiscount(code: string, orderAmount: number) {
    return OrderService.validateDiscount(code, orderAmount);
  }
}