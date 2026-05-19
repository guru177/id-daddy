import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { parse } from "csv-parse/sync";
import * as XLSX from "xlsx";
import { AuthUser, UploadMapping } from "@id-daddy/shared";
import { PrismaService } from "../prisma/prisma.service";
import { UploadRecordsDto } from "./dto/upload-records.dto";

import { WorkspacesService } from "../workspaces/workspaces.service";

@Injectable()
export class RecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaces: WorkspacesService
  ) {}

  async list(user: AuthUser) {
    const workspaceId = this.requireWorkspace(user);
    return this.prisma.runScoped(user, async (tx) => {
      const [data, total] = await Promise.all([
        tx.record.findMany({
          where: { workspaceId },
          orderBy: { createdAt: "desc" },
          take: 500
        }),
        tx.record.count({ where: { workspaceId } })
      ]);

      return { data, total };
    });
  }

  async create(user: AuthUser, data: any) {
    const workspaceId = this.requireWorkspace(user);
    return this.prisma.runScoped(user, async (tx) => {
      await this.checkLimit(tx, user, 1);
      return tx.record.create({
        data: {
          workspaceId,
          data: data as Prisma.InputJsonValue,
          imageUrl: this.extractImageUrl(data)
        }
      });
    });
  }

  async update(user: AuthUser, id: string, data: any) {
    const workspaceId = this.requireWorkspace(user);
    return this.prisma.runScoped(user, async (tx) => {
      const existing = await tx.record.findFirst({
        where: { id, workspaceId }
      });
      if (!existing) throw new BadRequestException("Record not found");

      return tx.record.update({
        where: { id },
        data: {
          data: data as Prisma.InputJsonValue,
          imageUrl: this.extractImageUrl(data)
        }
      });
    });
  }

  async bulkUpsert(user: AuthUser, payload: { create: any[]; update: { id: string, data: any }[] }) {
    const workspaceId = this.requireWorkspace(user);
    return this.prisma.runScoped(user, async (tx) => {
      await this.checkLimit(tx, user, payload.create.length);
      
      let created = 0;
      let updated = 0;

      if (payload.create.length > 0) {
        await tx.record.createMany({
          data: payload.create.map(d => ({
            workspaceId,
            data: d as Prisma.InputJsonValue,
            imageUrl: this.extractImageUrl(d)
          }))
        });
        created = payload.create.length;
      }

      for (const updateReq of payload.update) {
         await tx.record.updateMany({
           where: { id: updateReq.id, workspaceId },
           data: {
             data: updateReq.data as Prisma.InputJsonValue,
             imageUrl: this.extractImageUrl(updateReq.data)
           }
         });
         updated++;
      }

      return { created, updated };
    });
  }

  async delete(user: AuthUser, id: string) {
    const workspaceId = this.requireWorkspace(user);
    return this.prisma.runScoped(user, async (tx) => {
      const existing = await tx.record.findFirst({
        where: { id, workspaceId }
      });
      if (!existing) throw new BadRequestException("Record not found");

      return tx.record.delete({
        where: { id }
      });
    });
  }

  async upload(user: AuthUser, file: Express.Multer.File, dto: UploadRecordsDto) {
    const workspaceId = this.requireWorkspace(user);
    this.validateFile(file);

    const rows = this.parseRows(file);
    const mappings = this.parseMappings(dto.mappings);
    const mappedRows = rows.map((row) => this.mapRow(row, mappings));

    if (!mappedRows.length) {
      throw new BadRequestException("No records found in uploaded file");
    }

    return this.prisma.runScoped(user, async (tx) => {
      await this.checkLimit(tx, user, mappedRows.length);
      await tx.record.createMany({
        data: mappedRows.map((data) => ({
          workspaceId,
          data: data as Prisma.InputJsonValue,
          imageUrl: this.extractImageUrl(data)
        }))
      });

      return { inserted: mappedRows.length };
    });
  }

  private parseRows(file: Express.Multer.File): Record<string, unknown>[] {
    const name = file.originalname.toLowerCase();
    if (name.endsWith(".csv")) {
      return parse(file.buffer.toString("utf8"), {
        columns: true,
        skip_empty_lines: true,
        trim: true
      }) as Record<string, unknown>[];
    }

    if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      const workbook = XLSX.read(file.buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    }

    throw new BadRequestException("Only CSV, XLS, and XLSX files are supported");
  }

  private parseMappings(raw?: string): UploadMapping[] {
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as UploadMapping[];
      if (!Array.isArray(parsed)) {
        throw new Error("Mappings must be an array");
      }
      return parsed.filter((mapping) => mapping.source && mapping.target);
    } catch {
      throw new BadRequestException("Invalid mappings JSON");
    }
  }

  private mapRow(row: Record<string, unknown>, mappings: UploadMapping[]) {
    if (!mappings.length) {
      return row;
    }

    return mappings.reduce<Record<string, unknown>>((acc, mapping) => {
      acc[mapping.target] = row[mapping.source] ?? "";
      return acc;
    }, {});
  }

  private extractImageUrl(data: Record<string, unknown>) {
    const value = data.photoUrl ?? data.imageUrl ?? data.photo;
    return typeof value === "string" && /^https?:\/\//i.test(value) ? value : null;
  }

  private validateFile(file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("A CSV or Excel file is required");
    }
    if (!/\.(csv|xlsx|xls)$/i.test(file.originalname)) {
      throw new BadRequestException("Unsupported file type");
    }
  }

  private requireWorkspace(user: AuthUser) {
    if (!user.workspaceId) {
      throw new BadRequestException("Workspace context is required");
    }
    return user.workspaceId;
  }

  private async checkLimit(tx: Prisma.TransactionClient, user: AuthUser, incoming: number) {
    const workspaceId = this.requireWorkspace(user);
    const settings = this.workspaces.getSettings();
    let plan = user.plan;

    if (!plan) {
      const workspace = await tx.workspace.findUnique({
        where: { id: workspaceId },
        select: { plan: true }
      });
      if (!workspace) throw new BadRequestException("Workspace not found");
      plan = workspace.plan as AuthUser["plan"];
    }

    const limit = settings[`${plan}_LIMIT`];

    if (limit == null) return; // Unlimited or unset

    const current = await tx.record.count({ where: { workspaceId } });
    if (current + incoming > limit) {
      throw new BadRequestException(`Record limit reached (${limit}). Please upgrade your plan to add more records.`);
    }
  }
}
