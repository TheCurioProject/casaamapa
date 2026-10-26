import { prisma } from '../lib/db';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Seeding database...');

  // 1. Seed Admin User
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD;
  if (initialPassword) {
    if (initialPassword.length < 12) throw new Error('ADMIN_INITIAL_PASSWORD must contain at least 12 characters');
    const passwordHash = await bcrypt.hash(initialPassword, 12);
    await prisma.adminUser.upsert({
      where: { username: 'admin' },
      update: {},
      create: { username: 'admin', password: passwordHash },
    });
    console.log('Admin user ensured.');
  } else {
    console.log('ADMIN_INITIAL_PASSWORD not set; admin user seed skipped.');
  }

  // 2. Seed Units
  const units = [
    {
      id: 'tierra',
      name: 'Tierra',
      price: 4000,
      isWholeHouse: false,
    },
    {
      id: 'aire',
      name: 'Aire',
      price: 2000,
      isWholeHouse: false,
    },
    {
      id: 'agua',
      name: 'Agua',
      price: 2000,
      isWholeHouse: false,
    },
    {
      id: 'amapa',
      name: 'Amapa',
      price: 11000,
      isWholeHouse: true,
    }
  ];

  for (const unit of units) {
    await prisma.unit.upsert({
      where: { id: unit.id },
      update: {
        name: unit.name,
        price: unit.price,
        isWholeHouse: unit.isWholeHouse,
      },
      create: unit,
    });
  }
  
  console.log('Units seeded.');

  // 3. Seed Settings if not exists
  const settingsCount = await prisma.settings.count();
  if (settingsCount === 0) {
    await prisma.settings.create({
      data: {
        key: 'default',
        depositPercentage: 50,
        isFullPayment: false,
      }
    });
    console.log('Default settings seeded.');
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
