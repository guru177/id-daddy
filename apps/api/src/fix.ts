import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const superadmins = await prisma.user.findMany({ where: { role: 'SUPER_ADMIN' } });
  console.log("SUPER ADMINS:", superadmins);
  
  const adminsWs = await prisma.workspace.findMany({ where: { name: 'Platform Admin' }, include: { users: true } });
  console.log("Platform Admin Workspaces:", JSON.stringify(adminsWs, null, 2));

  // Fix logic
  if (superadmins.length > 0) {
    const superadmin = superadmins[0];
    if (superadmin.workspaceId) {
      const currentWs = await prisma.workspace.findUnique({ where: { id: superadmin.workspaceId }, include: { users: true } });
      if (currentWs) {
        const hasRegularUsers = currentWs.users.some(u => u.role !== 'SUPER_ADMIN');
        if (hasRegularUsers) {
          console.log("Superadmin is in a workspace with regular users. Fixing...");
          // Ensure we don't mess up the regular user's workspace, just create a new one for superadmin
          const newWs = await prisma.workspace.create({
            data: {
              name: "Platform Admin System",
              plan: "LIFETIME",
              status: "ACTIVE",
              subscription: {
                create: { plan: "LIFETIME", startDate: new Date() }
              }
            }
          });
          await prisma.user.update({
            where: { id: superadmin.id },
            data: { workspaceId: newWs.id }
          });
          console.log("Re-assigned superadmin to new workspace:", newWs.id);
        }
      }
    } else {
       // Superadmin has no workspace. We need to create one for them so they don't get assigned to a regular user's workspace
       console.log("Superadmin has NO workspace. Creating one...");
       const newWs = await prisma.workspace.create({
         data: {
           name: "Platform Admin System",
           plan: "LIFETIME",
           status: "ACTIVE",
           subscription: {
             create: { plan: "LIFETIME", startDate: new Date() }
           }
         }
       });
       await prisma.user.update({
         where: { id: superadmin.id },
         data: { workspaceId: newWs.id }
       });
       console.log("Assigned superadmin to new workspace:", newWs.id);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
