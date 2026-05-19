import { Controller, Get, Post, Put, Delete, Param, UploadedFile, UseInterceptors, Body, ParseFilePipe, MaxFileSizeValidator } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { AuthUser } from "@id-daddy/shared";
import { CurrentUser } from "../common/current-user.decorator";
import { Roles } from "../common/roles.decorator";
import { UploadRecordsDto } from "./dto/upload-records.dto";
import { RecordsService } from "./records.service";

@Controller("records")
export class RecordsController {
  constructor(private readonly records: RecordsService) {}

  @Get()
  @Roles("SUPER_ADMIN", "COMPANY_ADMIN", "STAFF", "VIEWER")
  list(@CurrentUser() user: AuthUser) {
    return this.records.list(user);
  }

  @Post()
  @Roles("SUPER_ADMIN", "COMPANY_ADMIN", "STAFF")
  create(@CurrentUser() user: AuthUser, @Body() data: any) {
    return this.records.create(user, data);
  }

  @Put(":id")
  @Roles("SUPER_ADMIN", "COMPANY_ADMIN", "STAFF")
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() data: any) {
    return this.records.update(user, id, data);
  }

  @Post("bulk-upsert")
  @Roles("SUPER_ADMIN", "COMPANY_ADMIN", "STAFF")
  bulkUpsert(@CurrentUser() user: AuthUser, @Body() payload: { create: any[]; update: { id: string, data: any }[] }) {
    return this.records.bulkUpsert(user, payload);
  }

  @Delete(":id")
  @Roles("SUPER_ADMIN", "COMPANY_ADMIN", "STAFF")
  delete(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.records.delete(user, id);
  }

  @Post("upload")
  @Roles("SUPER_ADMIN", "COMPANY_ADMIN")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 20 * 1024 * 1024 } }))
  upload(
    @CurrentUser() user: AuthUser,
    @Body() dto: UploadRecordsDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 20 * 1024 * 1024 })]
      })
    )
    file: Express.Multer.File
  ) {
    return this.records.upload(user, file, dto);
  }
}
