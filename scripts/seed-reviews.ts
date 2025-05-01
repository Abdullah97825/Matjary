import { prisma } from '@/lib/prisma';
import { faker } from '@faker-js/faker';

export async function seedReviews() {
  try {
    console.log('Starting review seeding...');
    
    console.log('Fetching users and products...');
    const products = await prisma.product.findMany();
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users and ${products.length} products`);

    console.log('Creating test orders...');
    let orderCount = 0;
    
    // Track which products each user has reviewed
    const userReviews = new Map<string, Set<string>>();
    
    // Create some test orders first
    for (const user of users) {
      // Skip Sarah as we'll handle her reviews separately
      if (user.email === 'sarah@example.com') continue;

      userReviews.set(user.id, new Set());
      const numOrders = faker.number.int({ min: 1, max: 3 });
      
      for (let i = 0; i < numOrders; i++) {
        // Each order has 1-3 products
        const orderProducts = faker.helpers.arrayElements(
          products.filter(p => !userReviews.get(user.id)?.has(p.id)),
          { min: 1, max: 3 }
        );
        
        if (orderProducts.length === 0) continue;
        
        await prisma.order.create({
          data: {
            userId: user.id,
            status: 'COMPLETED',
            recipientName: user.name || faker.person.fullName(),
            phone: faker.phone.number(),
            shippingAddress: faker.location.streetAddress(),
            items: {
              create: orderProducts.map(product => ({
                productId: product.id,
                quantity: faker.number.int({ min: 1, max: 3 }),
                price: product.price
              }))
            }
          }
        });
        orderCount++;
      }
    }
    console.log(`Created ${orderCount} orders`);

    console.log('Fetching created orders...');
    const orders = await prisma.order.findMany({
      include: {
        items: true,
        user: true
      }
    });
    console.log(`Found ${orders.length} orders to process for reviews`);

    let reviewCount = 0;
    console.log('Creating reviews...');
    
    // Create reviews for completed orders
    for (const order of orders) {
      if (order.status === 'COMPLETED') {
        for (const item of order.items) {
          // Check if user has already reviewed this product
          if (userReviews.get(order.userId)?.has(item.productId)) {
            continue;
          }
          
          // 80% chance to leave a review
          if (Math.random() < 0.8) {
            await prisma.review.create({
              data: {
                rating: faker.number.int({ min: 3, max: 5 }),
                title: faker.commerce.productAdjective(),
                content: faker.lorem.paragraph(),
                userId: order.userId,
                productId: item.productId,
                orderId: order.id
              }
            });
            userReviews.get(order.userId)?.add(item.productId);
            reviewCount++;
          }
        }
      }
    }

    // Add reviews for Sarah (second admin)
    const sarah = await prisma.user.findFirst({
      where: { email: 'sarah@example.com' }
    });

    if (sarah && !userReviews.has(sarah.id)) {
      userReviews.set(sarah.id, new Set());
      const sarahProducts = faker.helpers.arrayElements(products, { min: 5, max: 8 });
      
      const order = await prisma.order.create({
        data: {
          userId: sarah.id,
          status: 'COMPLETED',
          recipientName: sarah.name,
          phone: faker.phone.number(),
          shippingAddress: faker.location.streetAddress(),
          items: {
            create: sarahProducts.map(product => ({
              productId: product.id,
              quantity: faker.number.int({ min: 1, max: 3 }),
              price: product.price
            }))
          }
        }
      });

      // Create reviews for Sarah's products
      for (const product of sarahProducts) {
        await prisma.review.create({
          data: {
            rating: faker.number.int({ min: 4, max: 5 }), // Sarah leaves good reviews
            title: faker.commerce.productAdjective(),
            content: faker.lorem.paragraph(),
            userId: sarah.id,
            productId: product.id,
            orderId: order.id
          }
        });
        userReviews.get(sarah.id)?.add(product.id);
        reviewCount++;
      }
    }

    console.log(`Created ${reviewCount} reviews`);

    console.log('Updating product ratings...');
    let updatedProducts = 0;
    
    const productsWithReviews = await prisma.product.findMany({
      where: {
        reviews: {
          some: {}
        }
      }
    });

    for (const product of productsWithReviews) {
      const stats = await prisma.review.aggregate({
        where: {
          productId: product.id
        },
        _avg: {
          rating: true
        },
        _count: true
      });

      await prisma.product.update({
        where: { id: product.id },
        data: {
          avgRating: stats._avg.rating || 0,
          totalReviews: stats._count
        }
      });
      updatedProducts++;
    }
    console.log(`Updated ratings for ${updatedProducts} products`);

    console.log('✅ Reviews seeded successfully');
  } catch (error: any) {
    console.error('❌ Error seeding reviews:');
    console.error('- Error message:', error?.message);
    console.error('- Error stack:', error?.stack);
    throw error;
  }
}

// Only run if called directly
if (require.main === module) {
  seedReviews()
    .catch((error) => {
      console.error('Error seeding reviews:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
} 