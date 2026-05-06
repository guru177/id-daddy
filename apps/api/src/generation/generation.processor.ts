import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { IdCardDesign } from "@id-daddy/shared";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { GENERATION_QUEUE } from "./generation.constants";
import { GenerateJobData } from "./generation.service";
import { PdfRendererService } from "./pdf-renderer.service";

@Processor(GENERATION_QUEUE, { concurrency: 3 })
export class GenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(GenerationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly renderer: PdfRendererService,
    private readonly storage: StorageService
  ) {
    super();
  }

  async process(job: Job<GenerateJobData>) {
    const actor = {
      id: job.data.actorId,
      workspaceId: job.data.workspaceId,
      role: "COMPANY_ADMIN" as const
    };

    try {
      const payload = await this.prisma.runScoped(actor, async (tx) => {
        await tx.export.update({
          where: { id: job.data.exportId },
          data: { status: "PROCESSING", error: null }
        });

        const template = await tx.template.findUniqueOrThrow({ where: { id: job.data.templateId } });
        const records = await tx.record.findMany({
          where: {
            workspaceId: job.data.workspaceId,
            id: job.data.recordIds?.length ? { in: job.data.recordIds } : undefined
          },
          orderBy: { createdAt: "asc" }
        });

        return {
          design: template.design as unknown as IdCardDesign,
          records: records.map((record) => ({
            ...(record.data as Record<string, unknown>),
            imageUrl: record.imageUrl ?? undefined
          }))
        };
      });

      const pdf = await this.renderer.renderBulkPdf(payload.design, payload.records, job.data.grid);
      const key = `workspaces/${job.data.workspaceId}/exports/${job.data.exportId}.pdf`;
      const fileUrl = await this.storage.putBuffer(key, pdf, "application/pdf");

      await this.prisma.runScoped(actor, async (tx) => {
        await tx.export.update({
          where: { id: job.data.exportId },
          data: { status: "COMPLETED", fileUrl }
        });
        await tx.usageLog.create({
          data: {
            workspaceId: job.data.workspaceId,
            action: "GENERATE_ID",
            count: payload.records.length
          }
        });
      });

      return { fileUrl, records: payload.records.length };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown generation error";
      this.logger.error(`Generation job ${job.id} failed: ${message}`);
      await this.prisma.runScoped(actor, (tx) =>
        tx.export.update({
          where: { id: job.data.exportId },
          data: { status: "FAILED", error: message }
        })
      );
      throw error;
    }
  }
}
