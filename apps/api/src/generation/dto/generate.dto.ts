import { IsArray, IsObject, IsOptional, IsUUID } from "class-validator";

export class GenerateDto {
  @IsUUID()
  templateId!: string;

  @IsArray()
  @IsUUID("4", { each: true })
  @IsOptional()
  recordIds?: string[];

  @IsObject()
  @IsOptional()
  grid?: {
    pageSize?: "A4" | "LETTER";
    columns: number;
    rows: number;
    marginMm: number;
    gapMm: number;
  };
}
