// @ts-nocheck
import { Router } from 'express';
import { wrapExpressHandler, wrapMiddleware } from '../utils/route-types';
import { 
  getSummary, 
  getCustomerStatistics, 
  getPaymentStatistics 
} from '../controllers/admin.controller';
import { authenticate, authorizeAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Menggunakan wrapper untuk membantu TypeScript
const auth = wrapMiddleware(authenticate);
const adminAuth = wrapMiddleware(authorizeAdmin);

router.get('/summary', auth, adminAuth, wrapExpressHandler(getSummary));
router.get('/stats/customers', auth, adminAuth, wrapExpressHandler(getCustomerStatistics));
router.get('/stats/payments', auth, adminAuth, wrapExpressHandler(getPaymentStatistics));

export default router;
