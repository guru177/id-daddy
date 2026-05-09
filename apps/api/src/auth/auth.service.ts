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

    return this.issueTokens({
      id: user.id,
      workspaceId: user.workspaceId,
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
              startDate: new Date()
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
      email: admin.email,
      role: admin.role
    });
  }

  async getProfile(user: AuthUser) {
    return this.prisma.runAsPlatform(async (tx) => {
      const dbUser = await tx.user.findUnique({
        where: { id: user.id },
        include: { workspace: { select: { name: true } } }
      });
      if (!dbUser) throw new UnauthorizedException();
      return {
        id: dbUser.id,
        email: dbUser.email,
        phone: dbUser.phone,
        role: dbUser.role,
        workspaceName: dbUser.workspace?.name ?? "Super Admin"
      };
    });
  }

  async updateProfile(user: AuthUser, dto: { password?: string }) {
    return this.prisma.runAsPlatform(async (tx) => {
      const data: any = {};
      if (dto.password) {
        data.passwordHash = await hash(
          dto.password,
          Number(this.config.get<string>("BCRYPT_ROUNDS", "12"))
        );
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

    return { accessToken, refreshToken, user };
  }
}
