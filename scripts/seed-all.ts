import { PrismaClient } from '@prisma/client';
import { promotionalBanners } from './promotional-banners';
import { main as seedStore } from './seed-store';
import { main as seedAdmin } from './seed-admin';
import { seedReviews } from './seed-reviews';
import { prisma } from '@/lib/prisma';
import { seedAddresses } from './seed-addresses';
import { seedCustomers } from './seed-customers';
import { seedBranches } from './seed-branches';

const prismaClient = new PrismaClient();

async function seedPromotionalBanners() {
  console.log('🎯 Seeding promotional banners...');
  
  // Clear existing banners first
  await prismaClient.promotionalBanner.deleteMany();
  
  // Create new banners
  for (const banner of promotionalBanners) {
    await prismaClient.promotionalBanner.create({
      data: banner
    });
  }
  console.log('✅ Promotional banners seeded');
}

async function main() {
  try {
    console.log('🌱 Starting database seeding...');
    console.log('----------------------------');

    // First clear all data
    console.log('Step 1: Clearing all data...');
    await prisma.review.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.productImage.deleteMany();
    await prisma.productAttachment.deleteMany();
    await prisma.product.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.category.deleteMany();
    await prisma.promotionalBanner.deleteMany();
    await prisma.user.deleteMany();
    await prisma.address.deleteMany();
    console.log('✓ All data cleared');
    console.log('----------------------------');

    console.log('Step 2: Seeding store...');
    await seedStore();
    console.log('✓ Store seeded');
    console.log('----------------------------');

    console.log('Step 3: Seeding admin...');
    await seedAdmin();
    console.log('✓ Admin seeded');
    console.log('----------------------------');

    console.log('Step 4: Seeding addresses...');
    await seedAddresses();
    console.log('✓ Addresses seeded');
    console.log('----------------------------');

    console.log('Step 5: Seeding customers...');
    await seedCustomers();
    console.log('✓ Customers seeded');
    console.log('----------------------------');

    console.log('Step 6: Seeding reviews...');
    await seedReviews();
    console.log('✓ Reviews seeded');
    console.log('----------------------------');

    // Run promotional banners seeding
    await seedPromotionalBanners();
    
    console.log('Step 7: Seeding branches...');
    await seedBranches();
    console.log('✓ Branches seeded');
    console.log('----------------------------');

    console.log('✅ Database seeding completed successfully');
  } catch (error: any) {
    console.error('❌ Error during seeding:');
    console.error('- Error message:', error?.message);
    console.error('- Error stack:', error?.stack);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Failed to seed database');
    process.exit(1);
  }); 