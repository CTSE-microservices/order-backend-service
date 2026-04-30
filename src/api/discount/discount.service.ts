import { OrderService } from '../order/order.service.js';

export class DiscountService {
  static async applyDiscount(userUuid: string, code: string) {
    return OrderService.applyDiscount(userUuid, code);
  }

  static async removeDiscount(userUuid: string) {
    return OrderService.removeDiscount(userUuid);
  }

  static async validateDiscount(code: string, orderAmount: number) {
    return OrderService.validateDiscount(code, orderAmount);
  }
}