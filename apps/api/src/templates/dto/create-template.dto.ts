import { Allow, IsDefined, IsObject, IsString, MinLength } from "class-validator";

export class CreateTemplateDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsDefined()
  @IsObject()
  @Allow()
  design!: Record<string, any>;
}
