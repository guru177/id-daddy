import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '@id-daddy/shared';

@Injectable()
export class FoldersService {
  constructor(private prisma: PrismaService) {}

  private requireWorkspace(user: AuthUser) {
    if (!user.workspaceId) throw new BadRequestException('User does not belong to a workspace');
    return user.workspaceId;
  }

  async list(user: AuthUser) {
    return this.prisma.folder.findMany({
      where: { workspaceId: this.requireWorkspace(user) },
      orderBy: { createdAt: 'desc' }
    });
  }

  async create(user: AuthUser, name: string) {
    return this.prisma.folder.create({
      data: {
        name,
        workspaceId: this.requireWorkspace(user)
      }
    });
  }

  async rename(user: AuthUser, id: string, name: string) {
    return this.prisma.folder.updateMany({
      where: { id, workspaceId: this.requireWorkspace(user) },
      data: { name }
    });
  }

  async delete(user: AuthUser, id: string) {
    return this.prisma.folder.deleteMany({
      where: { id, workspaceId: this.requireWorkspace(user) }
    });
  }
}
