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
    return this.prisma.runScoped(user, async (tx) => {
      const where: Prisma.TemplateWhereInput = user.role === "SUPER_ADMIN"
        ? { workspaceId: null } 
        : {
          OR: [
            { isGlobal: true },
            user.workspaceId ? { workspaceId: user.workspaceId } : { id: 'none' }
          ]
        };
      
      const [data, total] = await Promise.all([
        tx.template.findMany({
          where,
          orderBy: [{ isGlobal: "desc" }, { updatedAt: "desc" }]
        }),
        tx.template.count({ where })
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
    return this.prisma.runScoped(user, async (tx) => {
      await tx.template.delete({ where: { id } });
      return { ok: true };
    });
  }

  async promoteToGlobal(user: AuthUser, id: string) {
    return this.prisma.runScoped(user, (tx) =>
      tx.template.update({
        where: { id },
        data: { isGlobal: true, workspaceId: null }
      })
    );
  }

  async removeFromGlobal(user: AuthUser, id: string) {
    // When removing from global, we might want to assign it back to the admin's workspace
    // or just leave it with null workspace (orphaned but manageable by admin)
    return this.prisma.runScoped(user, (tx) =>
      tx.template.update({
        where: { id },
        data: { isGlobal: false, workspaceId: user.workspaceId }
      })
    );
  }

  private requireWorkspace(user: AuthUser) {
    if (user.role === "SUPER_ADMIN") return null;
    if (!user.workspaceId) {
      throw new BadRequestException("Workspace context is required");
    }
    return user.workspaceId;
  }
}

