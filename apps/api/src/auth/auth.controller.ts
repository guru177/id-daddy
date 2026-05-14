import { Body, Controller, Get, Patch, Post } from "@nestjs/common";
import { readFileSync } from "fs";
import { join } from "path";
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

  @Public()
  @Get("system-settings")
  getSystemSettings() {
    try {
      return JSON.parse(readFileSync(join(process.cwd(), "settings.json"), "utf-8"));
    } catch (err) {
      return { 
        PRO_1Y_PRICE: 2999, 
        LIFETIME_PRICE: 9999, 
        CURRENCY: "INR" 
      };
    }
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
