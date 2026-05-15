import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { compare, hash } from "bcryptjs";
import { AuthResponse, AuthUser } from "@id-daddy/shared";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService
  ) {}

  async login(dto: LoginDto): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.runAsPlatform((tx) =>
      tx.user.findUnique({
        where: { email },
        include: { workspace: true }
      })
    );

    if (!user || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid email or password");
    }

    if (user.workspace && user.workspace.status !== "ACTIVE") {
      throw new ForbiddenException("Workspace is not active");
    }

    // Check subscription expiration only for regular clients
    if (user.workspaceId && user.workspaceId !== "") {
      const subscription = await this.prisma.runAsPlatform((tx) =>
        tx.subscription.findUnique({ where: { workspaceId: user.workspaceId! } })
      );

      if (subscription?.endDate && new Date() > subscription.endDate) {
        throw new ForbiddenException(
          "Your trial or subscription has expired. Please contact the administrator for upgradation or renewal."
        );
      }
    }

    // If Super Admin has no workspace, OR is in a client's workspace, fix it by re-assigning them
    if (user.role === "SUPER_ADMIN") {
      let needsReassignment = !user.workspaceId;

      if (user.workspaceId) {
        const wsUsersCount = await this.prisma.runAsPlatform((tx) => 
          tx.user.count({ where: { workspaceId: user.workspaceId, role: { not: "SUPER_ADMIN" } } })
        );
        if (wsUsersCount > 0) {
          needsReassignment = true;
        }
      }

      if (needsReassignment) {
        const platformWorkspace = await this.prisma.runAsPlatform(async (tx) => {
          let ws = await tx.workspace.findFirst({ 
            where: { 
              name: "Platform Admin System",
              users: { some: { role: "SUPER_ADMIN" } }
            } 
          });
          if (!ws) {
            ws = await tx.workspace.create({
              data: {
                name: "Platform Admin System",
                plan: "LIFETIME" as any,
                status: "ACTIVE",
                subscription: {
                  create: {
                    plan: "LIFETIME" as any,
                    startDate: new Date()
                  }
                }
              }
            });
          }
          await tx.user.update({
            where: { id: user.id },
            data: { workspaceId: ws.id }
          });
          return ws;
        });
        user.workspaceId = platformWorkspace.id;
        user.workspace = platformWorkspace as any;
      }
    }

    return this.issueTokens({
      id: user.id,
      workspaceId: user.workspaceId,
      workspaceName: user.workspace?.name || (user.role === "SUPER_ADMIN" ? "Platform Admin" : undefined),
      email: user.email,
      role: user.role
    });
  }

  async registerWorkspace(dto: RegisterDto): Promise<AuthResponse> {
    const email = dto.adminEmail.trim().toLowerCase();
    const existing = await this.prisma.runAsPlatform((tx) => tx.user.findUnique({ where: { email } }));
    if (existing) {
      throw new ConflictException("Email is already registered");
    }

    const passwordHash = await hash(
      dto.adminPassword,
      Number(this.config.get<string>("BCRYPT_ROUNDS", "12"))
    );

    const admin = await this.prisma.runAsPlatform(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: dto.workspaceName.trim(),
          plan: "FREE_TRIAL" as any,
          status: "ACTIVE",
          subscription: {
            create: {
              plan: "FREE_TRIAL" as any,
              startDate: new Date(),
              endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
            }
          }
        }
      });

      return tx.user.create({
        data: {
          workspaceId: workspace.id,
          email,
          phone: dto.adminPhone,
          passwordHash,
          role: "COMPANY_ADMIN"
        }
      });
    });

    return this.issueTokens({
      id: admin.id,
      workspaceId: admin.workspaceId,
      workspaceName: dto.workspaceName.trim(),
      email: admin.email,
      role: admin.role
    });
  }

  async getProfile(user: AuthUser) {
    return this.prisma.runAsPlatform(async (tx) => {
      const dbUser = await tx.user.findUnique({
        where: { id: user.id },
        include: { workspace: { select: { name: true, plan: true } } }
      }) as any;
      if (!dbUser) throw new UnauthorizedException();
      
      let subscriptionEnd: string | undefined = undefined;
      if (dbUser.workspaceId && dbUser.workspaceId !== "") {
        const sub = await tx.subscription.findUnique({ where: { workspaceId: dbUser.workspaceId } });
        if (sub?.endDate) subscriptionEnd = sub.endDate.toISOString();
      }
      
      return {
        id: dbUser.id,
        email: dbUser.email,
        phone: dbUser.phone,
        role: dbUser.role,
        workspaceId: dbUser.workspaceId,
        workspaceName: dbUser.workspace?.name ?? (dbUser.role === "SUPER_ADMIN" ? "Platform Admin" : "No Workspace"),
        plan: dbUser.workspace?.plan || (dbUser.role === "SUPER_ADMIN" ? "LIFETIME" : "FREE_TRIAL"),
        subscriptionEnd,
        settings: dbUser.settings
      };
    });
  }

  async updateProfile(user: AuthUser, dto: { password?: string; settings?: any; workspaceName?: string }) {
    return this.prisma.runAsPlatform(async (tx) => {
      const data: any = {};
      if (dto.password) {
        data.passwordHash = await hash(
          dto.password,
          Number(this.config.get<string>("BCRYPT_ROUNDS", "12"))
        );
      }
      if (dto.settings !== undefined) {
        data.settings = dto.settings;
      }

      if (dto.workspaceName && user.workspaceId) {
        await tx.workspace.update({
          where: { id: user.workspaceId },
          data: { name: dto.workspaceName.trim() }
        });
      }

      return tx.user.update({
        where: { id: user.id },
        data
      });
    });
  }

  private async issueTokens(user: AuthUser): Promise<AuthResponse> {
    const payload = {
      sub: user.id,
      workspaceId: user.workspaceId,
      workspaceName: user.workspaceName,
      email: user.email,
      role: user.role
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
        expiresIn: this.config.get<string>("JWT_ACCESS_TTL", "7d")
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
        expiresIn: this.config.get<string>("JWT_REFRESH_TTL", "365d")
      })
    ]);

    // Use workspace plan as primary source of truth
    const workspace = (user.workspaceId && user.workspaceId !== "") ? await this.prisma.runAsPlatform((tx) =>
      tx.workspace.findUnique({ where: { id: user.workspaceId! } })
    ) : null;

    const subscription = (user.workspaceId && user.workspaceId !== "") ? await this.prisma.runAsPlatform((tx) =>
      tx.subscription.findUnique({ where: { workspaceId: user.workspaceId! } })
    ) : null;

    const fullUser: AuthUser = {
      ...user,
      plan: (workspace?.plan || subscription?.plan || (user.role === "SUPER_ADMIN" ? "LIFETIME" : "FREE_TRIAL")) as any,
      subscriptionEnd: subscription?.endDate?.toISOString()
    };

    return { accessToken, refreshToken, user: fullUser };
  }
}
