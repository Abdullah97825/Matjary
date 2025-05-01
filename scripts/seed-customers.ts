import { PrismaClient, Role, OrderStatus } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CUSTOMERS_TO_GENERATE = 10;

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
    province: 'New York',
    city: 'New York',
    neighbourhood: 'SoHo',
    nearestLandmark: 'Washington Square Park',
    zipcode: '10012',
    isDefault: false
  }
];

export async function seedCustomers() {
  try {
    console.log('Starting customer seeding...');
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    console.log('Fetching products...');
    const products = await prisma.product.findMany();
    if (products.length === 0) {
      throw new Error('No products found. Please seed products first.');
    }
    console.log(`Found ${products.length} products`);

    for (let i = 0; i < CUSTOMERS_TO_GENERATE; i++) {
      // Create customer
      const customer = await prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet.email().toLowerCase(),
          phone: faker.helpers.fromRegExp('[0-9]{3}-[0-9]{3}-[0-9]{4}'),
          password: hashedPassword,
          role: Role.CUSTOMER,
          image: faker.image.avatar(),
          createdAt: faker.date.past({ years: 2 }),
          orders: {
            create: Array.from({ length: faker.number.int({ min: 0, max: 10 }) }, () => {
              const orderProducts = faker.helpers.arrayElements(products, { min: 1, max: 5 });
              return {
                status: faker.helpers.arrayElement([
                  OrderStatus.PENDING,
                  OrderStatus.ACCEPTED,
                  OrderStatus.COMPLETED,
                  OrderStatus.CANCELLED,
                  OrderStatus.REJECTED
                ]),
                createdAt: faker.date.past({ years: 1 }),
                recipientName: faker.person.fullName(),
                phone: faker.helpers.fromRegExp('[0-9]{3}-[0-9]{3}-[0-9]{4}'),
                shippingAddress: faker.location.streetAddress(true),
                items: {
                  create: orderProducts.map(product => ({
                    quantity: faker.number.int({ min: 1, max: 5 }),
                    price: product.price,
                    productId: product.id
                  }))
                }
              };
            })
          }
        }
      });

      // Create 1-2 addresses for each customer
      const numAddresses = Math.floor(Math.random() * 2) + 1;
      const addresses = sampleAddresses.slice(0, numAddresses);
      
      for (const [index, address] of addresses.entries()) {
        await prisma.address.create({
          data: {
            ...address,
            isDefault: index === 0, // First address is default
            userId: customer.id
          }
        });
      }
      
      if (i % 10 === 0) {
        console.log(`Created ${i + 1} customers with addresses...`);
      }
    }

    const totalCustomers = await prisma.user.count({
      where: { role: Role.CUSTOMER }
    });
    const totalAddresses = await prisma.address.count();

    console.log(`✅ Successfully seeded ${CUSTOMERS_TO_GENERATE} customers`);
    console.log(`📊 Total customers in database: ${totalCustomers}`);
    console.log(`📍 Total addresses created: ${totalAddresses}`);
  } catch (error: any) {
    console.error('❌ Error seeding customers:');
    console.error('- Error message:', error?.message);
    throw error;
  }
} 