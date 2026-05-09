const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Migrating existing workspace plans...');
  
  // Using raw SQL to bypass enum constraints during migration
  // 1. Remove default and alter the columns to text temporarily
  await prisma.$executeRawUnsafe(`ALTER TABLE workspaces ALTER COLUMN plan DROP DEFAULT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE workspaces ALTER COLUMN plan TYPE text`);
  await prisma.$executeRawUnsafe(`ALTER TABLE subscriptions ALTER COLUMN plan TYPE text`);
  
  // 2. Update the values in all tables
  await prisma.$executeRawUnsafe(`UPDATE workspaces SET plan = 'FREE_TRIAL' WHERE plan IN ('FREE', 'BASIC', 'PRO')`);
  await prisma.$executeRawUnsafe(`UPDATE subscriptions SET plan = 'FREE_TRIAL' WHERE plan IN ('FREE', 'BASIC', 'PRO')`);
  
  console.log('Migration complete. You can now run prisma db push.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
