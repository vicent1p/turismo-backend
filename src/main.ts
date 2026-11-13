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

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const originsEnv = process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGINS;
  const allowedOrigins = originsEnv
    ? originsEnv.split(',').map((origin) => origin.trim())
    : ['http://localhost:4200'];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
