export type ObjectMetadata = { contentType: string; sizeBytes?: number; sha256?: string };

export interface ObjectStore {
  put(key: string, body: Uint8Array, metadata: ObjectMetadata): Promise<void>;
  get(key: string): Promise<Uint8Array | null>;
  delete(key: string): Promise<void>;
  signedUrl(key: string, operation: "get" | "put"): Promise<string>;
}
