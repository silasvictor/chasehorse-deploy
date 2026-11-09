/**
 * Secure document storage abstraction.
 *
 * Local filesystem storage is used in development. In production, set
 * STORAGE_PROVIDER=s3 and provide S3-compatible credentials.
 *
 * Uploaded files are treated as untrusted: extensions/MIME types are validated
 * and content is stored outside the web root where possible.
 */

import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export type StorageProvider = "local" | "s3";

export interface StorageConfig {
  provider: StorageProvider;
  localPath: string;
  maxUploadSizeBytes: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
}

export interface UploadResult {
  storedName: string;
  originalName: string;
  fileUrl: string;
  mimeType: string;
  size: number;
}

const DEFAULT_CONFIG: StorageConfig = {
  provider: (process.env.STORAGE_PROVIDER as StorageProvider) ?? "local",
  localPath: process.env.LOCAL_STORAGE_PATH ?? "./storage/uploads",
  maxUploadSizeBytes: Number(process.env.MAX_UPLOAD_SIZE_BYTES ?? "10485760"),
  allowedMimeTypes: [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/tiff",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
  ],
  allowedExtensions: [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff", ".doc", ".docx", ".xls", ".xlsx", ".csv"],
};

export class StorageService {
  private readonly config: StorageConfig;

  constructor(config: StorageConfig = DEFAULT_CONFIG) {
    this.config = config;
    if (config.provider === "local") {
      fs.mkdirSync(config.localPath, { recursive: true });
    }
  }

  /**
   * Validates a file before it is accepted for storage.
   */
  validateFile(file: { name: string; size: number; type: string }): { ok: true } | { ok: false; reason: string } {
    const ext = path.extname(file.name).toLowerCase();
    if (!this.config.allowedExtensions.includes(ext)) {
      return { ok: false, reason: `File extension "${ext}" is not allowed.` };
    }
    if (!this.config.allowedMimeTypes.includes(file.type)) {
      return { ok: false, reason: `MIME type "${file.type}" is not allowed.` };
    }
    if (file.size > this.config.maxUploadSizeBytes) {
      return { ok: false, reason: `File exceeds maximum size of ${this.formatBytes(this.config.maxUploadSizeBytes)}.` };
    }
    if (file.size === 0) {
      return { ok: false, reason: "Empty file is not allowed." };
    }
    return { ok: true };
  }

  /**
   * Stores a file buffer securely and returns metadata.
   */
  async storeFile(buffer: Buffer, file: { name: string; size: number; type: string }): Promise<UploadResult> {
    const validation = this.validateFile({
      name: file.name,
      size: file.size,
      type: file.type,
    });
    if (!validation.ok) {
      throw new Error(validation.reason);
    }

    const ext = path.extname(file.name).toLowerCase();
    const storedName = `${uuidv4()}${ext}`;
    const fileUrl = `/storage/${storedName}`;

    if (this.config.provider === "local") {
      const dest = path.join(this.config.localPath, storedName);
      await fs.promises.writeFile(dest, buffer);
    } else {
      throw new Error("S3 storage provider is not implemented in this build.");
    }

    return {
      storedName,
      originalName: file.name,
      fileUrl,
      mimeType: file.type,
      size: buffer.length,
    };
  }

  /**
   * Deletes a stored file by its stored name.
   */
  async deleteFile(storedName: string): Promise<void> {
    if (this.config.provider === "local") {
      const dest = path.join(this.config.localPath, storedName);
      try {
        await fs.promises.unlink(dest);
      } catch {
        // file may already be absent
      }
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

export const storage = new StorageService();
