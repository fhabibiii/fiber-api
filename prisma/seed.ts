import { PrismaClient } from '@prisma/client';

enum Role {
  ADMIN = 'ADMIN',
  AFFILIATOR = 'AFFILIATOR'
}
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create admin user if it doesn't exist
  const adminUsername = 'admin';
  const existingAdmin = await prisma.user.findUnique({
    where: { username: adminUsername }
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        username: adminUsername,
        password: hashedPassword,
        fullName: 'Administrator',
        phoneNumber: '081234567890',
        role: Role.ADMIN
      }
    });
    console.log('Admin user created successfully');
  } else {
    console.log('Admin user already exists');
  }

  // Create affiliator user if it doesn't exist
  const affiliatorUsername = 'affiliator';
  const existingAffiliator = await prisma.user.findUnique({
    where: { username: affiliatorUsername }
  });

  if (!existingAffiliator) {
    const hashedPassword = await bcrypt.hash('affiliator123', 10);
    await prisma.user.create({
      data: {
        username: affiliatorUsername,
        password: hashedPassword,
        fullName: 'Affiliator',
        phoneNumber: '081234567890',
        role: Role.AFFILIATOR
      }
    });
    console.log('Affiliator user created successfully');
  } else {
    console.log('Affiliator user already exists');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
