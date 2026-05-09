import { ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthUser, Role } from "@id-daddy/shared";
import { PrismaService } from "../prisma/prisma.service";

interface JwtPayload {
  sub: string;
  workspaceId: string | null;
  email: string;
  role: Role;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>("JWT_ACCESS_SECRET")
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    if (!payload.sub || !payload.email || !payload.role) {
      throw new UnauthorizedException("Invalid token payload");
    }

    if (payload.workspaceId && payload.role !== "SUPER_ADMIN") {
      const workspace = await this.prisma.workspace.findUnique({
        where: { id: payload.workspaceId },
        select: { status: true }
      });
      if (workspace?.status === "BLOCKED") {
        throw new ForbiddenException("WORKSPACE_BLOCKED");
      }
    }

    return {
      id: payload.sub,
      workspaceId: payload.workspaceId,
      email: payload.email,
      role: payload.role
    };
  }
}
