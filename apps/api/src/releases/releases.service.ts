import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";

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
    const installerKey = `releases/${data.version}/${installerFile.originalname}`;
    const yamlKey = `releases/${data.version}/${yamlFile.originalname}`;

    const installerUrl = await this.storage.putBuffer(installerKey, installerFile.buffer, "application/octet-stream");
    const yamlUrl = await this.storage.putBuffer(yamlKey, yamlFile.buffer, "application/x-yaml");

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
