import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function activateAllAccounts() {
    console.log('🔄 Starting account activation process...');

    try {
        // Count inactive accounts before update
        const inactiveCount = await prisma.user.count({
            where: { isActive: false }
        });

        if (inactiveCount === 0) {
            console.log('✅ All accounts are already active. No changes needed.');
            return;
        }

        // Update all inactive accounts
        const result = await prisma.user.updateMany({
            where: { isActive: false },
            data: { isActive: true }
        });

        console.log(`✅ Successfully activated ${result.count} accounts.`);
        console.log(`   Total inactive accounts before: ${inactiveCount}`);
        console.log(`   Total inactive accounts after: 0`);

    } catch (error) {
        console.error('❌ Error activating accounts:', error);
        throw error;
    }
}

// Run the script if called directly
if (require.main === module) {
    activateAllAccounts()
        .then(() => prisma.$disconnect())
        .catch(async (e) => {
            console.error(e);
            await prisma.$disconnect();
            process.exit(1);
        });
} 