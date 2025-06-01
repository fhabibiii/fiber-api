import { Router } from 'express';
import { wrapExpressHandler, wrapMiddleware } from '../utils/route-types';
import { 
  getAllPayments, 
  getPaymentById, 
  createPayment, 
  updatePayment, 
  deletePayment,
  downloadProofImage,
  getAffiliatorPaymentStats,
  getPaymentYears
} from '../controllers/payment.controller';
import { authenticate, authorizeAdmin } from '../middlewares/auth.middleware';
import { validate, paymentSchema, updatePaymentSchema } from '../middlewares/validator';

const router = Router();

// Menggunakan wrapMiddleware dan wrapExpressHandler untuk membantu TypeScript
const auth = wrapMiddleware(authenticate);
const adminAuth = wrapMiddleware(authorizeAdmin);

router.get('/', auth, adminAuth, wrapExpressHandler(getAllPayments));
router.get('/by-affiliator/:affiliatorUuid', auth, wrapExpressHandler(getAllPayments));
router.get('/proof-image/:paymentUuid/download', auth, wrapExpressHandler(downloadProofImage));
router.get('/affiliator-stats/:affiliatorUuid', auth, wrapExpressHandler(getAffiliatorPaymentStats));
router.get('/years', auth, wrapExpressHandler(getPaymentYears));
router.get('/:uuid', auth, adminAuth, wrapExpressHandler(getPaymentById));
router.post('/', auth, adminAuth, validate(paymentSchema), wrapExpressHandler(createPayment));
router.put('/:uuid', auth, adminAuth, validate(updatePaymentSchema), wrapExpressHandler(updatePayment));
router.delete('/:uuid', auth, adminAuth, wrapExpressHandler(deletePayment));

export default router;
