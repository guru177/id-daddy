import { Controller, Get, Post, Delete, Param, Body, UseGuards, UseInterceptors, UploadedFiles, Res, StreamableFile, Req, BadRequestException } from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { ReleasesService } from "./releases.service";
import { AuthUser } from "@id-daddy/shared";
import { CurrentUser } from "../common/current-user.decorator";
import { Public } from "../common/public.decorator";
import { Roles } from "../common/roles.decorator";
import { StorageService } from "../storage/storage.service";
import { Response } from "express";

@Controller()
export class ReleasesController {
  constructor(
    private readonly releasesService: ReleasesService,
    private readonly storage: StorageService
  ) {}

  // --- Public Update Endpoints (For Electron App) ---

  @Public()
  @Get("updates/latest.yml")
  async getLatestYml(@Res({ passthrough: true }) res: Response) {
    const release = await this.releasesService.getLatestRelease("windows");
    const { buffer, contentType } = await this.storage.getBuffer(release.yamlUrl);
    res.set({
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="latest.yml"`,
    });
    return new StreamableFile(buffer);
  }

  // Handle latest-mac.yml if requested
  @Public()
  @Get("updates/latest-mac.yml")
  async getLatestMacYml(@Res({ passthrough: true }) res: Response) {
    const release = await this.releasesService.getLatestRelease("mac");
    const { buffer, contentType } = await this.storage.getBuffer(release.yamlUrl);
    res.set({
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="latest-mac.yml"`,
    });
    return new StreamableFile(buffer);
  }

  // electron-updater will ask for the installer based on the path in latest.yml
  // e.g. /updates/IdDaddy-Setup-1.0.5.exe
  @Public()
  @Get("updates/:filename")
  async downloadInstaller(@Param("filename") filename: string, @Res({ passthrough: true }) res: Response) {
    // Determine platform from extension (simple heuristic)
    const platform = filename.endsWith('.dmg') || filename.endsWith('.zip') ? 'mac' : 'windows';
    const release = await this.releasesService.getLatestRelease(platform);
    
    // We assume the filename requested is the one in the latest release installerUrl
    // A robust implementation might search db for the installerUrl containing the filename
    const { buffer, contentType } = await this.storage.getBuffer(release.installerUrl);
    
    res.set({
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": buffer.length
    });
    return new StreamableFile(buffer);
  }

  // --- Admin Endpoints (For Web Super Admin) ---

  @Roles("SUPER_ADMIN")
  @Get("admin/releases")
  async listReleases() {
    return this.releasesService.getReleases();
  }

  @Roles("SUPER_ADMIN")
  @Post("admin/releases")
  @UseInterceptors(FileFieldsInterceptor([
    { name: "installer", maxCount: 1 },
    { name: "yaml", maxCount: 1 }
  ]))
  async createRelease(
    @CurrentUser() user: AuthUser,
    @Body() body: any,
    @UploadedFiles() files: { installer?: Express.Multer.File[], yaml?: Express.Multer.File[] }
  ) {
    if (!files.installer?.[0] || !files.yaml?.[0]) {
      throw new BadRequestException("Installer and yaml files are required");
    }

    const { version, releaseNotes, isMandatory, platform } = body;
    if (!version) throw new BadRequestException("Version is required");

    return this.releasesService.createRelease(
      { 
        version, 
        releaseNotes, 
        isMandatory: isMandatory === "true" || isMandatory === true,
        platform 
      },
      files.installer[0],
      files.yaml[0],
      user.id
    );
  }

  @Roles("SUPER_ADMIN")
  @Delete("admin/releases/:id")
  async deleteRelease(@Param("id") id: string) {
    return this.releasesService.deleteRelease(id);
  }
}
