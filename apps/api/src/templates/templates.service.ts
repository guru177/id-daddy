import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuthUser } from "@id-daddy/shared";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTemplateDto } from "./dto/create-template.dto";
import { UpdateTemplateDto } from "./dto/update-template.dto";

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: AuthUser) {
    const workspaceId = this.requireWorkspace(user);
    return this.prisma.runScoped(user, async (tx) => {
      const [data, total] = await Promise.all([
        tx.template.findMany({
          where: { workspaceId },
          orderBy: { updatedAt: "desc" }
        }),
        tx.template.count({ where: { workspaceId } })
      ]);

      return { data, total };
    });
  }

  async create(user: AuthUser, dto: CreateTemplateDto) {
    const workspaceId = this.requireWorkspace(user);

    return this.prisma.runScoped(user, (tx) =>
      tx.template.create({
        data: {
          workspaceId,
          name: dto.name.trim(),
          design: dto.design as unknown as Prisma.InputJsonValue
        }
      })
    );
  }

  async update(user: AuthUser, id: string, dto: UpdateTemplateDto) {
    this.requireWorkspace(user);

    return this.prisma.runScoped(user, (tx) =>
      tx.template.update({
        where: { id },
        data: {
          name: dto.name?.trim(),
          design: dto.design as unknown as Prisma.InputJsonValue | undefined
        }
      })
    );
  }

  async remove(user: AuthUser, id: string) {
    this.requireWorkspace(user);
    return this.prisma.runScoped(user, async (tx) => {
      await tx.template.delete({ where: { id } });
      return { ok: true };
    });
  }

  private requireWorkspace(user: AuthUser) {
    if (!user.workspaceId) {
      throw new BadRequestException("Workspace context is required");
    }
    return user.workspaceId;
  }
}

