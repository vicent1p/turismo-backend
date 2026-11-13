import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export const MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export interface UploadedImageResult {
  filename: string;
  path: string;
  url: string;
  mimeType: string;
  size: number;
}

/** Resolves the local filesystem directory used to persist uploaded images. */
export function resolveUploadDirectory(): string {
  const configured = process.env.UPLOAD_DIR?.trim();
  const dir = configured && configured.length > 0 ? configured : join(process.cwd(), 'uploads');
  mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Inspects file magic bytes to verify genuine image content regardless of filename/Content-Type.
 * Rejects SVG, HTML, scripts, or spoofed uploads.
 */
export function detectImageFromMagicBytes(
  buffer: Buffer,
): { ext: string; mimeType: string } | null {
  if (!buffer || buffer.length < 12) {
    return null;
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: '.jpg', mimeType: 'image/jpeg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { ext: '.png', mimeType: 'image/png' };
  }

  // GIF: "GIF8"
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return { ext: '.gif', mimeType: 'image/gif' };
  }

  // WEBP: "RIFF"...."WEBP"
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { ext: '.webp', mimeType: 'image/webp' };
  }

  return null;
}

@Injectable()
export class UploadsService {
  /** Validates uploaded files by size and magic bytes and stores them safely with UUID filenames. */
  async saveImages(
    files: Express.Multer.File[],
    requestOrigin?: string,
  ): Promise<UploadedImageResult[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Debes adjuntar al menos una imagen válida.');
    }

    const uploadDir = resolveUploadDirectory();
    const rawPublicBase = process.env.PUBLIC_BASE_URL?.trim();
    const useRelativePath = rawPublicBase === '/';
    const publicBase = useRelativePath ? '' : rawPublicBase?.replace(/\/+$/, '');
    const originBase = useRelativePath ? '' : publicBase || requestOrigin?.replace(/\/+$/, '') || '';

    const results: UploadedImageResult[] = [];
    for (const file of files) {
      if (!file.buffer || file.buffer.length === 0) {
        throw new BadRequestException(`El archivo "${file.originalname}" está vacío.`);
      }
      if (file.size > MAX_IMAGE_FILE_SIZE_BYTES || file.buffer.length > MAX_IMAGE_FILE_SIZE_BYTES) {
        throw new BadRequestException(
          `La imagen "${file.originalname}" supera el máximo permitido de 5 MB.`,
        );
      }

      const detected = detectImageFromMagicBytes(file.buffer);
      if (!detected) {
        throw new BadRequestException(
          `El archivo "${file.originalname}" no es una imagen válida (JPG, PNG, WEBP o GIF).`,
        );
      }

      const filename = `${randomUUID()}${detected.ext}`;
      const destination = join(uploadDir, filename);
      await writeFile(destination, file.buffer);

      const relativePath = `/uploads/${filename}`;
      results.push({
        filename,
        path: relativePath,
        url: originBase ? `${originBase}${relativePath}` : relativePath,
        mimeType: detected.mimeType,
        size: file.buffer.length,
      });
    }

    return results;
  }
}
