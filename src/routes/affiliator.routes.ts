// @ts-nocheck
import { Router } from 'express';
import { wrapExpressHandler, wrapMiddleware } from '../utils/route-types';
import { 
  getAllAffiliators, 
  getAffiliatorById, 
  createAffiliator, 
  updateAffiliator, 
  deleteAffiliator, 
  getAffiliatorSummary
} from '../controllers/affiliator.controller';
import { authenticate, authorizeAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Admin routes for affiliator management
// Menggunakan wrapper untuk membantu TypeScript
const auth = wrapMiddleware(authenticate);
const adminAuth = wrapMiddleware(authorizeAdmin);

router.get('/', auth, adminAuth, wrapExpressHandler(getAllAffiliators));
router.get('/:uuid', auth, adminAuth, wrapExpressHandler(getAffiliatorById));
router.post('/', auth, adminAuth, wrapExpressHandler(createAffiliator));
router.put('/:uuid', auth, adminAuth, wrapExpressHandler(updateAffiliator));
router.delete('/:uuid', auth, adminAuth, wrapExpressHandler(deleteAffiliator));
router.get('/:uuid/summary', auth, adminAuth, wrapExpressHandler(getAffiliatorSummary));

export default router;
