import prisma from '../utils/prisma';
import { Role, PaymentData } from '../types/express';
import logger from '../utils/logger';

export class PaymentService {
  async getAllPayments(query: any) {
    const affiliatorUuid = query.affiliatorUuid as string;
    const year = query.year ? parseInt(query.year as string) : undefined;
    const month = query.month as string;
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const skip = (page - 1) * limit;

    let where: any = {};
    
    if (affiliatorUuid) where.affiliatorUuid = affiliatorUuid;
    if (year) where.year = year;
    if (month) where.month = month;

    logger.info(`Fetching payments with filters: ${JSON.stringify(where)}`);

    const [payments, totalCount] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          affiliator: {
            select: {
              fullName: true
            }
          }
        }
      }),
      prisma.payment.count({ where })
    ]);

    logger.info(`Found ${payments.length} payments`);

    const formattedPayments = payments.map(payment => ({
      uuid: payment.uuid,
      affiliatorUuid: payment.affiliatorUuid,
      affiliatorName: payment.affiliator.fullName,
      month: payment.month,
      year: payment.year,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      proofImage: payment.proofImage,
      createdAt: payment.createdAt
    }));

    return {
      data: formattedPayments,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    };
  }

  async getPaymentById(uuid: string) {
    if (!uuid) {
      throw new Error('Payment UUID is required');
    }

    logger.info(`Fetching payment with UUID: ${uuid}`);

    const payment = await prisma.payment.findUnique({
      where: { uuid },
      include: {
        affiliator: {
          select: {
            fullName: true
          }
        }
      }
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    return {
      uuid: payment.uuid,
      affiliatorUuid: payment.affiliatorUuid,
      affiliatorName: payment.affiliator.fullName,
      month: payment.month,
      year: payment.year,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      proofImage: payment.proofImage,
      createdAt: payment.createdAt
    };
  }

  async createPayment(paymentData: PaymentData) {
    const { affiliatorUuid, month, year, amount, paymentDate, proofImage } = paymentData;

    if (!affiliatorUuid || !month || !year || !amount || !paymentDate || !proofImage) {
      throw new Error('All fields are required');
    }

    // Check if affiliator exists
    logger.info(`Checking if affiliator exists: ${affiliatorUuid}`);
    const affiliator = await prisma.user.findUnique({
      where: { uuid: affiliatorUuid, role: Role.AFFILIATOR }
    });

    if (!affiliator) {
      throw new Error('Affiliator not found');
    }
    
    // Check if payment for this month and year already exists for this affiliator
    const existingPayment = await prisma.payment.findFirst({
      where: {
        affiliatorUuid,
        month,
        year: parseInt(year.toString())
      }
    });
    
    if (existingPayment) {
      throw new Error('Payment for this month and year already exists for this affiliator');
    }

    logger.info(`Creating new payment for affiliator: ${affiliatorUuid}`);
    const newPayment = await prisma.payment.create({
      data: {
        affiliatorUuid,
        month,
        year: parseInt(year.toString()),
        amount: parseFloat(amount.toString()),
        paymentDate: new Date(paymentDate),
        proofImage
      },
      include: {
        affiliator: {
          select: {
            fullName: true
          }
        }
      }
    });

    return {
      uuid: newPayment.uuid,
      affiliatorUuid: newPayment.affiliatorUuid,
      affiliatorName: newPayment.affiliator.fullName,
      month: newPayment.month,
      year: newPayment.year,
      amount: newPayment.amount,
      paymentDate: newPayment.paymentDate,
      proofImage: newPayment.proofImage,
      createdAt: newPayment.createdAt
    };
  }

  async updatePayment(uuid: string, paymentData: Partial<PaymentData>) {
    if (!uuid) {
      throw new Error('Payment UUID is required');
    }

    // Check if payment exists
    const payment = await prisma.payment.findUnique({
      where: { uuid }
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    const { affiliatorUuid, month, year, amount, paymentDate, proofImage } = paymentData;

    // Check if affiliator exists if affiliatorUuid is provided
    if (affiliatorUuid) {
      const affiliator = await prisma.user.findUnique({
        where: { uuid: affiliatorUuid, role: Role.AFFILIATOR }
      });

      if (!affiliator) {
        throw new Error('Affiliator not found');
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (affiliatorUuid) updateData.affiliatorUuid = affiliatorUuid;
    if (month) updateData.month = month;
    if (year) updateData.year = parseInt(year.toString());
    if (amount) updateData.amount = parseFloat(amount.toString());
    if (paymentDate) updateData.paymentDate = new Date(paymentDate);
    if (proofImage) updateData.proofImage = proofImage;

    logger.info(`Updating payment with UUID: ${uuid}`);
    const updatedPayment = await prisma.payment.update({
      where: { uuid },
      data: updateData,
      include: {
        affiliator: {
          select: {
            fullName: true
          }
        }
      }
    });

    return {
      uuid: updatedPayment.uuid,
      affiliatorUuid: updatedPayment.affiliatorUuid,
      affiliatorName: updatedPayment.affiliator.fullName,
      month: updatedPayment.month,
      year: updatedPayment.year,
      amount: updatedPayment.amount,
      paymentDate: updatedPayment.paymentDate,
      proofImage: updatedPayment.proofImage,
      createdAt: updatedPayment.createdAt
    };
  }

  async deletePayment(uuid: string) {
    if (!uuid) {
      throw new Error('Payment UUID is required');
    }

    // Check if payment exists
    const payment = await prisma.payment.findUnique({
      where: { uuid }
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    logger.info(`Deleting payment with UUID: ${uuid}`);
    await prisma.payment.delete({ where: { uuid } });
    
    return true;
  }

  async getAffiliatorStatistics(affiliatorUuid: string) {
    if (!affiliatorUuid) {
      throw new Error('Affiliator UUID is required');
    }
    
    // Check if affiliator exists
    const affiliator = await prisma.user.findUnique({
      where: { uuid: affiliatorUuid, role: Role.AFFILIATOR }
    });

    if (!affiliator) {
      throw new Error('Affiliator not found');
    }

    logger.info(`Calculating payment statistics for affiliator: ${affiliatorUuid}`);
    
    // Get all payments for this affiliator
    const payments = await prisma.payment.findMany({
      where: { affiliatorUuid }
    });
    
    // Calculate total amount
    const totalAmount = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    
    // Group payments by year
    const paymentsByYear = payments.reduce((acc, payment) => {
      const year = payment.year;
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(payment);
      return acc;
    }, {} as Record<number, any[]>);
    
    // Calculate yearly statistics
    const yearlyStats = Object.keys(paymentsByYear).map(year => {
      const yearPayments = paymentsByYear[parseInt(year)];
      const yearlyTotal = yearPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      
      // Count payments by month
      const monthlyData = Array(12).fill(0);
      yearPayments.forEach(payment => {
        const monthIndex = parseInt(payment.month) - 1; // Convert '01' to 0, '12' to 11
        if (monthIndex >= 0 && monthIndex < 12) {
          monthlyData[monthIndex] += Number(payment.amount);
        }
      });
      
      return {
        year: parseInt(year),
        totalAmount: yearlyTotal,
        paymentsCount: yearPayments.length,
        monthlyData: monthlyData
      };
    });
    
    return {
      affiliatorUuid,
      affiliatorName: affiliator.fullName,
      totalPayments: payments.length,
      totalAmount,
      yearlyStatistics: yearlyStats.sort((a, b) => b.year - a.year) // Sort by year descending
    };
  }

  async getPaymentYears() {
    logger.info('Fetching all unique payment years');
    
    // Get all unique years from payments
    const payments = await prisma.payment.findMany({
      select: {
        year: true
      },
      distinct: ['year']
    });
    
    // Convert to string array and sort in descending order (newest first)
    const years = payments.map(payment => payment.year.toString())
      .sort((a, b) => parseInt(b) - parseInt(a));
    
    return years;
  }
}

export default new PaymentService();
