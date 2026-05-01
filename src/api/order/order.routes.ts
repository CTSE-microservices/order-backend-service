import { Router } from 'express';
import { OrderController } from './order.controller.js';
import { jwtMiddleware } from '../../middleware/jwtMiddleware.js';
import { validateOrder } from '../../validators/orderValidator.js';

const router = Router();

router.get('/health', OrderController.health);

router.get('/', jwtMiddleware, OrderController.listOrders);
router.post('/', jwtMiddleware, validateOrder, OrderController.createOrder);
router.get('/:orderId/checkout-url', jwtMiddleware, OrderController.getCheckoutUrl);
router.get('/:orderId/history', jwtMiddleware, OrderController.orderHistory);
router.patch('/:orderId/status', jwtMiddleware, OrderController.updateOrderStatus);
router.post('/:orderId/cancel', jwtMiddleware, OrderController.cancelOrder);
router.get('/:orderId', jwtMiddleware, OrderController.getOrderById);

export default router;
