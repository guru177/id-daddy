import { IsEmail, IsEnum, IsString, MinLength } from "class-validator";
import { ROLES, Role } from "@id-daddy/shared";

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsEnum(ROLES)
  role!: Role;
}
