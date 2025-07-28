import { Router } from 'express';
import { checkPayment, getPaymentStatus, initPayment, resultPayment } from '../controllers/payment/payment-controller';
import { checkAuth } from '../middleware/check-auth';

const router = Router();

// Payment initialization (requires authentication)
router.post('/init/:orderId', initPayment);

// Payment status (requires authentication)
router.get('/status/:orderId', getPaymentStatus);

// FreedomPay callback endpoints (no authentication required)
router.post('/check', checkPayment);
router.get('/check', checkPayment);
router.post('/result', resultPayment);
router.get('/result', resultPayment);
router.get('/success', (req, res) => {
  console.log('req--------: ', req);
  const { pg_order_id, pg_payment_id, pg_salt, pg_sig } = req.query;
  console.log('req.query: ', req.query);
  // Verify signature (see below)
  console.log('Payment successful:', { pg_order_id, pg_payment_id });
  
  res.send('Payment successful');
});

// Failure callback
router.get('/failure', (req, res) => {
  const { pg_order_id, pg_status, pg_error_code, pg_error_description, pg_salt, pg_sig } = req.query;
  console.log('Payment failed:', { pg_order_id, pg_error_code, pg_error_description });
  // Handle failure (e.g., notify user)
  res.send('Payment failed');
});

// Result callback (server-to-server)
router.post('/result', (req, res) => {
  const { pg_order_id, pg_payment_id, pg_status, pg_salt, pg_sig } = req.body;
  // Verify signature
  console.log('Result callback:', { pg_order_id, pg_payment_id, pg_status });
  // Update order status
  res.sendStatus(200);
});

export { router };
