import { IsObject, IsOptional, IsString, MinLength } from "class-validator";
import { IdCardDesign } from "@id-daddy/shared";

export class UpdateTemplateDto {
  @IsString()
  @MinLength(2)
  @IsOptional()
  name?: string;

  @IsObject()
  @IsOptional()
  design?: IdCardDesign;
}
