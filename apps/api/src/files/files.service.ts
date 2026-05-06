import { BadRequestException, Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { AuthUser } from "@id-daddy/shared";
import { StorageService } from "../storage/storage.service";

const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg"]);

@Injectable()
export class FilesService {
  constructor(private readonly storage: StorageService) {}

  async upload(user: AuthUser, file: Express.Multer.File) {
    if (!user.workspaceId) {
      throw new BadRequestException("Workspace context is required");
    }
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      throw new BadRequestException("Only PNG and JPEG images are supported");
    }

    const extension = file.mimetype.includes("png") ? "png" : "jpg";
    const key = `workspaces/${user.workspaceId}/assets/${randomUUID()}.${extension}`;
    const fileUrl = await this.storage.putBuffer(key, file.buffer, file.mimetype);
    const downloadUrl = await this.storage.getSignedDownloadUrl(fileUrl);
    return { fileUrl, downloadUrl };
  }
}
