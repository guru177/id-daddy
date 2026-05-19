import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import * as fs from "fs/promises";

@Injectable()
export class ReleasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService
  ) {}

  async createRelease(
    data: { version: string; releaseNotes?: string; isMandatory?: boolean; platform?: string },
    installerFile: Express.Multer.File,
    yamlFile: Express.Multer.File,
    userId: string
  ) {
    const existing = await this.prisma.appRelease.findUnique({
      where: { version: data.version }
    });
    if (existing) {
      throw new BadRequestException(`Release version ${data.version} already exists.`);
    }

    const installerKey = `releases/${data.version}/${installerFile.originalname}`;
    const yamlKey = `releases/${data.version}/${yamlFile.originalname}`;

    let installerUrl: string;
    let yamlUrl: string;

    try {
      if (installerFile.path) {
        installerUrl = await this.storage.putFile(installerKey, installerFile.path, "application/octet-stream");
      } else {
        installerUrl = await this.storage.putBuffer(installerKey, installerFile.buffer, "application/octet-stream");
      }

      if (yamlFile.path) {
        yamlUrl = await this.storage.putFile(yamlKey, yamlFile.path, "application/x-yaml");
      } else {
        yamlUrl = await this.storage.putBuffer(yamlKey, yamlFile.buffer, "application/x-yaml");
      }
    } finally {
      // Clean up temp files if they exist
      if (installerFile.path) await fs.unlink(installerFile.path).catch(() => {});
      if (yamlFile.path) await fs.unlink(yamlFile.path).catch(() => {});
    }

    return this.prisma.appRelease.create({
      data: {
        version: data.version,
        releaseNotes: data.releaseNotes,
        isMandatory: data.isMandatory,
        platform: data.platform || "windows",
        installerUrl,
        yamlUrl,
        publishedBy: userId
      }
    });
  }

  async getReleases() {
    return this.prisma.appRelease.findMany({
      orderBy: { createdAt: "desc" }
    });
  }

  async deleteRelease(id: string) {
    return this.prisma.appRelease.delete({ where: { id } });
  }

  async getLatestRelease(platform: string = "windows") {
    const release = await this.prisma.appRelease.findFirst({
      where: { platform },
      orderBy: { createdAt: "desc" }
    });
    if (!release) throw new NotFoundException("No release found");
    return release;
  }

  async getReleaseByVersion(version: string) {
    const release = await this.prisma.appRelease.findUnique({
      where: { version }
    });
    if (!release) throw new NotFoundException("Release not found");
    return release;
  }
}
