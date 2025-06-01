// @ts-nocheck
import { Router } from 'express';
import { wrapExpressHandler, wrapMiddleware } from '../utils/route-types';
import { uploadProofPayment } from '../controllers/upload.controller';
import upload from '../utils/upload';
import { authenticate, authorizeAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.post('/proof-payment', 
  wrapMiddleware(authenticate), 
  wrapMiddleware(authorizeAdmin), 
  upload.single('file'), 
  wrapExpressHandler(uploadProofPayment)
);

export default router;
