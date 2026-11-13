import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Rol } from '@prisma/client';
import type { Request } from 'express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_FILE_SIZE_BYTES,
  UploadedImageResult,
  UploadsService,
} from './uploads.service';

const IMAGE_MULTER_OPTIONS = {
  storage: memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_FILE_SIZE_BYTES,
    files: 10,
  },
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
      callback(
        new BadRequestException('Formato no permitido. Usa imágenes JPG, PNG, WEBP o GIF.'),
        false,
      );
      return;
    }
    callback(null, true);
  },
};

function getRequestOrigin(req: Request): string | undefined {
  const host = req.get('host');
  if (!host) return undefined;
  const forwardedProto = req.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const protocol = forwardedProto || req.protocol || 'http';
  return `${protocol}://${host}`;
}

@Controller('api/uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Rol.ADMIN, Rol.GESTOR)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  /** POST /api/uploads/imagen — Uploads a single image file (ADMIN or GESTOR). */
  @Post('imagen')
  @UseInterceptors(FileInterceptor('file', IMAGE_MULTER_OPTIONS))
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: Request,
  ): Promise<UploadedImageResult> {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo en el campo "file".');
    }
    const [saved] = await this.uploadsService.saveImages([file], getRequestOrigin(req));
    return saved;
  }

  /** POST /api/uploads/imagenes — Uploads up to 10 images at once (ADMIN or GESTOR). */
  @Post('imagenes')
  @UseInterceptors(FilesInterceptor('files', 10, IMAGE_MULTER_OPTIONS))
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[] | undefined,
    @Req() req: Request,
  ): Promise<{ urls: string[]; files: UploadedImageResult[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No se recibieron imágenes en el campo "files".');
    }
    const saved = await this.uploadsService.saveImages(files, getRequestOrigin(req));
    return {
      urls: saved.map((item) => item.url),
      files: saved,
    };
  }
}
