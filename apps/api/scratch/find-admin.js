
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({ where: { role: 'SUPER_ADMIN' } });
  console.log('Super Admins:', users.map(u => ({ email: u.email, id: u.id })));
}

check().catch(console.error).finally(() => prisma.$disconnect());
