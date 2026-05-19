import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const superadmin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (!superadmin) {
    console.log("No superadmin found.");
    return;
  }
  console.log("Superadmin:", superadmin.email, "WorkspaceId:", superadmin.workspaceId);

  // Find the actual Platform Admin workspace (one created by the system, likely has LIFETIME plan or the superadmin as a member)
  const allPlatformAdmins = await prisma.workspace.findMany({ where: { name: 'Platform Admin' }, include: { users: true } });
  
  let targetWs = null;
  for (const ws of allPlatformAdmins) {
    console.log("Workspace ID:", ws.id, "Plan:", ws.plan, "Users:", ws.users.length, "HasSuperadmin:", ws.users.some(u => u.role === 'SUPER_ADMIN'));
    if (ws.users.some(u => u.role === 'SUPER_ADMIN')) {
      targetWs = ws;
    }
  }

  // If the superadmin is assigned to a workspace with non-superadmins, let's fix it.
  const currentWs = await prisma.workspace.findUnique({ where: { id: superadmin.workspaceId }, include: { users: true } });
  if (currentWs) {
    const regularUsers = currentWs.users.filter(u => u.role !== 'SUPER_ADMIN');
    if (regularUsers.length > 0) {
      console.log("WARNING: Superadmin is in a workspace with regular users:", regularUsers.map(u => u.email));
      console.log("Creating a new true Platform Admin workspace and re-assigning...");
      
      const newWs = await prisma.workspace.create({
        data: {
          name: "Platform Admin (System)",
          plan: "PRO_1Y",
          status: "ACTIVE",
          subscription: {
            create: {
              plan: "PRO_1Y",
              startDate: new Date(),
              endDate: new Date("2099-12-31T23:59:59.000Z")
            }
          }
        }
      });
      await prisma.user.update({
        where: { id: superadmin.id },
        data: { workspaceId: newWs.id }
      });
      console.log("Re-assigned superadmin to new workspace:", newWs.id);
    } else {
      console.log("Superadmin is in a workspace with NO regular users. All good!");
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
