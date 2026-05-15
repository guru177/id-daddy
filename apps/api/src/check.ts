import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const u = await prisma.user.findMany({ where: { email: { startsWith: 'admin' } }, include: { workspace: true } });
  console.log(JSON.stringify(u, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
