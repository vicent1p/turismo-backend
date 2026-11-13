import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { existsSync } from 'node:fs';
import { AppModule } from './app.module';
import { resolveUploadDirectory } from './uploads/uploads.service';

function loadLocalEnv(): void {
  const proc = process as NodeJS.Process & { loadEnvFile?: (p?: string) => void };
  if (typeof proc.loadEnvFile === 'function' && existsSync('.env')) {
    try {
      proc.loadEnvFile('.env');
    } catch {
      // Ignore if environment is already injected externally
    }
  }
}

async function bootstrap() {
  loadLocalEnv();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(
    helmet({
      // Allow cross-origin image rendering when frontend runs on a separate domain/port.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ extended: true, limit: '5mb' }));

  app.useStaticAssets(resolveUploadDirectory(), {
    prefix: '/uploads/',
    maxAge: '7d',
  });

  const allowedOrigins = process.env.CORS_ORIGINS
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins && allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
