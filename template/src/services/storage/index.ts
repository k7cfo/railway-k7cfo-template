import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "../../env.js";

export interface ObjectStorage {
  readonly status: "connected" | "unconfigured" | "unavailable";
  put(key: string, body: Uint8Array): Promise<void>;
  get(key: string): Promise<Uint8Array>;
}
class LocalStorage implements ObjectStorage {
  readonly status = env.NODE_ENV === "production" ? ("unavailable" as const) : ("connected" as const);
  private root = path.resolve(".data/uploads");
  async put(key: string, body: Uint8Array) {
    if (this.status !== "connected")
      throw new Error("Local storage is unavailable in production. Configure S3 or R2.");
    await mkdir(path.dirname(path.join(this.root, key)), { recursive: true });
    await writeFile(path.join(this.root, key), body);
  }
  async get(key: string) {
    return new Uint8Array(await readFile(path.join(this.root, key)));
  }
}
class S3Storage implements ObjectStorage {
  readonly status = env.S3_BUCKET && env.S3_REGION ? ("connected" as const) : ("unconfigured" as const);
  private client = new S3Client({
    region: env.S3_REGION || "auto",
    endpoint: env.S3_ENDPOINT || undefined,
    credentials:
      env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY
        ? { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY }
        : undefined,
  });
  async put(key: string, body: Uint8Array) {
    if (!env.S3_BUCKET) throw new Error("Object storage is not configured.");
    await this.client.send(new PutObjectCommand({ Bucket: env.S3_BUCKET, Key: key, Body: body }));
  }
  async get(key: string) {
    if (!env.S3_BUCKET) throw new Error("Object storage is not configured.");
    const result = await this.client.send(new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
    if (!result.Body) throw new Error(`Object ${key} returned an empty body.`);
    return new Uint8Array(await result.Body.transformToByteArray());
  }
}
export function getObjectStorage(): ObjectStorage {
  return env.STORAGE_PROVIDER === "local" ? new LocalStorage() : new S3Storage();
}
