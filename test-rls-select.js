const { PrismaClient } = require('./apps/api/node_modules/@prisma/client');
const prisma = new PrismaClient();
async function run() {
  try {
    const admin = await prisma.user.findUnique({ where: { email: 'admin@retaildaddy.in' }});
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        SELECT
          set_config('app.user_id', ${admin.id}, true),
          set_config('app.workspace_id', ${admin.workspaceId ?? ''}, true),
          set_config('app.role', ${admin.role}, true),
          set_config('app.is_super_admin', ${admin.role === 'SUPER_ADMIN' ? 'true' : 'false'}, true)
      `;
      const templates = await tx.template.findMany({
        where: { workspaceId: null },
        orderBy: [{ isGlobal: "desc" }, { updatedAt: "desc" }]
      });
      console.log('Templates retrieved:', templates.length);
      console.log('List:', templates.map(t => ({ id: t.id, name: t.name, workspaceId: t.workspaceId, isGlobal: t.isGlobal })));
    });
  } catch (e) { console.error('Error:', e.message); }
}
run();
