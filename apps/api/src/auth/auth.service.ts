import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { compare, hash } from "bcryptjs";
import * as nodemailer from "nodemailer";
import { AuthResponse, AuthUser } from "@id-daddy/shared";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService
  ) {
    const smtpHost = this.config.get<string>("SMTP_HOST");
    const smtpUser = this.config.get<string>("SMTP_USER");
    const smtpPass = this.config.get<string>("SMTP_PASS");

    if (smtpHost && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: this.config.get<number>("SMTP_PORT", 587),
        secure: this.config.get<number>("SMTP_PORT") === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    }
  }

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

    const settings: any = user.settings || {};
    if (settings.isEmailVerified === false) {
      throw new ForbiddenException("VERIFICATION_REQUIRED");
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
                plan: "PRO_1Y" as any,
                status: "ACTIVE",
                subscription: {
                  create: {
                    plan: "PRO_1Y" as any,
                    startDate: new Date(),
                    endDate: new Date("2099-12-31T23:59:59.000Z")
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

  async registerWorkspace(dto: RegisterDto): Promise<AuthResponse | { message: string; email: string }> {
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

      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const settings = {
        isEmailVerified: false,
        verificationCode,
        verificationExpiry: Date.now() + 15 * 60 * 1000 // 15 mins
      };

      if (this.transporter) {
        try {
          await this.transporter.sendMail({
            from: this.config.get<string>("SMTP_FROM", '"ID Daddy" <no-reply@iddaddy.com>'),
            to: email,
            subject: "Verify your ID Daddy account",
            html: this.getVerificationEmailHtml(verificationCode)
          });
        } catch (error) {
          console.error("\n\n[SMTP ERROR]", error, "\n\n");
        }
      }

      // Always log for local testing
      console.log(`\n\n[LOCAL DEBUG] To: ${email} -> Your OTP is: ${verificationCode}\n\n`);

      return tx.user.create({
        data: {
          workspaceId: workspace.id,
          email,
          phone: dto.adminPhone,
          passwordHash,
          role: "COMPANY_ADMIN",
          settings
        }
      });
    });

    return { message: "VERIFICATION_REQUIRED", email };
  }

  async verifyEmail(dto: { email: string; code: string }): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.runAsPlatform((tx) =>
      tx.user.findUnique({ where: { email }, include: { workspace: true } })
    );

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    const settings: any = user.settings || {};
    if (settings.isEmailVerified !== false) {
      throw new ConflictException("Email is already verified");
    }

    if (settings.verificationCode !== dto.code) {
      throw new UnauthorizedException("Invalid verification code");
    }

    if (settings.verificationExpiry && Date.now() > settings.verificationExpiry) {
      throw new UnauthorizedException("Verification code has expired");
    }

    // Mark as verified
    const newSettings = { ...settings, isEmailVerified: true, verificationCode: null, verificationExpiry: null };
    await this.prisma.runAsPlatform((tx) =>
      tx.user.update({
        where: { id: user.id },
        data: { settings: newSettings }
      })
    );

    return this.issueTokens({
      id: user.id,
      workspaceId: user.workspaceId,
      workspaceName: user.workspace?.name || undefined,
      email: user.email,
      role: user.role
    });
  }

  async resendVerification(dto: { email: string }) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.runAsPlatform((tx) =>
      tx.user.findUnique({ where: { email } })
    );

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    const settings: any = user.settings || {};
    if (settings.isEmailVerified !== false) {
      throw new ConflictException("Email is already verified");
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newSettings = {
      ...settings,
      verificationCode,
      verificationExpiry: Date.now() + 15 * 60 * 1000
    };

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.config.get<string>("SMTP_FROM", '"ID Daddy" <no-reply@iddaddy.com>'),
          to: email,
          subject: "Your new verification code",
          html: this.getVerificationEmailHtml(verificationCode)
        });
      } catch (error) {
        console.error("\n\n[SMTP ERROR]", error, "\n\n");
      }
    }

    // Always log for local testing
    console.log(`\n\n[LOCAL DEBUG] To: ${email} -> Your NEW OTP is: ${verificationCode}\n\n`);

    await this.prisma.runAsPlatform((tx) =>
      tx.user.update({
        where: { id: user.id },
        data: { settings: newSettings }
      })
    );

    return { message: "Verification code sent" };
  }

  private getVerificationEmailHtml(code: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #111111; margin: 0; padding: 20px 0; -webkit-font-smoothing: antialiased; }
    table { border-spacing: 0; border-collapse: collapse; width: 100%; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #111111; padding-bottom: 40px; }
    .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
    .header { background: linear-gradient(135deg, #BF953F 0%, #FCF6BA 25%, #B38728 50%, #FBF5B7 75%, #AA771C 100%); padding: 40px 20px; text-align: center; }
    .logo-container { margin-bottom: 16px; }
    .logo-img { display: inline-block; width: 64px; height: 64px; border-radius: 16px; box-shadow: 0 8px 16px rgba(0,0,0,0.15); margin-bottom: 12px; border: 2px solid rgba(255,255,255,0.5); }
    .logo-text { font-size: 22px; font-weight: 900; color: #1a1a1a; letter-spacing: 3px; text-transform: uppercase; margin: 0; }
    .header h1 { color: #1a1a1a; margin: 10px 0 0 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
    .content { padding: 40px; text-align: center; background-color: #ffffff; }
    .content p { font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; color: #444444; }
    .code-box { background: linear-gradient(135deg, #fdfbf7, #f8f4e6); border: 2px solid #d4af37; border-radius: 12px; padding: 24px; margin: 32px auto; max-width: 320px; box-shadow: 0 8px 24px rgba(212, 175, 55, 0.15); }
    .code { font-size: 46px; font-weight: 900; color: #b38728; letter-spacing: 12px; margin: 0; text-align: center; padding-left: 12px; }
    .footer { padding: 30px; text-align: center; background-color: #fafafa; border-top: 1px solid #eeeeee; }
    .footer p { font-size: 13px; color: #999999; margin: 0; line-height: 1.5; }
    @media screen and (max-width: 600px) {
      body { padding: 0 !important; }
      .main { border-radius: 0 !important; }
      .content { padding: 30px 20px !important; }
      .code { font-size: 38px !important; letter-spacing: 8px !important; padding-left: 8px !important; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main" align="center">
      <tr>
        <td class="header">
          <div class="logo-container">
            <img src="https://dev.iddaddy.com/favicon.png" alt="ID Daddy" class="logo-img" onerror="this.style.display='none'">
            <h2 class="logo-text">ID DADDY</h2>
          </div>
          <h1>Verify Your Account</h1>
        </td>
      </tr>
      <tr>
        <td class="content">
          <p>Welcome to ID Daddy! We're thrilled to have you on board. Please use the verification code below to securely confirm your account.</p>
          
          <div class="code-box">
            <div class="code">${code}</div>
          </div>
          
          <p><strong>This code will expire in 15 minutes.</strong><br>If you did not request this, you can safely ignore this email.</p>
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p>Secure Enterprise Portal &copy; ${new Date().getFullYear()} ID Daddy.<br>Need help? Contact your system administrator.</p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
    `;
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
        plan: dbUser.workspace?.plan || (dbUser.role === "SUPER_ADMIN" ? "PRO_1Y" : "FREE_TRIAL"),
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
      plan: (workspace?.plan || subscription?.plan || (user.role === "SUPER_ADMIN" ? "PRO_1Y" : "FREE_TRIAL")) as any,
      subscriptionEnd: subscription?.endDate?.toISOString()
    };

    return { accessToken, refreshToken, user: fullUser };
  }
}
