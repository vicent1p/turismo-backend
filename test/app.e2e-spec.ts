import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { resolveUploadDirectory } from './../src/uploads/uploads.service';

const proc = process as NodeJS.Process & { loadEnvFile?: (p?: string) => void };
if (typeof proc.loadEnvFile === 'function' && existsSync('.env')) {
  try {
    proc.loadEnvFile('.env');
  } catch {
    // Ignore when variables already exist
  }
}

jest.setTimeout(30000);

describe('Backend API Fase 2 (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let adminToken = '';
  let gestorToken = '';
  let createdHotelId: string | null = null;
  let uploadedFilename: string | null = null;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);
  }, 30000);

  afterAll(async () => {
    if (createdHotelId) {
      await prisma.establecimiento.deleteMany({
        where: { id: parseInt(createdHotelId, 10) },
      });
    }
    if (uploadedFilename) {
      const uploadedPath = join(resolveUploadDirectory(), uploadedFilename);
      if (existsSync(uploadedPath)) {
        unlinkSync(uploadedPath);
      }
    }
    await app.close();
  }, 30000);

  it('GET / and GET /api/health confirm app liveness and PostgreSQL readiness', async () => {
    await request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');

    const health = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);
    expect(health.body.status).toBe('ok');
    expect(health.body.database).toBe('connected');
  });

  it('POST /api/auth/login validates first real ADMIN & GESTOR JWT sessions against PostgreSQL', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ correo: 'admin@turismo.magdalena.gov.co', password: 'wrong' })
      .expect(401);

    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        correo: 'admin@turismo.magdalena.gov.co',
        password: process.env.SEED_ADMIN_PASSWORD ?? 'admin2026',
      })
      .expect(200);

    expect(adminLogin.body.accessToken).toEqual(expect.any(String));
    expect(adminLogin.body.user.rol).toBe('ADMIN');
    expect(adminLogin.body.user.passwordHash).toBeUndefined();
    adminToken = adminLogin.body.accessToken;

    const gestorLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        correo: 'gestor@turismo.magdalena.gov.co',
        password: process.env.SEED_GESTOR_PASSWORD ?? 'gestor2026',
      })
      .expect(200);

    expect(gestorLogin.body.accessToken).toEqual(expect.any(String));
    expect(gestorLogin.body.user.rol).toBe('GESTOR');
    gestorToken = gestorLogin.body.accessToken;

    const meRes = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(meRes.body.correo).toBe('admin@turismo.magdalena.gov.co');
  });

  it('GET public endpoints /api/hoteles, /api/municipios and /api/servicios return seeded records', async () => {
    const [hotelesRes, municipiosRes, serviciosRes] = await Promise.all([
      request(app.getHttpServer()).get('/api/hoteles').expect(200),
      request(app.getHttpServer()).get('/api/municipios').expect(200),
      request(app.getHttpServer()).get('/api/servicios').expect(200),
    ]);

    expect(Array.isArray(hotelesRes.body)).toBe(true);
    expect(hotelesRes.body.length).toBeGreaterThanOrEqual(3);
    expect(municipiosRes.body.length).toBeGreaterThanOrEqual(17);
    expect(serviciosRes.body.length).toBeGreaterThanOrEqual(17);
  });

  it('Enforces RBAC on /api/usuarios (401 unauth, 403 GESTOR, 200 ADMIN)', async () => {
    await request(app.getHttpServer()).get('/api/usuarios').expect(401);

    await request(app.getHttpServer())
      .get('/api/usuarios')
      .set('Authorization', `Bearer ${gestorToken}`)
      .expect(403);

    const adminList = await request(app.getHttpServer())
      .get('/api/usuarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(adminList.body.length).toBeGreaterThanOrEqual(2);
    expect(adminList.body[0].passwordHash).toBeUndefined();
  });

  it('Supports authenticated CRUD lifecycle on /api/hoteles', async () => {
    await request(app.getHttpServer())
      .post('/api/hoteles')
      .send({ nombre: 'Sin Token' })
      .expect(401);

    const created = await request(app.getHttpServer())
      .post('/api/hoteles')
      .set('Authorization', `Bearer ${gestorToken}`)
      .send({
        tipo: 'CABANA',
        nombre: 'Cabaña E2E Test Temporal',
        estrellas: 4,
        municipioNombre: 'Plato',
        serviciosNombres: ['Wifi'],
        fotos: ['cultura/cultura-rio-atardecer.jpg'],
      })
      .expect(201);

    createdHotelId = created.body.id;
    expect(created.body.tipo).toBe('CABANA');
    expect(created.body.municipio?.nombre).toBe('Plato');

    const updated = await request(app.getHttpServer())
      .patch(`/api/hoteles/${createdHotelId}/disponibilidad`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ disponible: false })
      .expect(200);

    expect(updated.body.disponible).toBe(false);

    await request(app.getHttpServer())
      .delete(`/api/hoteles/${createdHotelId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/hoteles/${createdHotelId}`)
      .expect(404);
  });

  it('Enforces auth and magic-byte validation on POST /api/uploads/imagenes', async () => {
    const validPng = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44,
      0x52,
    ]);

    await request(app.getHttpServer())
      .post('/api/uploads/imagenes')
      .attach('files', validPng, { filename: 'test.png', contentType: 'image/png' })
      .expect(401);

    const uploadRes = await request(app.getHttpServer())
      .post('/api/uploads/imagenes')
      .set('Authorization', `Bearer ${gestorToken}`)
      .attach('files', validPng, { filename: 'test.png', contentType: 'image/png' })
      .expect(201);

    expect(Array.isArray(uploadRes.body.urls)).toBe(true);
    expect(uploadRes.body.urls).toHaveLength(1);
    uploadedFilename = uploadRes.body.files?.[0]?.filename ?? null;
    expect(uploadedFilename).toMatch(/\.png$/);
  });
});
