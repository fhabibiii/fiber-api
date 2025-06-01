import prisma from '../utils/prisma';
import { Role } from '../types/express';
import logger from '../utils/logger';

export class AffiliatorUserService {
  async getAffiliatorSummary(affiliatorUuid: string) {
    if (!affiliatorUuid) {
      throw new Error('Affiliator UUID is required');
    }

    logger.info(`Fetching summary for affiliator: ${affiliatorUuid}`);

    // Check if affiliator exists
    const affiliator = await prisma.user.findUnique({
      where: { uuid: affiliatorUuid, role: Role.AFFILIATOR }
    });

    if (!affiliator) {
      throw new Error('Affiliator not found');
    }

    // Get total customers
    const totalCustomers = await prisma.customer.count({
      where: { affiliatorUuid }
    });

    // Get total payments this month
    const currentDate = new Date();
    const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
    const currentYear = currentDate.getFullYear();

    const paymentsThisMonth = await prisma.payment.findMany({
      where: {
        affiliatorUuid,
        month: currentMonth,
        year: currentYear
      }
    });

    const totalPaymentThisMonth = paymentsThisMonth.reduce((sum, payment) => sum + Number(payment.amount), 0);

    return {
      totalCustomers,
      totalPaymentThisMonth
    };
  }

  async getAffiliatorCustomers(affiliatorUuid: string, query: any) {
    if (!affiliatorUuid) {
      throw new Error('Affiliator UUID is required');
    }

    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const skip = (page - 1) * limit;

    logger.info(`Fetching customers for affiliator: ${affiliatorUuid}`);

    // Check if affiliator exists
    const affiliator = await prisma.user.findUnique({
      where: { uuid: affiliatorUuid, role: Role.AFFILIATOR }
    });

    if (!affiliator) {
      throw new Error('Affiliator not found');
    }

    // Get customers
    const [customers, totalCount] = await Promise.all([
      prisma.customer.findMany({
        where: { affiliatorUuid },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.customer.count({ where: { affiliatorUuid } })
    ]);

    logger.info(`Found ${customers.length} customers for affiliator: ${affiliatorUuid}`);

    return {
      data: customers,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    };
  }

  async getAffiliatorPayments(affiliatorUuid: string, query: any) {
    if (!affiliatorUuid) {
      throw new Error('Affiliator UUID is required');
    }

    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const year = query.year ? parseInt(query.year as string) : undefined;
    const month = query.month as string;

    let where: any = { affiliatorUuid };
    if (year) where.year = year;
    if (month) where.month = month;

    logger.info(`Fetching payments for affiliator: ${affiliatorUuid}`);

    // Check if affiliator exists
    const affiliator = await prisma.user.findUnique({
      where: { uuid: affiliatorUuid, role: Role.AFFILIATOR }
    });

    if (!affiliator) {
      throw new Error('Affiliator not found');
    }

    // Get payments
    const [payments, totalCount] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.payment.count({ where })
    ]);

    logger.info(`Found ${payments.length} payments for affiliator: ${affiliatorUuid}`);

    return {
      data: payments,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    };
  }
}

export default new AffiliatorUserService();
