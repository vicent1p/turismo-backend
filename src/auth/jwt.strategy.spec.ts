import { UnauthorizedException } from '@nestjs/common';
import { Rol } from '@prisma/client';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const mockPrisma = {
    usuario: {
      findUnique: jest.fn(),
    },
  };

  let strategy: JwtStrategy;

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new JwtStrategy(mockPrisma as never);
  });

  it('returns live user role and profile from database when active', async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue({
      id: 'usr-1',
      correo: 'admin@turismo.magdalena.gov.co',
      rol: Rol.ADMIN,
      nombreCompleto: 'Admin Principal',
      activo: true,
    });

    const user = await strategy.validate({
      sub: 'usr-1',
      correo: 'old@correo.co',
      rol: Rol.GESTOR,
    });

    expect(user).toEqual({
      id: 'usr-1',
      correo: 'admin@turismo.magdalena.gov.co',
      rol: Rol.ADMIN,
      nombreCompleto: 'Admin Principal',
    });
  });

  it('throws UnauthorizedException when user is deactivated or missing', async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue({
      id: 'usr-2',
      correo: 'inactivo@plato.gov.co',
      rol: Rol.GESTOR,
      nombreCompleto: 'Inactivo',
      activo: false,
    });

    await expect(
      strategy.validate({ sub: 'usr-2', correo: 'inactivo@plato.gov.co', rol: Rol.GESTOR }),
    ).rejects.toThrow(UnauthorizedException);

    mockPrisma.usuario.findUnique.mockResolvedValue(null);
    await expect(
      strategy.validate({ sub: 'usr-missing', correo: 'x@y.co', rol: Rol.GESTOR }),
    ).rejects.toThrow(UnauthorizedException);
  });
});

