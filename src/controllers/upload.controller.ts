import { Response } from 'express';
import { AuthRequest } from '../types/express';

export const uploadProofPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const filePath = `/api/v1/files/${req.file.filename}`;

    res.status(200).json({
      success: true,
      data: {
        filename: req.file.filename,
        url: baseUrl + filePath
      }
    });
  } catch (error) {
    console.error('Upload proof payment error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
