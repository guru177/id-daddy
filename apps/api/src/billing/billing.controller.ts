import { Body, Controller, Headers, Post, Req } from "@nestjs/common";
import { Request } from "express";
import { AuthUser } from "@id-daddy/shared";
import { CurrentUser } from "../common/current-user.decorator";
import { Public } from "../common/public.decorator";
import { Roles } from "../common/roles.decorator";
import { BillingService } from "./billing.service";
import { CreateCheckoutDto } from "./dto/create-checkout.dto";

@Controller("billing")
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Post("checkout")
  @Roles("COMPANY_ADMIN")
  checkout(@CurrentUser() user: AuthUser, @Body() dto: CreateCheckoutDto) {
    return this.billing.createCheckoutSession(user, dto);
  }

  @Public()
  @Post("webhook")
  webhook(@Req() request: Request, @Headers("stripe-signature") signature?: string) {
    return this.billing.handleWebhook(request.body as Buffer, signature);
  }
}
