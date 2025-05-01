import { PrismaClient, Role } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export async function main() {
  console.log('🌱 Starting admin seeding...');
  const hashedPassword = await bcrypt.hash("admin123", 10)

  await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@example.com" },
      update: {},
      create: {
        email: "admin@example.com",
        name: "Admin User",
        password: hashedPassword,
        role: Role.ADMIN,
        phone: "+1234567890",
      },
    }),

    prisma.user.upsert({
      where: { email: "sarah@example.com" },
      update: {},
      create: {
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        password: hashedPassword,
        role: Role.ADMIN,
        phone: "+1234567890",
      },
    }),
  ])
  console.log('✅ Admin seeding completed');
}

// Only run if called directly
if (require.main === module) {
  main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
      console.error(e)
      await prisma.$disconnect()
      process.exit(1)
    })
} 