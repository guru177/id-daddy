import { IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { PLANS, Plan, WORKSPACE_STATUSES, WorkspaceStatus } from "@id-daddy/shared";

export class UpdateWorkspaceDto {
  @IsString()
  @MinLength(2)
  @IsOptional()
  name?: string;

  @IsEnum(PLANS)
  @IsOptional()
  plan?: Plan;

  @IsEnum(WORKSPACE_STATUSES)
  @IsOptional()
  status?: WorkspaceStatus;

  @IsString()
  @IsOptional()
  endDate?: string;
}
