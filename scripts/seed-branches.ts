import { PrismaClient, ContactType } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

const sampleBranches = [
  {
    name: "Main Office",
    isMain: true,
    address: "123 Main Street, Downtown",
    mapEnabled: true,
    latitude: 37.7749,
    longitude: -122.4194,
    mapZoomLevel: 14,
    contacts: [
      {
        type: ContactType.PHONE,
        value: "+1 (555) 123-4567",
        label: "Reception",
        isMain: true,
        order: 0
      },
      {
        type: ContactType.EMAIL,
        value: "info@example.com",
        label: "General Inquiries",
        isMain: true,
        order: 1
      }
    ],
    businessHours: [
      { dayOfWeek: 0, isClosed: true }, // Sunday
      { dayOfWeek: 1, openTime: "09:00", closeTime: "17:00", isClosed: false },
      { dayOfWeek: 2, openTime: "09:00", closeTime: "17:00", isClosed: false },
      { dayOfWeek: 3, openTime: "09:00", closeTime: "17:00", isClosed: false },
      { dayOfWeek: 4, openTime: "09:00", closeTime: "17:00", isClosed: false },
      { dayOfWeek: 5, openTime: "09:00", closeTime: "16:00", isClosed: false },
      { dayOfWeek: 6, isClosed: true }  // Saturday
    ],
    sections: [
      {
        title: "About This Branch",
        content: "Our main office serves as the headquarters for all operations.",
        order: 0,
        isEnabled: true
      }
    ]
  },
  {
    name: "Downtown Branch",
    isMain: false,
    address: "456 Market Street",
    mapEnabled: true,
    latitude: 37.7937,
    longitude: -122.3965,
    mapZoomLevel: 15,
    contacts: [
      {
        type: ContactType.PHONE,
        value: "+1 (555) 234-5678",
        label: "Customer Service",
        isMain: true,
        order: 0
      }
    ],
    businessHours: Array(7).fill(null).map((_, i) => ({
      dayOfWeek: i,
      openTime: i === 0 ? undefined : "10:00",
      closeTime: i === 0 ? undefined : "18:00",
      isClosed: i === 0
    }))
  }
];

export async function seedBranches() {
  try {
    console.log('Starting branch seeding...');

    // Clear existing branches
    await prisma.branchSection.deleteMany();
    await prisma.businessHours.deleteMany();
    await prisma.contactDetail.deleteMany();
    await prisma.branch.deleteMany();

    for (const branchData of sampleBranches) {
      await prisma.branch.create({
        data: {
          name: branchData.name,
          isMain: branchData.isMain,
          address: branchData.address,
          mapEnabled: branchData.mapEnabled,
          latitude: branchData.latitude,
          longitude: branchData.longitude,
          mapZoomLevel: branchData.mapZoomLevel,
          contacts: {
            create: branchData.contacts
          },
          businessHours: {
            create: branchData.businessHours
          },
          sections: {
            create: branchData.sections || []
          }
        }
      });
    }

    // Add some random branches
    for (let i = 0; i < 3; i++) {
      await prisma.branch.create({
        data: {
          name: faker.company.name() + " Branch",
          isMain: false,
          address: faker.location.streetAddress(),
          mapEnabled: Math.random() > 0.3,
          latitude: parseFloat(faker.location.latitude().toString()),
          longitude: parseFloat(faker.location.longitude().toString()),
          mapZoomLevel: 14,
          contacts: {
            create: [
              {
                type: ContactType.PHONE,
                value: faker.phone.number(),
                isMain: true,
                order: 0
              },
              {
                type: ContactType.EMAIL,
                value: faker.internet.email().toLowerCase(),
                isMain: false,
                order: 1
              }
            ]
          },
          businessHours: {
            create: Array(7).fill(null).map((_, i) => ({
              dayOfWeek: i,
              openTime: i === 0 ? undefined : "09:00",
              closeTime: i === 0 ? undefined : "17:00",
              isClosed: i === 0
            }))
          }
        }
      });
    }

    const branchCount = await prisma.branch.count();
    console.log(`✅ Seeded ${branchCount} branches successfully`);
  } catch (error: any) {
    console.error('❌ Error seeding branches:', error?.message);
    throw error;
  }
} 