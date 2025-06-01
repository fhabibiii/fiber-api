import prisma from '../utils/prisma';
import { Role, CustomerData } from '../types/express';
import logger from '../utils/logger';

export class CustomerService {
  async getAllCustomers(query: any) {
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const search = query.search as string || '';
    const affiliatorUuid = query.affiliatorUuid as string;

    // Set up where clause
    let where: any = {};
    
    // Add search if provided
    if (search) {
      where.fullName = { contains: search };
    }
    
    // Add affiliator filter if provided
    if (affiliatorUuid) {
      // Validate if affiliator exists
      const affiliator = await prisma.user.findUnique({
        where: { uuid: affiliatorUuid, role: Role.AFFILIATOR }
      });
      
      if (!affiliator) {
        throw new Error('Affiliator not found');
      }
      
      where.affiliatorUuid = affiliatorUuid;
    }

    logger.info(`Fetching customers with filters: ${JSON.stringify(where)}`);

    const [customers, totalCount] = await Promise.all([
      prisma.customer.findMany({
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
      prisma.customer.count({ where })
    ]);

    logger.info(`Found ${customers.length} customers`);

    const formattedCustomers = customers.map(customer => ({
      uuid: customer.uuid,
      fullName: customer.fullName,
      phoneNumber: customer.phoneNumber,
      fullAddress: customer.fullAddress,
      affiliatorUuid: customer.affiliatorUuid,
      affiliatorName: customer.affiliator.fullName,
      createdAt: customer.createdAt
    }));

    return {
      data: formattedCustomers,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    };
  }

  async getCustomerById(uuid: string) {
    if (!uuid) {
      throw new Error('Customer UUID is required');
    }

    logger.info(`Fetching customer with UUID: ${uuid}`);

    const customer = await prisma.customer.findUnique({
      where: { uuid },
      include: {
        affiliator: {
          select: {
            fullName: true
          }
        }
      }
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    return {
      uuid: customer.uuid,
      fullName: customer.fullName,
      phoneNumber: customer.phoneNumber,
      fullAddress: customer.fullAddress,
      affiliatorUuid: customer.affiliatorUuid,
      affiliatorName: customer.affiliator.fullName,
      createdAt: customer.createdAt
    };
  }

  async createCustomer(customerData: CustomerData) {
    const { fullName, phoneNumber, fullAddress, affiliatorUuid } = customerData;

    if (!fullName || !phoneNumber || !fullAddress || !affiliatorUuid) {
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

    logger.info(`Creating new customer for affiliator: ${affiliatorUuid}`);
    const newCustomer = await prisma.customer.create({
      data: {
        fullName,
        phoneNumber,
        fullAddress,
        affiliatorUuid
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
      uuid: newCustomer.uuid,
      fullName: newCustomer.fullName,
      phoneNumber: newCustomer.phoneNumber,
      fullAddress: newCustomer.fullAddress,
      affiliatorUuid: newCustomer.affiliatorUuid,
      affiliatorName: newCustomer.affiliator.fullName,
      createdAt: newCustomer.createdAt
    };
  }

  async updateCustomer(uuid: string, customerData: Partial<CustomerData>) {
    if (!uuid) {
      throw new Error('Customer UUID is required');
    }

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { uuid }
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    const { fullName, phoneNumber, fullAddress, affiliatorUuid } = customerData;

    // Check if affiliator exists if affiliatorUuid is provided
    if (affiliatorUuid && affiliatorUuid !== customer.affiliatorUuid) {
      const affiliator = await prisma.user.findUnique({
        where: { uuid: affiliatorUuid, role: Role.AFFILIATOR }
      });

      if (!affiliator) {
        throw new Error('Affiliator not found');
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (fullName) updateData.fullName = fullName;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (fullAddress) updateData.fullAddress = fullAddress;
    if (affiliatorUuid) updateData.affiliatorUuid = affiliatorUuid;

    logger.info(`Updating customer with UUID: ${uuid}`);
    const updatedCustomer = await prisma.customer.update({
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
      uuid: updatedCustomer.uuid,
      fullName: updatedCustomer.fullName,
      phoneNumber: updatedCustomer.phoneNumber,
      fullAddress: updatedCustomer.fullAddress,
      affiliatorUuid: updatedCustomer.affiliatorUuid,
      affiliatorName: updatedCustomer.affiliator.fullName,
      createdAt: updatedCustomer.createdAt
    };
  }

  async deleteCustomer(uuid: string) {
    if (!uuid) {
      throw new Error('Customer UUID is required');
    }

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { uuid }
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    logger.info(`Deleting customer with UUID: ${uuid}`);
    await prisma.customer.delete({ where: { uuid } });
    
    return true;
  }

  async getCustomerYears() {
    logger.info('Fetching all unique customer creation years');
    
    // Get all customers
    const customers = await prisma.customer.findMany({
      select: {
        createdAt: true
      }
    });
    
    // Extract years from createdAt dates and create a unique set
    const yearsSet = new Set<string>();
    
    customers.forEach(customer => {
      const year = customer.createdAt.getFullYear().toString();
      yearsSet.add(year);
    });
    
    // Convert set to array and sort in descending order (newest first)
    const years = Array.from(yearsSet).sort((a, b) => parseInt(b) - parseInt(a));
    
    return years;
  }
}

export default new CustomerService();
