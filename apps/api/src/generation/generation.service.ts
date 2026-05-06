import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { AuthUser, PLAN_LIMITS } from "@id-daddy/shared";
import { PrismaService } from "../prisma/prisma.service";
import { GENERATION_QUEUE } from "./generation.constants";
import { GenerateDto } from "./dto/generate.dto";

export interface GenerateJobData {
  workspaceId: string;
  actorId: string;
  exportId: string;
  templateId: string;
  recordIds?: string[];
  grid?: GenerateDto["grid"];
}

@Injectable()
export class GenerationService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(GENERATION_QUEUE) private readonly queue: Queue<GenerateJobData>
  ) {}

  async enqueue(user: AuthUser, dto: GenerateDto) {
    const workspaceId = this.requireWorkspace(user);

    const exportRecord = await this.prisma.runScoped(user, async (tx) => {
      const workspace = await tx.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
      if (workspace.status !== "ACTIVE") {
        throw new ForbiddenException("Workspace is blocked or inactive");
      }

      const recordCount = dto.recordIds?.length
        ? await tx.record.count({ where: { id: { in: dto.recordIds }, workspaceId } })
        : await tx.record.count({ where: { workspaceId } });

      if (recordCount === 0) {
        throw new BadRequestException("No records available for generation");
      }

      const currentMonth = new Date();
      currentMonth.setUTCDate(1);
      currentMonth.setUTCHours(0, 0, 0, 0);
      const used = await tx.usageLog.aggregate({
        where: {
          workspaceId,
          action: "GENERATE_ID",
          createdAt: { gte: currentMonth }
        },
        _sum: { count: true }
      });

      const limit = PLAN_LIMITS[workspace.plan];
      if (limit !== null && (used._sum?.count ?? 0) + recordCount > limit) {
        throw new ForbiddenException(`Monthly plan limit exceeded. ${workspace.plan} allows ${limit} IDs.`);
      }

      await tx.template.findUniqueOrThrow({ where: { id: dto.templateId } });
      return tx.export.create({
        data: {
          workspaceId,
          status: "PENDING"
        }
      });
    });

    await this.queue.add(
      "bulk-id-generation",
      {
        workspaceId,
        actorId: user.id,
        exportId: exportRecord.id,
        templateId: dto.templateId,
        recordIds: dto.recordIds,
        grid: dto.grid
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: { age: 86400, count: 1000 },
        removeOnFail: { age: 604800 }
      }
    );

    return exportRecord;
  }

  private requireWorkspace(user: AuthUser) {
    if (!user.workspaceId) {
      throw new BadRequestException("Workspace context is required");
    }
    return user.workspaceId;
  }
}
