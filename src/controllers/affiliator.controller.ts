import { Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../utils/prisma';
import { AuthRequest } from '../types/express';
import { Role } from '../types/express';

// Admin routes
export const getAllAffiliators = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search as string || '';

    const where = search 
      ? {
          role: Role.AFFILIATOR,
          OR: [
            { fullName: { contains: search } },
            { username: { contains: search } },
            { phoneNumber: { contains: search } }
          ]
        }
      : { role: Role.AFFILIATOR };

    const [affiliators, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          uuid: true,
          fullName: true,
          username: true,
          phoneNumber: true,
          createdAt: true,
          _count: {
            select: {
              customers: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    const formattedAffiliators = affiliators.map(aff => ({
      uuid: aff.uuid,
      fullName: aff.fullName,
      username: aff.username,
      phoneNumber: aff.phoneNumber,
      totalCustomers: aff._count ? aff._count.customers : 0,
      createdAt: aff.createdAt
    }));

    res.status(200).json({
      success: true,
      data: formattedAffiliators,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Get all affiliators error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
    return;
  }
};

export const getAffiliatorById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { uuid } = req.params;

    const affiliator = await prisma.user.findUnique({
      where: { uuid, role: Role.AFFILIATOR },
      select: {
        uuid: true,
        fullName: true,
        username: true,
        phoneNumber: true,
        createdAt: true,
        _count: {
          select: {
            customers: true
          }
        }
      }
    });

    if (!affiliator) {
      res.status(404).json({ success: false, message: 'Affiliator not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        ...affiliator,
        totalCustomers: affiliator._count ? affiliator._count.customers : 0
      }
    });
  } catch (error) {
    console.error('Get affiliator by ID error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
    return;
  }
};

export const createAffiliator = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fullName, username, password, phoneNumber } = req.body;

    if (!fullName || !username || !password || !phoneNumber) {
      res.status(400).json({ success: false, message: 'All fields are required' });
      return;
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'Username already exists' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newAffiliator = await prisma.user.create({
      data: {
        fullName,
        username,
        password: hashedPassword,
        phoneNumber,
        role: 'AFFILIATOR'
      },
      select: {
        uuid: true,
        fullName: true,
        username: true,
        phoneNumber: true,
        role: true,
        createdAt: true
      }
    });

    res.status(201).json({
      success: true,
      data: newAffiliator
    });
  } catch (error) {
    console.error('Create affiliator error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
    return;
  }
};

export const updateAffiliator = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { uuid } = req.params;
    const { fullName, phoneNumber, username, password } = req.body;

    // Check if affiliator exists
    const affiliator = await prisma.user.findUnique({
      where: { uuid, role: Role.AFFILIATOR }
    });

    if (!affiliator) {
      res.status(404).json({ success: false, message: 'Affiliator not found' });
      return;
    }

    // If username is being changed, check if it's already taken
    if (username && username !== affiliator.username) {
      const existingUser = await prisma.user.findUnique({ where: { username } });
      if (existingUser) {
        res.status(400).json({ success: false, message: 'Username already exists' });
      return;
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (fullName) updateData.fullName = fullName;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (username) updateData.username = username;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    // Update affiliator
    const updatedAffiliator = await prisma.user.update({
      where: { uuid },
      data: updateData,
      select: {
        uuid: true,
        fullName: true,
        username: true,
        phoneNumber: true,
        role: true,
        createdAt: true
      }
    });

    res.status(200).json({
      success: true,
      data: updatedAffiliator
    });
  } catch (error) {
    console.error('Update affiliator error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
    return;
  }
};

export const deleteAffiliator = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { uuid } = req.params;

    // Check if affiliator exists
    const affiliator = await prisma.user.findUnique({
      where: { uuid, role: Role.AFFILIATOR }
    });

    if (!affiliator) {
      res.status(404).json({ success: false, message: 'Affiliator not found' });
      return;
    }

    // Delete affiliator
    await prisma.user.delete({ where: { uuid } });

    res.status(204).send();
    return;
  } catch (error) {
    console.error('Delete affiliator error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
    return;
  }
};

export const getAffiliatorSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { uuid } = req.params;

    // Check if affiliator exists
    const affiliator = await prisma.user.findUnique({
      where: { uuid, role: Role.AFFILIATOR }
    });

    if (!affiliator) {
      res.status(404).json({ success: false, message: 'Affiliator not found' });
      return;
    }

    // Get customer count and total payments
    const [customerCount, payments] = await Promise.all([
      prisma.customer.count({ where: { affiliatorUuid: uuid } }),
      prisma.payment.findMany({
        where: { affiliatorUuid: uuid },
        select: { amount: true }
      })
    ]);

    const totalPaymentsSinceJoin = payments.reduce((total, payment) => total + payment.amount, 0);

    res.status(200).json({
      success: true,
      data: {
        totalCustomers: customerCount,
        totalPaymentsSinceJoin
      }
    });
  } catch (error) {
    console.error('Get affiliator summary error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
    return;
  }
};
