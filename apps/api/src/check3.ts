import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const superadmin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (!superadmin) {
    console.log("No superadmin found");
    return;
  }
  
  const wsUsersCount = await prisma.user.count({ 
    where: { workspaceId: superadmin.workspaceId, role: { not: "SUPER_ADMIN" } } 
  });

  console.log("Superadmin workspace ID:", superadmin.workspaceId);
  console.log("Number of non-superadmins in this workspace:", wsUsersCount);
}

main().catch(console.error).finally(() => prisma.$disconnect());
