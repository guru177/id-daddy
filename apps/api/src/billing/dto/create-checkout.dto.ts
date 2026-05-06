import { IsEnum } from "class-validator";
import { PLANS, Plan } from "@id-daddy/shared";

export class CreateCheckoutDto {
  @IsEnum(PLANS)
  plan!: Exclude<Plan, "FREE">;
}
