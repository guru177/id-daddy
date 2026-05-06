import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import { AuthUser, Plan } from "@id-daddy/shared";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCheckoutDto } from "./dto/create-checkout.dto";

@Injectable()
export class BillingService {
  private readonly stripe: Stripe;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService
  ) {
    this.stripe = new Stripe(config.getOrThrow<string>("STRIPE_SECRET_KEY"));
  }

  async createCheckoutSession(user: AuthUser, dto: CreateCheckoutDto) {
    if (!user.workspaceId) {
      throw new BadRequestException("Workspace context is required");
    }

    const priceId = this.priceForPlan(dto.plan);
    const apiUrl = this.config.get<string>("API_PUBLIC_URL", "http://localhost:4000");

    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${apiUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${apiUrl}/billing/cancelled`,
      metadata: {
        workspaceId: user.workspaceId,
        plan: dto.plan
      },
      subscription_data: {
        metadata: {
          workspaceId: user.workspaceId,
          plan: dto.plan
        }
      }
    });

    return { url: session.url };
  }

  async handleWebhook(rawBody: Buffer, signature?: string) {
    if (!signature) {
      throw new BadRequestException("Missing Stripe signature");
    }

    const event = this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      this.config.getOrThrow<string>("STRIPE_WEBHOOK_SECRET")
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await this.applyPlan(session.metadata?.workspaceId, session.metadata?.plan as Plan | undefined);
    }

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.created") {
      const subscription = event.data.object as Stripe.Subscription;
      await this.applyPlan(subscription.metadata.workspaceId, subscription.metadata.plan as Plan | undefined);
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      await this.applyPlan(subscription.metadata.workspaceId, "FREE");
    }

    return { received: true };
  }

  private async applyPlan(workspaceId?: string, plan?: Plan) {
    if (!workspaceId || !plan) {
      return;
    }

    await this.prisma.runAsPlatform((tx) =>
      tx.workspace.update({
        where: { id: workspaceId },
        data: {
          plan,
          status: "ACTIVE",
          subscription: {
            upsert: {
              create: { plan, startDate: new Date() },
              update: { plan, endDate: null }
            }
          }
        }
      })
    );
  }

  private priceForPlan(plan: Plan) {
    if (plan === "BASIC") {
      return this.config.getOrThrow<string>("STRIPE_PRICE_BASIC");
    }
    if (plan === "PRO") {
      return this.config.getOrThrow<string>("STRIPE_PRICE_PRO");
    }
    throw new BadRequestException("Free plan does not require checkout");
  }
}
