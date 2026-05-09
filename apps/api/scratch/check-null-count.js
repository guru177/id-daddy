
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const count = await prisma.template.count({ where: { workspaceId: null } });
  console.log('Templates with null workspaceId:', count);
}

check().catch(console.error).finally(() => prisma.$disconnect());
