import { Controller, Get, Param } from "@nestjs/common";
import { AuthUser } from "@id-daddy/shared";
import { CurrentUser } from "../common/current-user.decorator";
import { Roles } from "../common/roles.decorator";
import { ExportsService } from "./exports.service";

@Controller("exports")
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get()
  @Roles("COMPANY_ADMIN", "STAFF", "VIEWER")
  list(@CurrentUser() user: AuthUser) {
    return this.exportsService.list(user);
  }

  @Get(":id/download")
  @Roles("COMPANY_ADMIN", "STAFF")
  download(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.exportsService.download(user, id);
  }
}
