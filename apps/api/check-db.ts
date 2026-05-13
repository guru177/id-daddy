import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.appRelease.findMany()
  .then(r => console.log(JSON.stringify(r)))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
