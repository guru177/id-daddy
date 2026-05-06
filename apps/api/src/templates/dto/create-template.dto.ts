import { IsObject, IsString, MinLength } from "class-validator";
import { IdCardDesign } from "@id-daddy/shared";

export class CreateTemplateDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsObject()
  design!: IdCardDesign;
}
