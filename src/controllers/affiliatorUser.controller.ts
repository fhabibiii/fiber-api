import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../types/express';

// Affiliator routes (own data)
export const getOwnCustomers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const affiliatorUuid = req.user?.uuid;

    if (!affiliatorUuid) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const customers = await prisma.customer.findMany({
      where: { affiliatorUuid },
      orderBy: { createdAt: 'desc' }
    });

    // Get affiliator name for each customer
    const affiliator = await prisma.user.findUnique({
      where: { uuid: affiliatorUuid },
      select: { fullName: true }
    });

    const formattedCustomers = customers.map(customer => ({
      ...customer,
      affiliatorName: affiliator?.fullName || 'Unknown'
    }));

    res.status(200).json({
      success: true,
      data: formattedCustomers
    });
  } catch (error) {
    console.error('Get own customers error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
    return;
  }
};

export const getOwnPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const affiliatorUuid = req.user?.uuid;

    if (!affiliatorUuid) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const payments = await prisma.payment.findMany({
      where: { affiliatorUuid },
      orderBy: { createdAt: 'desc' }
    });

    // Get affiliator name for each payment
    const affiliator = await prisma.user.findUnique({
      where: { uuid: affiliatorUuid },
      select: { fullName: true }
    });

    const formattedPayments = payments.map(payment => ({
      ...payment,
      affiliatorName: affiliator?.fullName || 'Unknown'
    }));

    res.status(200).json({
      success: true,
      data: formattedPayments
    });
  } catch (error) {
    console.error('Get own payments error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
    return;
  }
};
