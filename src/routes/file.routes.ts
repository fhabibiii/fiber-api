// @ts-nocheck
import { Router, Request, Response } from 'express';
import { wrapExpressHandler, wrapMiddleware } from '../utils/route-types';
import fs from 'fs';
import path from 'path';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// This is already handled in the main index.ts file with express.static
// But we can add authentication here if needed
router.get('/:filename', wrapMiddleware(authenticate), (req: Request, res: Response) => {
  const filename = req.params.filename;
  const filePath = path.join(process.cwd(), 'uploads', filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ success: false, message: 'File not found' });
  }
});

export default router;
