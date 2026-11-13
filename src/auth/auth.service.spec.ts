import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Rol } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { hashPassword, verifyPassword } from './password.util';

describe('AuthService', () => {
  let service: AuthService;
  let mockPrisma: any;
  let mockJwt: any;

  beforeEach(async () => {
    mockPrisma = {
      usuario: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    mockJwt = {
      signAsync: jest.fn().mockResolvedValue('signed-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('hashes and verifies passwords in constant time', () => {
    const hash = hashPassword('admin2026');
    expect(hash.startsWith('scrypt$')).toBe(true);
    expect(verifyPassword('admin2026', hash)).toBe(true);
    expect(verifyPassword('wrong-pass', hash)).toBe(false);
    expect(verifyPassword('admin2026', 'invalid-hash')).toBe(false);
  });

  it('issues JWT and safe user profile on valid credentials', async () => {
    const storedHash = hashPassword('admin2026');
    mockPrisma.usuario.findUnique.mockResolvedValueOnce({
      id: 'u-1',
      correo: 'admin@turismo.magdalena.gov.co',
      nombreCompleto: 'Administrador del Sistema',
      passwordHash: storedHash,
      rol: Rol.ADMIN,
      activo: true,
    });

    const result = await service.login({
      correo: 'ADMIN@TURISMO.MAGDALENA.GOV.CO',
      password: 'admin2026',
    });

    expect(result.accessToken).toBe('signed-jwt-token');
    expect(result.tokenType).toBe('Bearer');
    expect(result.user.rol).toBe(Rol.ADMIN);
    expect((result.user as unknown as Record<string, unknown>)['passwordHash']).toBeUndefined();
    expect(mockJwt.signAsync).toHaveBeenCalledWith({
      sub: 'u-1',
      correo: 'admin@turismo.magdalena.gov.co',
      rol: Rol.ADMIN,
      nombreCompleto: 'Administrador del Sistema',
    });
  });

  it('rejects invalid password or inactive user with UnauthorizedException', async () => {
    mockPrisma.usuario.findUnique.mockResolvedValueOnce({
      id: 'u-1',
      correo: 'admin@turismo.magdalena.gov.co',
      nombreCompleto: 'Admin',
      passwordHash: hashPassword('admin2026'),
      rol: Rol.ADMIN,
      activo: true,
    });

    await expect(
      service.login({ correo: 'admin@turismo.magdalena.gov.co', password: 'bad' }),
    ).rejects.toThrow(UnauthorizedException);

    mockPrisma.usuario.findUnique.mockResolvedValueOnce({
      id: 'u-2',
      correo: 'inactive@turismo.magdalena.gov.co',
      nombreCompleto: 'Inactive',
      passwordHash: hashPassword('gestor2026'),
      rol: Rol.GESTOR,
      activo: false,
    });

    await expect(
      service.login({
        correo: 'inactive@turismo.magdalena.gov.co',
        password: 'gestor2026',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('validates current password before updating password', async () => {
    mockPrisma.usuario.findUnique.mockResolvedValueOnce({
      id: 'u-1',
      passwordHash: hashPassword('oldPass123'),
      activo: true,
    });

    await expect(
      service.changeOwnPassword('u-1', {
        currentPassword: 'wrong',
        newPassword: 'newPass456',
      }),
    ).rejects.toThrow(BadRequestException);

    mockPrisma.usuario.findUnique.mockResolvedValueOnce({
      id: 'u-1',
      passwordHash: hashPassword('oldPass123'),
      activo: true,
    });
    mockPrisma.usuario.update.mockResolvedValueOnce({ id: 'u-1' });

    const res = await service.changeOwnPassword('u-1', {
      currentPassword: 'oldPass123',
      newPassword: 'newPass456',
    });
    expect(res.message).toContain('actualizada');
    expect(mockPrisma.usuario.update).toHaveBeenCalled();
  });
});

