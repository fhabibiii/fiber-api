import { Request, Response, NextFunction } from 'express';
import path from 'path';

export const serveFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../../uploads', filename);
  res.sendFile(filePath);
};
