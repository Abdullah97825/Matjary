import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { promotionalBanners } from './promotional-banners';

const prisma = new PrismaClient();

const categories = [
  { 
    name: 'Electronics',
    description: 'Electronic devices and gadgets',
    imageUrl: '/images/placeholder.svg',
    active: true
  },
  { 
    name: 'Clothing',
    description: 'Fashion and apparel',
    imageUrl: '/images/placeholder.svg',
    active: true
  },
  { 
    name: 'Books',
    description: 'Books and literature',
    imageUrl: '/images/placeholder.svg',
    active: true
  },
  { 
    name: 'Home & Garden',
    description: 'Home improvement and garden supplies',
    imageUrl: '/images/placeholder.svg',
    active: true
  },
  { 
    name: 'Sports',
    description: 'Sports equipment and accessories',
    imageUrl: '/images/placeholder.svg',
    active: true
  },
  { 
    name: 'Toys',
    description: 'Toys and games',
    imageUrl: '/images/placeholder.svg',
    active: true
  }
];

const tags = [
  { name: 'wireless' },
  { name: 'bluetooth' },
  { name: 'smart-home' },
  { name: 'gaming' },
  { name: 'outdoor' },
  { name: 'premium' },
  // Add more tags as needed
];

const products = [
  // Electronics (8 products)
  {
    name: 'Wireless Headphones',
    description: 'High-quality wireless headphones with noise cancellation.',
    price: 199.99,
    stock: 50,
    category: 'Electronics',
    images: ['/images/placeholder.svg'],
    isFeatured: true,
    tags: {
      connect: [
        { name: 'wireless' },
        { name: 'bluetooth' }
      ]
    }
  },
  {
    name: 'Smart Watch',
    description: 'Feature-rich smartwatch with health tracking capabilities.',
    price: 299.99,
    stock: 30,
    category: 'Electronics',
    images: ['/images/placeholder.svg'],
    isFeatured: true,
    tags: {
      connect: [
        { name: 'wireless' },
        { name: 'bluetooth' }
      ]
    }
  },
  {
    name: 'Bluetooth Speaker',
    description: 'Portable speaker with exceptional sound quality.',
    price: 129.99,
    stock: 40,
    category: 'Electronics',
    images: ['/images/placeholder.svg'],
    tags: {
      connect: [
        { name: 'wireless' },
        { name: 'bluetooth' }
      ]
    }
  },
  {
    name: 'Tablet',
    description: '10-inch tablet perfect for entertainment and work.',
    price: 399.99,
    stock: 25,
    category: 'Electronics',
    images: ['/images/placeholder.svg'],
    tags: {
      connect: [
        { name: 'wireless' },
        { name: 'bluetooth' }
      ]
    }
  },
  {
    name: 'Gaming Console',
    description: 'Next-gen gaming console with 4K capabilities.',
    price: 499.99,
    stock: 20,
    category: 'Electronics',
    images: ['/images/placeholder.svg'],
    isFeatured: true,
    tags: {
      connect: [
        { name: 'gaming' }
      ]
    }
  },
  {
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse for productivity.',
    price: 49.99,
    stock: 60,
    category: 'Electronics',
    images: ['/images/placeholder.svg'],
    tags: {
      connect: [
        { name: 'wireless' },
        { name: 'bluetooth' }
      ]
    }
  },
  {
    name: 'Smart Home Hub',
    description: 'Central hub for controlling your smart home devices.',
    price: 149.99,
    stock: 35,
    category: 'Electronics',
    images: ['/images/placeholder.svg'],
    tags: {
      connect: [
        { name: 'smart-home' }
      ]
    }
  },
  {
    name: 'Wireless Earbuds',
    description: 'Compact wireless earbuds with charging case.',
    price: 159.99,
    stock: 45,
    category: 'Electronics',
    images: ['/images/placeholder.svg'],
    tags: {
      connect: [
        { name: 'wireless' },
        { name: 'bluetooth' }
      ]
    }
  },

  // Clothing (8 products)
  {
    name: 'Cotton T-Shirt',
    description: 'Comfortable 100% cotton t-shirt available in various colors.',
    price: 24.99,
    stock: 100,
    category: 'Clothing',
    images: ['/images/placeholder.svg'],
    tags: {
      connect: [
        { name: 'outdoor' }
      ]
    }
  },
  {
    name: 'Denim Jeans',
    description: 'Classic denim jeans with a modern fit.',
    price: 79.99,
    stock: 45,
    category: 'Clothing',
    images: ['/images/placeholder.svg'],
    isFeatured: true,
    tags: {
      connect: [
        { name: 'outdoor' }
      ]
    }
  },
  {
    name: 'Hooded Sweatshirt',
    description: 'Warm and cozy hooded sweatshirt for casual wear.',
    price: 54.99,
    stock: 55,
    category: 'Clothing',
    images: ['/images/placeholder.svg'],
    tags: {
      connect: [
        { name: 'outdoor' }
      ]
    }
  },
  {
    name: 'Athletic Shorts',
    description: 'Breathable shorts perfect for workouts.',
    price: 34.99,
    stock: 70,
    category: 'Clothing',
    images: ['/images/placeholder.svg'],
    tags: {
      connect: [
        { name: 'outdoor' }
      ]
    }
  },
  {
    name: 'Winter Jacket',
    description: 'Insulated jacket for cold weather.',
    price: 149.99,
    stock: 30,
    category: 'Clothing',
    images: ['/images/placeholder.svg'],
    isFeatured: true,
    tags: {
      connect: [
        { name: 'outdoor' }
      ]
    }
  },
  {
    name: 'Dress Shirt',
    description: 'Professional dress shirt for formal occasions.',
    price: 59.99,
    stock: 40,
    category: 'Clothing',
    images: ['/images/placeholder.svg'],
    tags: {
      connect: [
        { name: 'outdoor' }
      ]
    }
  },
  {
    name: 'Yoga Pants',
    description: 'Stretchy and comfortable yoga pants.',
    price: 44.99,
    stock: 60,
    category: 'Clothing',
    images: ['/images/placeholder.svg'],
    tags: {
      connect: [
        { name: 'outdoor' }
      ]
    }
  },
  {
    name: 'Summer Dress',
    description: 'Light and breezy summer dress.',
    price: 69.99,
    stock: 35,
    category: 'Clothing',
    images: ['/images/placeholder.svg'],
    tags: {
      connect: [
        { name: 'outdoor' }
      ]
    }
  },

  // Continue with similar patterns for Books, Home & Garden, Sports, and Toys...
  // (Adding 5 products per remaining category to reach 36+ total)

  // Books (5 products)
  {
    name: 'Programming Guide',
    description: 'Comprehensive guide to modern programming practices.',
    price: 49.99,
    stock: 20,
    category: 'Books',
    images: ['/images/placeholder.svg'],
    isFeatured: true,
    tags: {
      connect: [
        { name: 'premium' }
      ]
    }
  },
  // ... (4 more books)

  // Home & Garden (5 products)
  {
    name: 'Garden Tools Set',
    description: 'Complete set of essential garden tools.',
    price: 149.99,
    stock: 25,
    category: 'Home & Garden',
    images: ['/images/placeholder.svg'],
    isFeatured: true,
    tags: {
      connect: [
        { name: 'outdoor' }
      ]
    }
  },
  // ... (4 more home & garden products)

  // Sports (5 products)
  {
    name: 'Yoga Mat',
    description: 'Premium yoga mat with carrying strap.',
    price: 29.99,
    stock: 60,
    category: 'Sports',
    images: ['/images/placeholder.svg'],
    isFeatured: true,
    tags: {
      connect: [
        { name: 'outdoor' }
      ]
    }
  },
  // ... (4 more sports products)

  // Toys (5 products)
  {
    name: 'Building Blocks',
    description: 'Creative building blocks for children.',
    price: 39.99,
    stock: 35,
    category: 'Toys',
    images: ['/images/placeholder.svg'],
    isFeatured: true,
    tags: {
      connect: [
        { name: 'premium' }
      ]
    }
  },
  // ... (4 more toys)
];

