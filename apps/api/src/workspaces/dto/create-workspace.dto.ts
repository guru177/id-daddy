import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { PLANS, Plan } from "@id-daddy/shared";

export class CreateWorkspaceDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEnum(PLANS)
  @IsOptional()
  plan: Plan = "FREE";

  @IsEmail()
  adminEmail!: string;

  @IsString()
  @MinLength(8)
  adminPassword!: string;
}
