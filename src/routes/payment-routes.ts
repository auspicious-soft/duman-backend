import { Router } from 'express';
import { checkPayment, getPaymentStatus, initPayment, resultPayment } from '../controllers/payment/payment-controller';
import { checkAuth } from '../middleware/check-auth';

const router = Router();

// Payment initialization (requires authentication)
router.post('/init/:orderId', checkAuth, initPayment);

// Payment status (requires authentication)
router.get('/status/:orderId', getPaymentStatus);

// FreedomPay callback endpoints (no authentication required)
router.post('/check', checkPayment);
router.get('/check', checkPayment);
router.post('/result', resultPayment);
router.get('/result', resultPayment);

export { router };
