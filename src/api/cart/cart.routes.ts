import { Router } from 'express';
import { CartController } from './cart.controller.js';
import { jwtMiddleware } from '../../middleware/jwtMiddleware.js';
import { validateCartItem } from '../../validators/cartValidator.js';

const router = Router();

router.get('/', jwtMiddleware, CartController.getCart);
router.post('/items', jwtMiddleware, validateCartItem, CartController.addCartItem);
router.patch('/items/:itemId', jwtMiddleware, CartController.updateCartItem);
router.delete('/items/:itemId', jwtMiddleware, CartController.removeCartItem);
router.delete('/', jwtMiddleware, CartController.clearCart);

export default router;
