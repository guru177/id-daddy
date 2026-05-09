import { Allow, IsObject, IsOptional, IsString, MinLength } from "class-validator";

export class UpdateTemplateDto {
  @IsString()
  @MinLength(2)
  @IsOptional()
  name?: string;

  @IsObject()
  @IsOptional()
  @Allow()
  design?: Record<string, any>;
}
