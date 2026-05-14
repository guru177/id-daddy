import { ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthUser, Role } from "@id-daddy/shared";
import { PrismaService } from "../prisma/prisma.service";

interface JwtPayload {
  sub: string;
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

    const user = await this.prisma.runAsPlatform((tx) =>
      tx.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          workspaceId: true,
          email: true,
          role: true,
          workspace: {
            select: {
              name: true,
              plan: true,
              status: true
            }
          }
        }
      })
    );

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    if (user.workspaceId && !user.workspace) {
      throw new UnauthorizedException("Workspace not found");
    }

    if (user.workspace && user.role !== "SUPER_ADMIN") {
      if (user.workspace.status === "BLOCKED") {
        throw new ForbiddenException("WORKSPACE_BLOCKED");
      }
    }

    return {
      id: user.id,
      workspaceId: user.workspaceId,
      workspaceName: user.workspace?.name,
      email: user.email,
      role: user.role as Role,
      plan: user.workspace?.plan as AuthUser["plan"]
    };
  }
}
