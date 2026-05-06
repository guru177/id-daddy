import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AuthUser } from "@id-daddy/shared";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";

@Injectable()
export class ExportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService
  ) {}

  async list(user: AuthUser) {
    const workspaceId = this.requireWorkspace(user);
    return this.prisma.runScoped(user, async (tx) => {
      const [data, total] = await Promise.all([
        tx.export.findMany({
          where: { workspaceId },
          orderBy: { createdAt: "desc" },
          take: 100
        }),
        tx.export.count({ where: { workspaceId } })
      ]);
      return { data, total };
    });
  }

  async download(user: AuthUser, id: string) {
    this.requireWorkspace(user);
    const exportRecord = await this.prisma.runScoped(user, (tx) =>
      tx.export.findUnique({
        where: { id }
      })
    );

    if (!exportRecord || !exportRecord.fileUrl) {
      throw new NotFoundException("Export is not ready");
    }

    return { url: await this.storage.getSignedDownloadUrl(exportRecord.fileUrl) };
  }

  private requireWorkspace(user: AuthUser) {
    if (!user.workspaceId) {
      throw new BadRequestException("Workspace context is required");
    }
    return user.workspaceId;
  }
}
