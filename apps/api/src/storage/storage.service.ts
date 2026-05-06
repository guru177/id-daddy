import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = config.getOrThrow<string>("AWS_S3_BUCKET");
    this.client = new S3Client({
      region: config.get<string>("AWS_REGION", "us-east-1"),
      endpoint: config.get<string>("AWS_S3_ENDPOINT") || undefined,
      forcePathStyle: config.get<string>("AWS_S3_FORCE_PATH_STYLE", "false") === "true",
      credentials: {
        accessKeyId: config.getOrThrow<string>("AWS_ACCESS_KEY_ID"),
        secretAccessKey: config.getOrThrow<string>("AWS_SECRET_ACCESS_KEY")
      }
    });
  }

  async putBuffer(key: string, body: Buffer, contentType: string) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        ServerSideEncryption: this.config.get<string>("AWS_S3_ENDPOINT") ? undefined : "AES256"
      })
    );

    return `s3://${this.bucket}/${key}`;
  }

  async getSignedDownloadUrl(fileUrl: string) {
    const { bucket, key } = this.parseS3Url(fileUrl);
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: bucket,
        Key: key
      }),
      { expiresIn: Number(this.config.get<string>("SIGNED_URL_TTL_SECONDS", "900")) }
    );
  }

  async getBuffer(fileUrl: string) {
    const { bucket, key } = this.parseS3Url(fileUrl);
    const response = await this.client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const chunks: Buffer[] = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(Buffer.from(chunk));
    }
    return {
      buffer: Buffer.concat(chunks),
      contentType: response.ContentType ?? "application/octet-stream"
    };
  }

  private parseS3Url(fileUrl: string) {
    const match = /^s3:\/\/([^/]+)\/(.+)$/i.exec(fileUrl);
    if (!match) {
      throw new Error("Unsupported S3 file URL");
    }
    return { bucket: match[1], key: match[2] };
  }
}
