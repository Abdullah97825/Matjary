import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();

export async function main() {
  console.log('🌱 Starting initial seeding...');

  try {
    const existingAdmin = await prisma.user.findFirst({
      where: { role: Role.ADMIN }
    });

    if (!existingAdmin) {
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      await prisma.user.create({
        data: {
          email: process.env.ADMIN_EMAIL || 'admin@example.com',
          name: "Admin User",
          password: hashedPassword,
          role: Role.ADMIN,
          phone: process.env.ADMIN_PHONE || "+1234567890",
        }
      });
      console.log('✅ Admin user created successfully');
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    // Check if Show landing page setting exists
    const showLandingPageSetting = await prisma.settings.findFirst({
      where: { slug: 'show-landing-page' }
    });

    if (!showLandingPageSetting) {
      await prisma.settings.create({
        data: {
          name: 'Show landing page',
          slug: 'show-landing-page',
          value: 'true'
        }
      });
      console.log('✅ Show landing page setting created successfully');
    } else {
      console.log('ℹ️ Show landing page setting already exists');
    }

    // Check if Order Prefix setting exists
    const orderPrefixSetting = await prisma.settings.findFirst({
      where: { slug: 'order_prefix' }
    });

    if (!orderPrefixSetting) {
      await prisma.settings.create({
        data: {
          name: 'Order Prefix',
          slug: 'order_prefix',
          value: 'M'
        }
      });
      console.log('✅ Order prefix setting created successfully');
    } else {
      console.log('ℹ️ Order prefix setting already exists');
    }
  } catch (error) {
    console.error('❌ Error during initial seeding:', error);
    throw error;
  }
}

// Only run if called directly
if (require.main === module) {
  main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}