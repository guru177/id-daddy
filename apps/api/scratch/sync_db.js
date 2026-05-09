const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Synchronizing database enum values...');
  
  try {
    // 1. Add new values to the enum if they don't exist
    await prisma.$executeRawUnsafe(`ALTER TYPE plan ADD VALUE IF NOT EXISTS 'FREE_TRIAL'`);
    await prisma.$executeRawUnsafe(`ALTER TYPE plan ADD VALUE IF NOT EXISTS 'PRO_1Y'`);
    await prisma.$executeRawUnsafe(`ALTER TYPE plan ADD VALUE IF NOT EXISTS 'LIFETIME'`);
    console.log('Added new enum values.');
  } catch (e) {
    console.log('Note: ADD VALUE IF NOT EXISTS might not be supported or values already exist.');
  }

  // 2. Update data to use new values
  await prisma.$executeRawUnsafe(`UPDATE workspaces SET plan = 'FREE_TRIAL' WHERE plan::text IN ('FREE', 'BASIC', 'PRO')`);
  await prisma.$executeRawUnsafe(`UPDATE subscriptions SET plan = 'FREE_TRIAL' WHERE plan::text IN ('FREE', 'BASIC', 'PRO')`);
  console.log('Updated existing records.');

  // 3. Update default value for workspaces
  await prisma.$executeRawUnsafe(`ALTER TABLE workspaces ALTER COLUMN plan SET DEFAULT 'FREE_TRIAL'`);
  console.log('Updated default value.');

  console.log('Database synchronization complete.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
