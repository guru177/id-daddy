import { Controller, Get, Post, UploadedFile, UseInterceptors, Body, ParseFilePipe, MaxFileSizeValidator } from "@nestjs/common";
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
