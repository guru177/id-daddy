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
      const res = await tx.template.create({
        data: {
          workspaceId: null,
          name: 'Test RLS Template',
          design: {}
        }
      });
      console.log('Success:', res.id);
    });
  } catch (e) { console.error('Error:', e.message); }
}
run();
