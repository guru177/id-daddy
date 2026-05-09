
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findUnique({ where: { email: 'owner@example.com' } });
  console.log('User details:', user);
}

check().catch(console.error).finally(() => prisma.$disconnect());
