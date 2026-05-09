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
  @Roles("COMPANY_ADMIN", "STAFF", "VIEWER")
  list(@CurrentUser() user: AuthUser) {
    return this.records.list(user);
  }

  @Post()
  @Roles("COMPANY_ADMIN", "STAFF")
  create(@CurrentUser() user: AuthUser, @Body() data: any) {
    return this.records.create(user, data);
  }

  @Put(":id")
  @Roles("COMPANY_ADMIN", "STAFF")
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() data: any) {
    return this.records.update(user, id, data);
  }

  @Delete(":id")
  @Roles("COMPANY_ADMIN", "STAFF")
  delete(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.records.delete(user, id);
  }

  @Post("upload")
  @Roles("COMPANY_ADMIN")
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
