import { Body, Controller, Post } from "@nestjs/common";
import { AuthUser } from "@id-daddy/shared";
import { CurrentUser } from "../common/current-user.decorator";
import { Roles } from "../common/roles.decorator";
import { GenerateDto } from "./dto/generate.dto";
import { GenerationService } from "./generation.service";

@Controller("generate")
export class GenerationController {
  constructor(private readonly generation: GenerationService) {}

  @Post()
  @Roles("COMPANY_ADMIN", "STAFF")
  create(@CurrentUser() user: AuthUser, @Body() dto: GenerateDto) {
    return this.generation.enqueue(user, dto);
  }
}
