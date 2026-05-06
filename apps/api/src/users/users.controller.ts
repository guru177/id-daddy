import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { AuthUser } from "@id-daddy/shared";
import { CurrentUser } from "../common/current-user.decorator";
import { Roles } from "../common/roles.decorator";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Roles("SUPER_ADMIN", "COMPANY_ADMIN")
  list(@CurrentUser() user: AuthUser) {
    return this.users.list(user);
  }

  @Post()
  @Roles("COMPANY_ADMIN")
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateUserDto) {
    return this.users.create(user, dto);
  }

  @Patch(":id")
  @Roles("COMPANY_ADMIN")
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(user, id, dto);
  }
}
