import { ConflictException, Injectable } from "@nestjs/common";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { hash } from "bcryptjs";
import { AuthUser } from "@id-daddy/shared";
import { PrismaService } from "../prisma/prisma.service";
import { CreateWorkspaceDto } from "./dto/create-workspace.dto";
import { UpdateWorkspaceDto } from "./dto/update-workspace.dto";

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) { }

  private getSettingsPath() {
    return join(process.cwd(), "settings.json");
  }

  private getPaymentsPath() {
    return join(process.cwd(), "payments.json");
  }

  getSettings() {
    try {
      return JSON.parse(readFileSync(this.getSettingsPath(), "utf-8"));
    } catch (err) {
      return {};
    }
  }

  updateSettings(dto: any) {
    const current = this.getSettings();
    const updated = { ...current, ...dto };
    writeFileSync(this.getSettingsPath(), JSON.stringify(updated, null, 2));
    return updated;
  }

  getPayments() {
    try {
      return JSON.parse(readFileSync(this.getPaymentsPath(), "utf-8"));
    } catch (err) {
      return [];
    }
  }

  recordPayment(workspaceId: string, amount: number, currency: string, plan: string) {
    const payments = this.getPayments();
    payments.push({
      id: Math.random().toString(36).substr(2, 9),
      workspaceId,
      amount,
      currency,
      plan,
      createdAt: new Date().toISOString()
    });
    writeFileSync(this.getPaymentsPath(), JSON.stringify(payments, null, 2));
  }

  getRevenueStats() {
    const payments = this.getPayments();
    return payments.reduce((acc: any, p: any) => {
      acc[p.currency] = (acc[p.currency] || 0) + p.amount;
      return acc;
    }, {});
  }

  getWorkspacePayments(workspaceId: string) {
    const payments = this.getPayments();
    return payments.filter((p: any) => p.workspaceId === workspaceId);
  }

  async getExpiringWorkspaces() {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    return this.prisma.workspace.findMany({
      where: {
        plan: "PRO_1Y",
        subscription: {
          endDate: {
            lte: thirtyDaysFromNow,
            gt: new Date()
          }
        }
      },
      include: {
        subscription: true,
        users: { where: { role: "COMPANY_ADMIN" }, take: 1 }
      }
    });
  }

  async list(user: AuthUser, q?: string, page = 1, limit = 10) {
    return this.prisma.runAsPlatform(async (tx) => {
      const baseWhere = {
        users: {
          some: { role: "COMPANY_ADMIN" as const }
        }
      };

      const where = q
        ? {
          AND: [
            baseWhere,
            {
              OR: [
                { name: { contains: q, mode: "insensitive" as const } },
                {
                  users: {
                    some: {
                      OR: [
                        { email: { contains: q, mode: "insensitive" as const } },
                        { phone: { contains: q, mode: "insensitive" as const } }
                      ]
                    }
                  }
                }
              ]
            }
          ]
        }
        : baseWhere;

      const skip = Math.max(0, (page - 1) * limit);
      const take = limit;

      const [workspaces, total] = await Promise.all([
        tx.workspace.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take,
          include: {
            subscription: true,
            _count: { select: { users: true, templates: true, records: true, exports: true } }
          }
        }),
        tx.workspace.count({ where })
      ]);

      // Manually fetch admins for these workspaces to ensure they show up
      const workspaceIds = workspaces.map((w) => w.id);
      const admins = await tx.user.findMany({
        where: {
          workspaceId: { in: workspaceIds },
          role: "COMPANY_ADMIN"
        },
        select: { workspaceId: true, email: true, phone: true }
      });

      const data = workspaces.map((w) => ({
        ...w,
        users: admins.filter((a) => a.workspaceId === w.id)
      }));

      return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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

      const now = new Date();
      let endDate: Date | null = null;
      if (dto.plan === "FREE_TRIAL") {
        endDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      } else if (dto.plan === "PRO_1Y") {
        endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      }

      return tx.workspace.create({
        data: {
          name: dto.name.trim(),
          plan: dto.plan as any,
          status: "ACTIVE",
          subscription: {
            create: {
              plan: dto.plan as any,
              startDate: now,
              endDate
            }
          },
          users: {
            create: {
              email,
              phone: dto.adminPhone,
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
      const now = new Date();
      const settings = this.getSettings();
      let endDate: Date | null = null;
      if (dto.plan === "FREE_TRIAL") {
        const days = settings.FREE_TRIAL_DAYS || 3;
        endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      } else if (dto.plan === "PRO_1Y") {
        const days = settings.PRO_1Y_DAYS || 365;
        endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        this.recordPayment(id, settings.PRO_1Y_PRICE || 0, settings.CURRENCY || "INR", "PRO_1Y");
      } else if (dto.plan === "LIFETIME") {
        this.recordPayment(id, settings.LIFETIME_PRICE || 0, settings.CURRENCY || "INR", "LIFETIME");
      }

      // Allow manual override of endDate if provided, otherwise calculate based on plan change
      if (dto.endDate) {
        endDate = new Date(dto.endDate);
        
        // If it's a renewal (same plan, future date), record a payment
        const existing = await tx.workspace.findUnique({ where: { id }, include: { subscription: true } });
        if (existing?.plan === "PRO_1Y" && endDate > (existing.subscription?.endDate || new Date())) {
           this.recordPayment(id, settings.PRO_1Y_PRICE || 0, settings.CURRENCY || "INR", "PRO_1Y");
        }
      }

      const finalEndDate = endDate;

      // Explicitly handle subscription update to ensure reliability
      if (dto.plan || dto.endDate) {
        const subData = {
          plan: dto.plan ? (dto.plan as any) : undefined,
          endDate: finalEndDate
        };

        await tx.subscription.upsert({
          where: { workspaceId: id },
          create: {
            workspaceId: id,
            plan: (dto.plan || "FREE_TRIAL") as any,
            startDate: now,
            endDate: finalEndDate
          },
          update: subData
        });
      }

      return tx.workspace.update({
        where: { id },
        data: {
          name: dto.name?.trim(),
          status: dto.status,
          plan: dto.plan as any
        },
        include: { subscription: true }
      });
    });
  }
  async remove(user: AuthUser, id: string) {
    return this.prisma.runAsPlatform(async (tx) => {
      return tx.workspace.delete({ where: { id } });
    });
  }

  async resetPassword(user: AuthUser, id: string, password: string) {
    const passwordHash = await hash(password, Number(process.env.BCRYPT_ROUNDS ?? 12));
    return this.prisma.runAsPlatform(async (tx) => {
      return tx.user.updateMany({
        where: { workspaceId: id, role: "COMPANY_ADMIN" },
        data: { passwordHash }
      });
    });
  }
}
