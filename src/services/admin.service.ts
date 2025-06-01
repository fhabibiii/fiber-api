import prisma from '../utils/prisma';
import { Role } from '../types/express';
import logger from '../utils/logger';

export class AdminService {
  async getSummary() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
    const currentYear = currentDate.getFullYear();

    const currentMonthStr = String(currentMonth).padStart(2, '0');
    logger.info(`Calculating admin summary - Month: ${currentMonthStr}, Year: ${currentYear}`);

    const [totalAffiliators, totalCustomers, paymentsThisMonth] = await Promise.all([
      prisma.user.count({ where: { role: Role.AFFILIATOR } }),
      prisma.customer.count(),
      prisma.payment.findMany({
        where: {
          month: currentMonthStr,
          year: currentYear
        }
      })
    ]);

    logger.info(`Found ${paymentsThisMonth.length} payments for month ${currentMonthStr}`);
    // Tidak perlu debug sample payment
    
    const totalPaymentThisMonth = paymentsThisMonth.reduce((sum, payment) => sum + Number(payment.amount), 0);

    return {
      totalAffiliators,
      totalCustomers,
      totalPaymentThisMonth
    };
  }

  async getCustomerStatistics(year: number) {
    logger.info(`Calculating customer statistics for year: ${year}`);

    const fs = require('fs');
    const path = require('path');
    
    // Buat direktori stats jika belum ada (untuk menyimpan hasil akhir)
    const statsDir = path.join(process.cwd(), 'stats');
    if (!fs.existsSync(statsDir)) {
      fs.mkdirSync(statsDir, { recursive: true });
    }
    
    // Always calculate fresh statistics regardless of whether the file exists or not
    logger.info(`Calculating fresh customer statistics for year ${year}`);
    
    // Get all customers created in the specified year
    const customers = await prisma.customer.findMany({
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`)
        }
      },
      select: {
        createdAt: true
      }
    });
    
    logger.info(`Found ${customers.length} customers for year ${year}`);
    
    // Initialize months with zero counts
    const months = this._generateEmptyMonths();

    // Count customers by month
    customers.forEach((customer: any) => {
      const month = customer.createdAt.getMonth(); // 0-indexed
      months[month].count++;
    });
    
    // Save updated statistics to file (only for reference/backup)
    const statsFile = path.join(statsDir, `customer-stats-${year}.json`);
    try {
      fs.writeFileSync(statsFile, JSON.stringify(months));
      logger.info(`Saved updated customer statistics for year ${year}`);
    } catch (error) {
      logger.error(`Error saving statistics: ${error}`);
    }
    
    return months;
  }
  
  // Helper untuk membuat array bulan kosong
  private _generateEmptyMonths() {
    return [
      { month: 'Jan', count: 0 },
      { month: 'Feb', count: 0 },
      { month: 'Mar', count: 0 },
      { month: 'Apr', count: 0 },
      { month: 'Mei', count: 0 },
      { month: 'Jun', count: 0 },
      { month: 'Jul', count: 0 },
      { month: 'Agu', count: 0 },
      { month: 'Sep', count: 0 },
      { month: 'Okt', count: 0 },
      { month: 'Nov', count: 0 },
      { month: 'Des', count: 0 }
    ];
  }

  async getPaymentStatistics(year: number) {
    logger.info(`Calculating payment statistics for year: ${year}`);

    const fs = require('fs');
    const path = require('path');
    
    // Buat direktori stats jika belum ada (untuk menyimpan hasil akhir)
    const statsDir = path.join(process.cwd(), 'stats');
    if (!fs.existsSync(statsDir)) {
      fs.mkdirSync(statsDir, { recursive: true });
    }
    
    // Always calculate fresh statistics regardless of whether the file exists or not
    logger.info(`Calculating fresh payment statistics for year ${year}`);
    
    // Get all payments made in the specified year
    const payments = await prisma.payment.findMany({
      where: {
        year
      },
      select: {
        month: true,
        amount: true
      }
    });
    
    logger.info(`Found ${payments.length} payments for year ${year}`);

    // Initialize months with zero amounts
    const months = this._generateEmptyMonthsForPayments();

    // Sum payments by month
    payments.forEach((payment: any) => {
      // Payments have month as numeric string (e.g., '01', '02', '03')
      // Need to convert to zero-based index (0-11)
      const monthNum = parseInt(payment.month, 10);
      if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
        const monthIndex = monthNum - 1; // Convert 1-12 to 0-11
        months[monthIndex].amount += Number(payment.amount);
      }
    });
    
    // Save updated statistics to file (only for reference/backup)
    const statsFile = path.join(statsDir, `payment-stats-${year}.json`);
    try {
      fs.writeFileSync(statsFile, JSON.stringify(months));
      logger.info(`Saved updated payment statistics for year ${year}`);
    } catch (error) {
      logger.error(`Error saving statistics: ${error}`);
    }
    
    return months;
  }
  
  // Helper untuk membuat array bulan kosong untuk payment
  private _generateEmptyMonthsForPayments() {
    return [
      { month: 'Jan', amount: 0 },
      { month: 'Feb', amount: 0 },
      { month: 'Mar', amount: 0 },
      { month: 'Apr', amount: 0 },
      { month: 'Mei', amount: 0 },
      { month: 'Jun', amount: 0 },
      { month: 'Jul', amount: 0 },
      { month: 'Agu', amount: 0 },
      { month: 'Sep', amount: 0 },
      { month: 'Okt', amount: 0 },
      { month: 'Nov', amount: 0 },
      { month: 'Des', amount: 0 }
    ];
  }
}

export default new AdminService();
