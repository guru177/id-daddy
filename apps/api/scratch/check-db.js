
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const templates = await prisma.template.findMany();
  console.log('Templates in DB:', JSON.stringify(templates, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
