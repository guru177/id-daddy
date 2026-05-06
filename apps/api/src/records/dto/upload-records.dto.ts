import { IsOptional, IsString } from "class-validator";

export class UploadRecordsDto {
  @IsString()
  @IsOptional()
  mappings?: string;
}
