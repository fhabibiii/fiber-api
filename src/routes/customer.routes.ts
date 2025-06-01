import { Router } from 'express';
import { wrapExpressHandler, wrapMiddleware } from '../utils/route-types';
import { 
  getAllCustomers, 
  getCustomerById, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer,
  getCustomerYears
} from '../controllers/customer.controller';
import { authenticate, authorizeAdmin } from '../middlewares/auth.middleware';
import { validate, customerSchema, updateCustomerSchema } from '../middlewares/validator';

const router = Router();

// Menggunakan wrapMiddleware dan wrapExpressHandler untuk membantu TypeScript
const auth = wrapMiddleware(authenticate);
const adminAuth = wrapMiddleware(authorizeAdmin);

router.get('/', auth, adminAuth, wrapExpressHandler(getAllCustomers));
router.get('/by-affiliator/:affiliatorUuid', auth, adminAuth, wrapExpressHandler(getAllCustomers));
router.get('/years', auth, wrapExpressHandler(getCustomerYears));
router.get('/:uuid', auth, adminAuth, wrapExpressHandler(getCustomerById));
router.post('/', auth, adminAuth, validate(customerSchema), wrapExpressHandler(createCustomer));
router.put('/:uuid', auth, adminAuth, validate(updateCustomerSchema), wrapExpressHandler(updateCustomer));
router.delete('/:uuid', auth, adminAuth, wrapExpressHandler(deleteCustomer));

export default router;
