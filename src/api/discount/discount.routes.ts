import { Router } from 'express';
import { DiscountController } from './discount.controller.js';
import { jwtMiddleware } from '../../middleware/jwtMiddleware.js';
import { validateDiscount } from '../../validators/discountValidator.js';

const router = Router();

router.post('/apply', jwtMiddleware, validateDiscount, DiscountController.applyDiscount);
router.delete('/', jwtMiddleware, DiscountController.removeDiscount);
router.post('/validate', validateDiscount, DiscountController.validateDiscount);

export default router;
