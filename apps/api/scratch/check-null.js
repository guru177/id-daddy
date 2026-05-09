
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const result = await prisma.$queryRaw`
    SELECT column_name, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'templates' AND column_name = 'workspace_id'
  `;
  console.log('Column details:', result);
}

check().catch(console.error).finally(() => prisma.$disconnect());
