import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const superadmin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (!superadmin) {
    console.log("No superadmin found");
    return;
  }
  console.log("Superadmin email:", superadmin.email);
  console.log("Superadmin workspaceId:", superadmin.workspaceId);

  if (superadmin.workspaceId) {
    const recordsCount = await prisma.record.count({ where: { workspaceId: superadmin.workspaceId } });
    console.log("Records in this workspace:", recordsCount);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
