// @ts-nocheck
import { Router } from 'express';
import { wrapExpressHandler, wrapMiddleware } from '../utils/route-types';
import { login, refresh, logout } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Menggunakan wrapper untuk membantu TypeScript
const auth = wrapMiddleware(authenticate);

router.post('/login', wrapExpressHandler(login));
router.post('/refresh', wrapExpressHandler(refresh));
router.post('/logout', auth, wrapExpressHandler(logout));

export default router;
