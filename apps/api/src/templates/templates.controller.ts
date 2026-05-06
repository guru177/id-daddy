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
  @Roles("COMPANY_ADMIN", "STAFF", "VIEWER")
  list(@CurrentUser() user: AuthUser) {
    return this.templates.list(user);
  }

  @Post()
  @Roles("COMPANY_ADMIN")
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTemplateDto) {
    return this.templates.create(user, dto);
  }

  @Patch(":id")
  @Roles("COMPANY_ADMIN")
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: UpdateTemplateDto) {
    return this.templates.update(user, id, dto);
  }

  @Delete(":id")
  @Roles("COMPANY_ADMIN")
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.templates.remove(user, id);
  }
}
