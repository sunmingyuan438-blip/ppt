import { S3Client, DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import type { ObjectMetadata, ObjectStore } from "./types.js";

export class S3ObjectStore implements ObjectStore {
  constructor(private readonly client: S3Client, private readonly bucket: string, private readonly publicBaseUrl?: string) {}
  async put(key: string, body: Uint8Array, metadata: ObjectMetadata): Promise<void> {
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: metadata.contentType, ContentLength: metadata.sizeBytes, Metadata: metadata.sha256 ? { sha256: metadata.sha256 } : undefined }));
  }
  async get(key: string): Promise<Uint8Array | null> {
    try {
      const response = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      if (!response.Body) return null;
      return new Uint8Array(await response.Body.transformToByteArray());
    } catch (error) {
      if ((error as { name?: string }).name === "NoSuchKey") return null;
      throw error;
    }
  }
  async delete(key: string): Promise<void> { await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key })); }
  async signedUrl(key: string, operation: "get" | "put"): Promise<string> {
    if (!this.publicBaseUrl) throw new Error(`Object storage signed URL is not configured for ${operation}`);
    return `${this.publicBaseUrl.replace(/\/$/, "")}/${encodeURIComponent(key)}`;
  }
}
