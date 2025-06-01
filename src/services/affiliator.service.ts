import prisma from '../utils/prisma';
import { Role } from '../types/express';
import logger from '../utils/logger';
import bcrypt from 'bcrypt';

export class AffiliatorService {
  async getAllAffiliators(query: any) {
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const search = query.search as string || '';

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

    logger.info(`Fetching affiliators with search: ${search}`);

    const [affiliators, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      }),
      prisma.user.count({ where })
    ]);

    logger.info(`Found ${affiliators.length} affiliators`);

    const formattedAffiliators = affiliators.map(aff => ({
      uuid: aff.uuid,
      fullName: aff.fullName,
      username: aff.username,
      phoneNumber: aff.phoneNumber,
      totalCustomers: aff._count ? aff._count.customers : 0,
      createdAt: aff.createdAt
    }));

    return {
      data: formattedAffiliators,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    };
  }

  async getAffiliatorById(uuid: string) {
    if (!uuid) {
      throw new Error('Affiliator UUID is required');
    }

    logger.info(`Fetching affiliator with UUID: ${uuid}`);

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
      throw new Error('Affiliator not found');
    }

    return {
      ...affiliator,
      totalCustomers: affiliator._count ? affiliator._count.customers : 0
    };
  }

  async createAffiliator(affiliatorData: any) {
    const { fullName, username, password, phoneNumber } = affiliatorData;

    if (!fullName || !username || !password || !phoneNumber) {
      throw new Error('All fields are required');
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    logger.info(`Creating new affiliator with username: ${username}`);
    const newAffiliator = await prisma.user.create({
      data: {
        fullName,
        username,
        password: hashedPassword,
        phoneNumber,
        role: Role.AFFILIATOR
      }
    });

    return {
      uuid: newAffiliator.uuid,
      fullName: newAffiliator.fullName,
      username: newAffiliator.username,
      phoneNumber: newAffiliator.phoneNumber,
      createdAt: newAffiliator.createdAt
    };
  }

  async updateAffiliator(uuid: string, affiliatorData: any) {
    if (!uuid) {
      throw new Error('Affiliator UUID is required');
    }

    // Check if affiliator exists
    const affiliator = await prisma.user.findUnique({
      where: { uuid, role: Role.AFFILIATOR }
    });

    if (!affiliator) {
      throw new Error('Affiliator not found');
    }

    const { fullName, username, password, phoneNumber } = affiliatorData;

    // Check if username is taken by another user
    if (username && username !== affiliator.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username }
      });

      if (existingUser) {
        throw new Error('Username already exists');
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (fullName) updateData.fullName = fullName;
    if (username) updateData.username = username;
    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (phoneNumber) updateData.phoneNumber = phoneNumber;

    logger.info(`Updating affiliator with UUID: ${uuid}`);
    const updatedAffiliator = await prisma.user.update({
      where: { uuid },
      data: updateData,
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

    return {
      ...updatedAffiliator,
      totalCustomers: updatedAffiliator._count ? updatedAffiliator._count.customers : 0
    };
  }

  async deleteAffiliator(uuid: string) {
    if (!uuid) {
      throw new Error('Affiliator UUID is required');
    }

    // Check if affiliator exists
    const affiliator = await prisma.user.findUnique({
      where: { uuid, role: Role.AFFILIATOR }
    });

    if (!affiliator) {
      throw new Error('Affiliator not found');
    }

    // Check if affiliator has customers
    const customerCount = await prisma.customer.count({
      where: { affiliatorUuid: uuid }
    });

    if (customerCount > 0) {
      throw new Error('Cannot delete affiliator with customers');
    }

    logger.info(`Deleting affiliator with UUID: ${uuid}`);
    await prisma.user.delete({ where: { uuid } });
    
    return true;
  }
}

export default new AffiliatorService();
