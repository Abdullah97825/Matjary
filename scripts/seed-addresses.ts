import { PrismaClient, Role } from '@prisma/client';
const prisma = new PrismaClient();

const sampleAddresses = [
  {
    country: 'United States',
    province: 'California',
    city: 'San Francisco',
    neighbourhood: 'Mission District',
    nearestLandmark: 'Mission Dolores Park',
    zipcode: '94110',
    isDefault: true
  },
  {
    country: 'United States',
    province: 'California',
    city: 'San Francisco',
    neighbourhood: 'Hayes Valley',
    nearestLandmark: 'Patricia\'s Green',
    zipcode: '94102',
    isDefault: false
  },
  {
    country: 'United States',
    province: 'New York',
    city: 'New York',
    neighbourhood: 'SoHo',
    nearestLandmark: 'Washington Square Park',
    zipcode: '10012',
    isDefault: false
  }
];

export async function seedAddresses() {
  try {
    console.log('Starting address seeding...');
    
    // Get all users (both customers and admins)
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users to seed addresses for`);

    let addressCount = 0;
    for (const user of users) {
      // Admins get all addresses, customers get 1-2 random addresses
      const numAddresses = user.role === Role.ADMIN 
        ? sampleAddresses.length 
        : Math.floor(Math.random() * 2) + 1;
      
      const addresses = sampleAddresses.slice(0, numAddresses);
      
      for (const [index, address] of addresses.entries()) {
        await prisma.address.create({
          data: {
            ...address,
            // For admins, only first address is default
            // For customers, keep original isDefault value
            isDefault: user.role === Role.ADMIN ? index === 0 : address.isDefault,
            userId: user.id
          }
        });
        addressCount++;
      }
    }

    console.log(`✅ Created ${addressCount} addresses for ${users.length} users`);
  } catch (error: any) {
    console.error('❌ Error seeding addresses:');
    console.error('- Error message:', error?.message);
    throw error;
  }
} 