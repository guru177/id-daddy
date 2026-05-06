import { IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { ROLES, Role } from "@id-daddy/shared";

export class UpdateUserDto {
  @IsEnum(ROLES)
  @IsOptional()
  role?: Role;

  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;
}
