import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { hash } from "bcryptjs";
import { AuthUser } from "@id-daddy/shared";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: AuthUser) {
    return this.prisma.runScoped(user, async (tx) => {
      const [data, total] = await Promise.all([
        tx.user.findMany({
          where: user.role === "SUPER_ADMIN" ? {} : { workspaceId: user.workspaceId },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            workspaceId: true,
            email: true,
            role: true,
            createdAt: true,
            workspace: { select: { id: true, name: true } }
          }
        }),
        tx.user.count({ where: user.role === "SUPER_ADMIN" ? {} : { workspaceId: user.workspaceId } })
      ]);

      return { data, total };
    });
  }

  async create(user: AuthUser, dto: CreateUserDto) {
    if (!user.workspaceId) {
      throw new BadRequestException("Company users require a workspace");
    }
    if (dto.role === "SUPER_ADMIN") {
      throw new BadRequestException("Cannot create a super admin from a workspace");
    }

    const email = dto.email.trim().toLowerCase();
    const passwordHash = await hash(dto.password, Number(process.env.BCRYPT_ROUNDS ?? 12));

    return this.prisma.runScoped(user, async (tx) => {
      const existing = await tx.user.findUnique({ where: { email } });
      if (existing) {
        throw new ConflictException("Email is already registered");
      }

      return tx.user.create({
        data: {
          workspaceId: user.workspaceId,
          email,
          passwordHash,
          role: dto.role
        },
        select: { id: true, workspaceId: true, email: true, role: true, createdAt: true }
      });
    });
  }

  async update(user: AuthUser, id: string, dto: UpdateUserDto) {
    if (dto.role === "SUPER_ADMIN") {
      throw new BadRequestException("Cannot assign super admin role from a workspace");
    }

    const passwordHash = dto.password
      ? await hash(dto.password, Number(process.env.BCRYPT_ROUNDS ?? 12))
      : undefined;

    return this.prisma.runScoped(user, async (tx) => {
      const existing = await tx.user.findFirst({
        where: { id, workspaceId: user.workspaceId }
      });
      if (!existing) {
        throw new NotFoundException("User not found");
      }

      return tx.user.update({
        where: { id },
        data: { role: dto.role, passwordHash },
        select: { id: true, workspaceId: true, email: true, role: true, createdAt: true }
      });
    });
  }
}
