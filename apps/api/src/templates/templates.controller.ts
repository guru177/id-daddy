import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { AuthUser } from "@id-daddy/shared";
import { CurrentUser } from "../common/current-user.decorator";
import { Roles } from "../common/roles.decorator";
import { CreateTemplateDto } from "./dto/create-template.dto";
import { UpdateTemplateDto } from "./dto/update-template.dto";
import { TemplatesService } from "./templates.service";

@Controller("templates")
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @Get()
  @Roles("SUPER_ADMIN", "COMPANY_ADMIN", "STAFF", "VIEWER")
  list(@CurrentUser() user: AuthUser) {
    return this.templates.list(user);
  }

  @Post()
  @Roles("SUPER_ADMIN", "COMPANY_ADMIN")
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTemplateDto) {
    console.log(`[Templates] Creating template "${dto.name}" for user ${user.email} (Role: ${user.role})`);
    return this.templates.create(user, dto);
  }

  @Patch(":id")
  @Roles("SUPER_ADMIN", "COMPANY_ADMIN")
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: UpdateTemplateDto) {
    return this.templates.update(user, id, dto);
  }

  @Delete(":id")
  @Roles("SUPER_ADMIN", "COMPANY_ADMIN")
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.templates.remove(user, id);
  }

  @Post(":id/promote")
  @Roles("SUPER_ADMIN")
  promote(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.templates.promoteToGlobal(user, id);
  }

  @Post(":id/demote")
  @Roles("SUPER_ADMIN")
  demote(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.templates.removeFromGlobal(user, id);
  }
}
