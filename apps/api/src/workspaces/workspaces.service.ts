import { ConflictException, Injectable } from "@nestjs/common";
import { hash } from "bcryptjs";
import { AuthUser } from "@id-daddy/shared";
import { PrismaService } from "../prisma/prisma.service";
import { CreateWorkspaceDto } from "./dto/create-workspace.dto";
import { UpdateWorkspaceDto } from "./dto/update-workspace.dto";

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: AuthUser, q?: string) {
    return this.prisma.runScoped(user, async (tx) => {
      const where = q
        ? {
            name: {
              contains: q,
              mode: "insensitive" as const
            }
          }
        : {};

      const [data, total] = await Promise.all([
        tx.workspace.findMany({
          where,
          orderBy: { createdAt: "desc" },
          include: {
            subscription: true,
            _count: { select: { users: true, templates: true, records: true, exports: true } }
          }
        }),
        tx.workspace.count({ where })
      ]);

      return { data, total };
    });
  }

  async create(user: AuthUser, dto: CreateWorkspaceDto) {
    const email = dto.adminEmail.trim().toLowerCase();
    const passwordHash = await hash(dto.adminPassword, Number(process.env.BCRYPT_ROUNDS ?? 12));

    return this.prisma.runScoped(user, async (tx) => {
      const existing = await tx.user.findUnique({ where: { email } });
      if (existing) {
        throw new ConflictException("Admin email is already registered");
      }

      return tx.workspace.create({
        data: {
          name: dto.name.trim(),
          plan: dto.plan,
          status: "ACTIVE",
          subscription: {
            create: {
              plan: dto.plan,
              startDate: new Date()
            }
          },
          users: {
            create: {
              email,
              passwordHash,
              role: "COMPANY_ADMIN"
            }
          }
        },
        include: { users: true, subscription: true }
      });
    });
  }

  async update(user: AuthUser, id: string, dto: UpdateWorkspaceDto) {
    return this.prisma.runScoped(user, async (tx) => {
      return tx.workspace.update({
        where: { id },
        data: {
          name: dto.name?.trim(),
          status: dto.status,
          plan: dto.plan,
          subscription: dto.plan
            ? {
                upsert: {
                  create: { plan: dto.plan, startDate: new Date() },
                  update: { plan: dto.plan, endDate: null }
                }
              }
            : undefined
        },
        include: { subscription: true }
      });
    });
  }
}
