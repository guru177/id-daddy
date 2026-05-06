import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

loadEnvFile(resolve(__dirname, "../.env"));
loadEnvFile(resolve(__dirname, "../../../.env"));
const prisma = new PrismaClient();

function loadEnvFile(path: string) {
  if (!existsSync(path)) {
    return;
  }

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (!match || process.env[match[1]]) {
      continue;
    }
    process.env[match[1]] = match[2].replace(/^"|"$/g, "");
  }
}

async function main() {
  const email = process.env.SEED_SUPER_ADMIN_EMAIL ?? "owner@example.com";
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD ?? "ChangeMe123!";
  const passwordHash = await hash(password, Number(process.env.BCRYPT_ROUNDS ?? 12));

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      SELECT
        set_config('app.user_id', '', true),
        set_config('app.workspace_id', '', true),
        set_config('app.role', 'SUPER_ADMIN', true),
        set_config('app.is_super_admin', 'true', true)
    `;

    await tx.user.upsert({
      where: { email },
      update: {
        passwordHash,
        role: "SUPER_ADMIN",
        workspaceId: null
      },
      create: {
        email,
        passwordHash,
        role: "SUPER_ADMIN",
        workspaceId: null
      }
    });
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
