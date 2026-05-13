import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { AuthUser } from "@id-daddy/shared";
import { CurrentUser } from "../common/current-user.decorator";
import { Roles } from "../common/roles.decorator";
import { CreateWorkspaceDto } from "./dto/create-workspace.dto";
import { UpdateWorkspaceDto } from "./dto/update-workspace.dto";
import { WorkspacesService } from "./workspaces.service";

@Controller("workspaces")
@Roles("SUPER_ADMIN")
export class WorkspacesController {
  constructor(private readonly workspaces: WorkspacesService) { }

  @Get("settings")
  getSettings() {
    return this.workspaces.getSettings();
  }

  @Get("revenue")
  getRevenue() {
    return this.workspaces.getRevenueStats();
  }

  @Get("expiring")
  @Roles("SUPER_ADMIN")
  getExpiring() {
    return this.workspaces.getExpiringWorkspaces();
  }

  @Get(":id/payments")
  getPayments(@Param("id") id: string) {
    return this.workspaces.getWorkspacePayments(id);
  }

  @Patch("settings")
  updateSettings(@Body() dto: any) {
    return this.workspaces.updateSettings(dto);
  }

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query("q") q?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    return this.workspaces.list(user, q, pageNumber, limitNumber);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateWorkspaceDto) {
    return this.workspaces.create(user, dto);
  }

  @Patch(":id")
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: UpdateWorkspaceDto) {
    return this.workspaces.update(user, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.workspaces.remove(user, id);
  }

  @Patch(":id/reset-password")
  resetPassword(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body("password") password?: string
  ) {
    if (!password) throw new Error("Password is required");
    return this.workspaces.resetPassword(user, id, password);
  }
}
