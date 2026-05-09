import { Body, Controller, Get, Patch, Post } from "@nestjs/common";
import { AuthUser } from "@id-daddy/shared";
import { CurrentUser } from "../common/current-user.decorator";
import { Public } from "../common/public.decorator";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Public()
  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.auth.registerWorkspace(dto);
  }

  @Get("profile")
  getProfile(@CurrentUser() user: AuthUser) {
    return this.auth.getProfile(user);
  }

  @Patch("profile")
  updateProfile(@CurrentUser() user: AuthUser, @Body() dto: any) {
    return this.auth.updateProfile(user, dto);
  }
}
