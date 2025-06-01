import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest, CustomerData, CustomerQuery, Role } from '../types/express';
import customerService from '../services/customer.service';
import logger from '../utils/logger';

export const getAllCustomers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search as string || '';
    const affiliatorUuid = req.params.affiliatorUuid || req.query.affiliatorUuid as string;

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
        res.status(404).json({ success: false, message: 'Affiliator not found' });
        return;
      }
      
      where.affiliatorUuid = affiliatorUuid;
    }

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

    const formattedCustomers = customers.map((customer: any) => ({
      uuid: customer.uuid,
      fullName: customer.fullName,
      phoneNumber: customer.phoneNumber,
      fullAddress: customer.fullAddress,
      affiliatorUuid: customer.affiliatorUuid,
      affiliatorName: customer.affiliator.fullName,
      createdAt: customer.createdAt
    }));

    res.status(200).json({
      success: true,
      data: formattedCustomers,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Get all customers error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getCustomerById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { uuid } = req.params;

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
      res.status(404).json({ success: false, message: 'Customer not found' });
      return;
    }

    const formattedCustomer: CustomerData = {
      uuid: customer.uuid,
      fullName: customer.fullName,
      phoneNumber: customer.phoneNumber,
      fullAddress: customer.fullAddress,
      affiliatorUuid: customer.affiliatorUuid,
      affiliatorName: customer.affiliator.fullName,
      createdAt: customer.createdAt
    };

    res.status(200).json({
      success: true,
      data: formattedCustomer
    });
  } catch (error) {
    console.error('Get customer by ID error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fullName, phoneNumber, fullAddress, affiliatorUuid } = req.body;

    // Validate required fields
    if (!fullName || !phoneNumber || !fullAddress || !affiliatorUuid) {
      res.status(400).json({ success: false, message: 'All fields are required' });
      return;
    }

    // Validate phone number length
    if (phoneNumber.length < 10) {
      res.status(400).json({ 
        success: false, 
        message: 'Validation error', 
        errors: [{
          path: 'phoneNumber',
          message: 'Phone number must be at least 10 characters'
        }]
      });
      return;
    }

    // Check if affiliator exists
    const affiliator = await prisma.user.findUnique({
      where: { uuid: affiliatorUuid, role: Role.AFFILIATOR }
    });

    if (!affiliator) {
      res.status(400).json({ success: false, message: 'Affiliator not found' });
      return;
    }

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

    const formattedCustomer = {
      uuid: newCustomer.uuid,
      fullName: newCustomer.fullName,
      phoneNumber: newCustomer.phoneNumber,
      fullAddress: newCustomer.fullAddress,
      affiliatorUuid: newCustomer.affiliatorUuid,
      affiliatorName: newCustomer.affiliator.fullName,
      createdAt: newCustomer.createdAt
    };

    res.status(201).json({
      success: true,
      data: formattedCustomer
    });
  } catch (error: any) {
    console.error('Create customer error:', error);
    
    // Handle Prisma errors with more detailed messages
    if (error.code === 'P2000') {
      res.status(400).json({ 
        success: false, 
        message: 'Validation error', 
        errors: [{
          path: error.meta?.column_name || 'unknown',
          message: `The provided value for the field '${error.meta?.column_name || 'unknown'}' is too long`
        }]
      });
      return;
    }
    
    // Handle other Prisma errors
    if (error.code && error.code.startsWith('P')) {
      res.status(400).json({ 
        success: false, 
        message: 'Database error', 
        error: {
          code: error.code,
          message: error.message,
          meta: error.meta
        }
      });
      return;
    }
    
    // Default error response for unhandled errors
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { uuid } = req.params;
    const { fullName, phoneNumber, fullAddress, affiliatorUuid } = req.body;

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { uuid }
    });

    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found' });
      return;
    }

    // Check if affiliator exists and if affiliation is being changed
    if (affiliatorUuid && affiliatorUuid !== customer.affiliatorUuid) {
      const affiliator = await prisma.user.findUnique({
        where: { uuid: affiliatorUuid, role: Role.AFFILIATOR }
      });

      if (!affiliator) {
        res.status(400).json({ success: false, message: 'Affiliator not found' });
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (fullName) updateData.fullName = fullName;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (fullAddress) updateData.fullAddress = fullAddress;
    if (affiliatorUuid) updateData.affiliatorUuid = affiliatorUuid;

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

    const formattedCustomer = {
      uuid: updatedCustomer.uuid,
      fullName: updatedCustomer.fullName,
      phoneNumber: updatedCustomer.phoneNumber,
      fullAddress: updatedCustomer.fullAddress,
      affiliatorUuid: updatedCustomer.affiliatorUuid,
      affiliatorName: updatedCustomer.affiliator.fullName,
      createdAt: updatedCustomer.createdAt
    };

    res.status(200).json({
      success: true,
      data: formattedCustomer
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { uuid } = req.params;

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { uuid }
    });

    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found' });
      return;
    }

    // Delete customer
    await prisma.customer.delete({ where: { uuid } });

    res.status(204).send();
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Get all unique years from customer createdAt dates
 * Returns an array of years as strings
 */
export const getCustomerYears = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    logger.info('Getting all unique customer years');
    
    const years = await customerService.getCustomerYears();
    
    res.status(200).json({
      success: true,
      data: years
    });
  } catch (error) {
    logger.error('Get customer years error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
