import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Prisma, PrismaClient } from "@prisma/client";
import { AuthUser } from "@id-daddy/shared";

type TransactionClient = Prisma.TransactionClient;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "warn", "error"]
          : ["warn", "error"]
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async runScoped<T>(
    actor: Pick<AuthUser, "id" | "workspaceId" | "role">,
    fn: (tx: TransactionClient) => Promise<T>
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      await this.applyRlsContext(tx, actor);
      return fn(tx);
    });
  }

  async runAsPlatform<T>(fn: (tx: TransactionClient) => Promise<T>): Promise<T> {
    return this.$transaction(async (tx) => {
      await tx.$executeRaw`
        SELECT
          set_config('app.user_id', '', true),
          set_config('app.workspace_id', '', true),
          set_config('app.role', 'SUPER_ADMIN', true),
          set_config('app.is_super_admin', 'true', true)
      `;
      return fn(tx);
    });
  }

  private async applyRlsContext(
    tx: TransactionClient,
    actor: Pick<AuthUser, "id" | "workspaceId" | "role">
  ) {
    await tx.$executeRaw`
      SELECT
        set_config('app.user_id', ${actor.id}, true),
        set_config('app.workspace_id', ${actor.workspaceId ?? ""}, true),
        set_config('app.role', ${actor.role}, true),
        set_config('app.is_super_admin', ${actor.role === "SUPER_ADMIN" ? "true" : "false"}, true)
    `;
  }
}
