import {
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Rol } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsuariosService } from './usuarios.service';

describe('UsuariosService', () => {
  let service: UsuariosService;
  let mockPrisma: any;

  const sampleUser = {
    id: 'u-admin',
    correo: 'admin@turismo.magdalena.gov.co',
    nombreCompleto: 'Admin',
    rol: Rol.ADMIN,
    activo: true,
    creadoEn: new Date(),
    actualizadoEn: new Date(),
    _count: { hotelesCreados: 3 },
  };

  beforeEach(async () => {
    mockPrisma = {
      usuario: {
        findMany: jest.fn().mockResolvedValue([sampleUser]),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        create: jest.fn().mockResolvedValue(sampleUser),
        update: jest.fn().mockResolvedValue(sampleUser),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UsuariosService>(UsuariosService);
  });

  it('lists users without passwordHash and maps tarjetasCreadas count', async () => {
    const list = await service.findAll();
    expect(list).toHaveLength(1);
    expect(list[0].tarjetasCreadas).toBe(3);
    expect((list[0] as unknown as Record<string, unknown>)['passwordHash']).toBeUndefined();
  });

  it('rejects duplicate email when creating user', async () => {
    mockPrisma.usuario.findUnique.mockResolvedValueOnce({ id: 'u-admin' });
    await expect(
      service.create({
        correo: 'admin@turismo.magdalena.gov.co',
        nombreCompleto: 'Dup',
        password: 'password123',
        rol: Rol.GESTOR,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('blocks self-deactivation and removing the last active ADMIN', async () => {
    mockPrisma.usuario.findUnique.mockResolvedValueOnce({
      id: 'u-admin',
      rol: Rol.ADMIN,
      activo: true,
    });
    await expect(service.deactivate('u-admin', 'u-admin')).rejects.toThrow(
      BadRequestException,
    );

    mockPrisma.usuario.findUnique.mockResolvedValueOnce({
      id: 'u-other-admin',
      rol: Rol.ADMIN,
      activo: true,
    });
    mockPrisma.usuario.count.mockResolvedValueOnce(0);

    await expect(
      service.deactivate('u-other-admin', 'u-admin'),
    ).rejects.toThrow(BadRequestException);
  });
});

