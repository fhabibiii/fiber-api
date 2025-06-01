// @ts-nocheck
import { Router } from 'express';
import { wrapExpressHandler, wrapMiddleware } from '../utils/route-types';
import { 
  getOwnCustomers,
  getOwnPayments
} from '../controllers/affiliatorUser.controller';
import { authenticate, authorizeAffiliator } from '../middlewares/auth.middleware';

const router = Router();

// Menggunakan wrapper untuk membantu TypeScript
const auth = wrapMiddleware(authenticate);
const affiliatorAuth = wrapMiddleware(authorizeAffiliator);

// Affiliator routes for accessing own data
router.get('/customers', auth, affiliatorAuth, wrapExpressHandler(getOwnCustomers));
router.get('/payments', auth, affiliatorAuth, wrapExpressHandler(getOwnPayments));

export default router;
