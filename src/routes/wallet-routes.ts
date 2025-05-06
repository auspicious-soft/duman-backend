import { Router } from 'express';
import { 
  addFundsToWallet, 
  getWalletBalance, 
  getWalletTransactions, 
  processWalletTopUp 
} from '../controllers/wallet/wallet-controller';
import { checkAuth } from '../middleware/check-auth';

const router = Router();

// Wallet routes (require authentication)
router.get('/balance', checkAuth, getWalletBalance);
router.get('/transactions', checkAuth, getWalletTransactions);
router.post('/add-funds', checkAuth, addFundsToWallet);

// Callback route for processing wallet top-up (no authentication required)
router.post('/process-top-up', processWalletTopUp);

export { router };