export async function main() {
  try {
    console.log('🌱 Starting store seeding...');
    console.log('----------------------------');

    // Create categories
    console.log('Step 1: Creating categories...');
    const createdCategories = await Promise.all(
      categories.map(async (category) => {
        return prisma.category.create({
          data: {
            name: category.name,
            slug: category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            description: category.description,
            imageUrl: category.imageUrl,
            active: category.active
          }
        });
      })
    );
    console.log(`✓ Created ${createdCategories.length} categories`);
    console.log('----------------------------');

    // Create tags
    console.log('Step 2: Creating tags...');
    const createdTags = await Promise.all(
      tags.map(async (tag) => {
        return prisma.tag.create({
          data: { name: tag.name }
        });
      })
    );
    console.log(`✓ Created ${createdTags.length} tags`);
    console.log('----------------------------');

    // Create products
    console.log('Step 3: Creating products...');
    const createdProducts = await Promise.all(
      products.map(async (product) => {
        const category = createdCategories.find(c => c.name === product.category);
        if (!category) throw new Error(`Category ${product.category} not found`);

        const productData = {
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          categoryId: category.id,
          isFeatured: product.isFeatured || false,
          images: {
            create: product.images.map(url => ({ url }))
          },
          tags: {
            connect: product.tags?.connect || []
          }
        };

        return prisma.product.create({
          data: productData
        });
      })
    );
    console.log(`✓ Created ${createdProducts.length} products`);
    console.log('----------------------------');

    // Create promotional banners
    console.log('Step 4: Creating promotional banners...');
    await Promise.all(
      promotionalBanners.map(async (banner, index) => {
        return prisma.promotionalBanner.create({
          data: {
            ...banner,
            order: index
          }
        });
      })
    );
    console.log('✓ Created promotional banners');
    console.log('----------------------------');

    console.log('✅ Store seeding completed successfully');
  } catch (error: any) {
    console.error('❌ Error during store seeding:');
    console.error('- Error message:', error?.message);
    console.error('- Error stack:', error?.stack);
    throw error;
  }
}

// Only run if called directly
if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
} 