import { Response } from 'express';
import { AuthRequest, PaymentData, Role } from '../types/express';
import logger from '../utils/logger';
import paymentService from '../services/payment.service';
import fs from 'fs';
import path from 'path';
import url from 'url';

export const getAllPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const affiliatorUuid = req.params.affiliatorUuid || req.query.affiliatorUuid as string;
    if (affiliatorUuid) {
      logger.info(`Fetching payments for affiliator: ${affiliatorUuid}`);
    }
    
    // Create a new query object that includes the affiliatorUuid from params if it exists
    const query = { ...req.query };
    if (req.params.affiliatorUuid) {
      query.affiliatorUuid = req.params.affiliatorUuid;
    }
    
    const result = await paymentService.getAllPayments(query);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Get all payments error', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
    return;
  }
};

export const getPaymentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const uuid = req.params.uuid;
    
    try {
      const payment = await paymentService.getPaymentById(uuid);
      
      res.status(200).json({
        success: true,
        data: payment
      });
    } catch (error: any) {
      if (error.message === 'Payment UUID is required') {
        res.status(400).json({ success: false, message: error.message });
      } else if (error.message === 'Payment not found') {
        res.status(404).json({ success: false, message: error.message });
      } else {
        throw error;
      }
    }
  } catch (error) {
    logger.error('Get payment by ID error', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
    return;
  }
};

export const createPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    try {
      const payment = await paymentService.createPayment(req.body);
      
      res.status(201).json({
        success: true,
        data: payment
      });
    } catch (error: any) {
      if (error.message === 'All fields are required' || 
          error.message === 'Affiliator not found' || 
          error.message === 'Payment for this month and year already exists for this affiliator') {
        res.status(400).json({ success: false, message: error.message });
      } else {
        throw error;
      }
    }
  } catch (error) {
    logger.error('Create payment error', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
    return;
  }
};

export const updatePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const uuid = req.params.uuid;
    
    try {
      const updatedPayment = await paymentService.updatePayment(uuid, req.body);
      
      res.status(200).json({
        success: true,
        data: updatedPayment
      });
    } catch (error: any) {
      if (error.message === 'Payment UUID is required' || error.message === 'Affiliator not found') {
        res.status(400).json({ success: false, message: error.message });
      } else if (error.message === 'Payment not found') {
        res.status(404).json({ success: false, message: error.message });
      } else {
        throw error;
      }
    }
  } catch (error) {
    logger.error('Update payment error', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
    return;
  }
};

export const deletePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const uuid = req.params.uuid;
    
    try {
      await paymentService.deletePayment(uuid);
      res.status(204).send();
      return;
    } catch (error: any) {
      if (error.message === 'Payment UUID is required') {
        res.status(400).json({ success: false, message: error.message });
      } else if (error.message === 'Payment not found') {
        res.status(404).json({ success: false, message: error.message });
      } else {
        throw error;
      }
    }
  } catch (error) {
    logger.error('Delete payment error', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
    return;
  }
};

/**
 * Download a payment proof image
 * This endpoint can be accessed by all authenticated users regardless of role
 */
export const downloadProofImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const paymentUuid = req.params.paymentUuid;
    
    if (!paymentUuid) {
      res.status(400).json({ success: false, message: 'Payment UUID is required' });
      return;
    }
    
    logger.info(`Attempting to download proof image for payment: ${paymentUuid}`);
    
    try {
      // Get the payment to retrieve the proof image URL
      const payment = await paymentService.getPaymentById(paymentUuid);
      
      logger.info(`Found payment with proof image URL: ${payment.proofImage}`);
      
      if (!payment.proofImage) {
        res.status(404).json({ success: false, message: 'Proof image not found for this payment' });
        return;
      }
      
      // Extract the filename from the proof image URL
      // Support both full URLs and relative paths
      let filename;
      
      if (payment.proofImage.startsWith('http')) {
        // Handle full URL
        const parsedUrl = new URL(payment.proofImage);
        const pathname = parsedUrl.pathname;
        
        logger.info(`Extracted pathname from URL: ${pathname}`);
        
        if (!pathname) {
          res.status(404).json({ success: false, message: 'Invalid proof image URL' });
          return;
        }
        
        // Get the filename from the pathname
        const pathParts = pathname.split('/');
        filename = pathParts[pathParts.length - 1];
      } else {
        // Handle relative path
        const pathParts = payment.proofImage.split('/');
        filename = pathParts[pathParts.length - 1];
      }
      
      logger.info(`Extracted filename: ${filename}`);
      
      if (!filename) {
        res.status(404).json({ success: false, message: 'Could not extract filename from proof image URL' });
        return;
      }
      
      // Construct the file path
      const filePath = path.join(process.cwd(), 'uploads', filename);
      logger.info(`Looking for file at: ${filePath}`);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        logger.error(`File not found at path: ${filePath}`);
        
        // Try to check the uploads directory contents to help debug
        try {
          const uploadsDir = path.join(process.cwd(), 'uploads');
          if (fs.existsSync(uploadsDir)) {
            const files = fs.readdirSync(uploadsDir);
            logger.info(`Files in uploads directory: ${JSON.stringify(files)}`);
          } else {
            logger.error('Uploads directory does not exist');
          }
        } catch (dirError) {
          logger.error('Error reading uploads directory', dirError);
        }
        
        res.status(404).json({ success: false, message: 'Proof image file not found' });
        return;
      }
      
      // Set the appropriate headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      
      // Send the file
      logger.info(`Sending file: ${filePath}`);
      res.sendFile(filePath);
      
    } catch (error: any) {
      logger.error('Error in downloadProofImage inner try block', error);
      if (error.message === 'Payment UUID is required' || error.message === 'Payment not found') {
        res.status(404).json({ success: false, message: error.message });
      } else {
        throw error;
      }
    }
  } catch (error) {
    logger.error('Download proof image error', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
    return;
  }
};

/**
 * Get payment statistics for a specific affiliator
 * This endpoint can be accessed by admin users and the affiliator themselves
 */
export const getAffiliatorPaymentStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const affiliatorUuid = req.params.affiliatorUuid;
    
    if (!affiliatorUuid) {
      res.status(400).json({ success: false, message: 'Affiliator UUID is required' });
      return;
    }
    
    // Check if the requesting user is an admin or the affiliator themself
    const currentUser = req.user;
    if (!currentUser || (currentUser.role !== Role.ADMIN && currentUser.uuid !== affiliatorUuid)) {
      res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only admins or the affiliator themselves can view these statistics' 
      });
      return;
    }
    
    logger.info(`Fetching payment statistics for affiliator: ${affiliatorUuid}`);
    
    try {
      const statisticsData = await paymentService.getAffiliatorStatistics(affiliatorUuid);
      
      res.status(200).json({
        success: true,
        data: statisticsData
      });
    } catch (error: any) {
      if (error.message === 'Affiliator UUID is required' || error.message === 'Affiliator not found') {
        res.status(404).json({ success: false, message: error.message });
      } else {
        throw error;
      }
    }
  } catch (error) {
    logger.error('Get affiliator payment stats error', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
    return;
  }
};

/**
 * Get all unique years from payment records
 * Returns an array of years as strings
 */
export const getPaymentYears = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    logger.info('Getting all unique payment years');
    
    const years = await paymentService.getPaymentYears();
    
    res.status(200).json({
      success: true,
      data: years
    });
  } catch (error) {
    logger.error('Get payment years error', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
    return;
  }
};
