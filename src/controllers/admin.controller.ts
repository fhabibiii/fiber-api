import { Response } from 'express';
import { AuthRequest } from '../types/express';
import logger from '../utils/logger';
import adminService from '../services/admin.service';

export const getSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    logger.logRequest('GET', '/admin/summary', req.ip || 'unknown');
    
    const summaryData = await adminService.getSummary();
    
    res.status(200).json({
      success: true,
      data: summaryData
    });
  } catch (error) {
    logger.error('Get admin summary error', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getCustomerStatistics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    logger.logRequest('GET', `/admin/stats/customers?year=${year}`, req.ip || 'unknown');
    
    const statisticsData = await adminService.getCustomerStatistics(year);
    
    res.status(200).json({
      success: true,
      data: statisticsData
    });
  } catch (error) {
    logger.error('Get customer stats error', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getPaymentStatistics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    logger.logRequest('GET', `/admin/stats/payments?year=${year}`, req.ip || 'unknown');
    
    const statisticsData = await adminService.getPaymentStatistics(year);
    
    res.status(200).json({
      success: true,
      data: statisticsData
    });
  } catch (error) {
    logger.error('Get payment stats error', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
