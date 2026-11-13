import { BadRequestException } from '@nestjs/common';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  detectImageFromMagicBytes,
  MAX_IMAGE_FILE_SIZE_BYTES,
  UploadsService,
} from './uploads.service';

describe('UploadsService', () => {
  let service: UploadsService;
  let tempDir: string;
  const origUploadDir = process.env.UPLOAD_DIR;
  const origPublicBase = process.env.PUBLIC_BASE_URL;

  beforeEach(() => {
    service = new UploadsService();
    tempDir = mkdtempSync(join(tmpdir(), 'plato-uploads-test-'));
    process.env.UPLOAD_DIR = tempDir;
    delete process.env.PUBLIC_BASE_URL;
  });

  afterEach(() => {
    if (origUploadDir === undefined) {
      delete process.env.UPLOAD_DIR;
    } else {
      process.env.UPLOAD_DIR = origUploadDir;
    }
    if (origPublicBase === undefined) {
      delete process.env.PUBLIC_BASE_URL;
    } else {
      process.env.PUBLIC_BASE_URL = origPublicBase;
    }
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('detects PNG, JPEG, GIF and WEBP magic bytes and rejects arbitrary text', () => {
    expect(
      detectImageFromMagicBytes(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]),
      ),
    ).toEqual({ ext: '.png', mimeType: 'image/png' });

    expect(
      detectImageFromMagicBytes(
        Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]),
      ),
    ).toEqual({ ext: '.jpg', mimeType: 'image/jpeg' });

    expect(detectImageFromMagicBytes(Buffer.from('<svg></svg>   '))).toBeNull();
  });

  it('saves valid image files to UPLOAD_DIR with UUID filenames and request origin URL', async () => {
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44,
      0x52,
    ]);
    const file = {
      originalname: '../../evil-name.png',
      mimetype: 'image/png',
      size: pngBuffer.length,
      buffer: pngBuffer,
    } as Express.Multer.File;

    const saved = await service.saveImages([file], 'http://localhost:3000');

    expect(saved).toHaveLength(1);
    expect(saved[0].filename).toMatch(/^[0-9a-f-]+\.png$/);
    expect(saved[0].path).toBe(`/uploads/${saved[0].filename}`);
    expect(saved[0].url).toBe(`http://localhost:3000/uploads/${saved[0].filename}`);
    expect(saved[0].mimeType).toBe('image/png');
    expect(existsSync(join(tempDir, saved[0].filename))).toBe(true);
  });

  it('prefers PUBLIC_BASE_URL over requestOrigin when configured', async () => {
    process.env.PUBLIC_BASE_URL = 'https://api.turismoplato.co/';
    const jpgBuffer = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    ]);
    const file = {
      originalname: 'foto.jpg',
      mimetype: 'image/jpeg',
      size: jpgBuffer.length,
      buffer: jpgBuffer,
    } as Express.Multer.File;

    const saved = await service.saveImages([file], 'http://localhost:3000');
    expect(saved[0].url).toBe(`https://api.turismoplato.co/uploads/${saved[0].filename}`);
  });

  it('rejects spoofed non-image files and oversized files', async () => {
    const fakeJpg = {
      originalname: 'payload.jpg',
      mimetype: 'image/jpeg',
      size: 20,
      buffer: Buffer.from('<script>alert(1)</script>'),
    } as Express.Multer.File;

    await expect(service.saveImages([fakeJpg])).rejects.toThrow(BadRequestException);

    const oversized = {
      originalname: 'huge.png',
      mimetype: 'image/png',
      size: MAX_IMAGE_FILE_SIZE_BYTES + 1,
      buffer: Buffer.alloc(32),
    } as Express.Multer.File;

    await expect(service.saveImages([oversized])).rejects.toThrow(BadRequestException);
  });
});
