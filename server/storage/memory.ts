import type { ObjectMetadata, ObjectStore } from "./types.js";

export class MemoryObjectStore implements ObjectStore {
  private readonly objects = new Map<string, { body: Uint8Array; metadata: ObjectMetadata }>();
  async put(key: string, body: Uint8Array, metadata: ObjectMetadata): Promise<void> { this.objects.set(key, { body, metadata }); }
  async get(key: string): Promise<Uint8Array | null> { return this.objects.get(key)?.body ?? null; }
  async delete(key: string): Promise<void> { this.objects.delete(key); }
  async signedUrl(key: string, operation: "get" | "put"): Promise<string> { return `memory://${operation}/${encodeURIComponent(key)}`; }
  has(key: string): boolean { return this.objects.has(key); }
}
