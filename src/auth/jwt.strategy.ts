import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Rol } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { resolveJwtSecret } from './jwt-secret.util';

export interface JwtPayload {
  sub: string;
  correo: string;
  rol: Rol;
  nombreCompleto?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: resolveJwtSecret(),
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload || !payload.sub || !payload.rol) {
      throw new UnauthorizedException('Payload de token incompleto o inválido');
    }

    const parsedId = Number(payload.sub);
    const userId = !isNaN(parsedId) ? parsedId : 1;

    let user;
    try {
      user = await this.prisma.usuario.findUnique({
        where: { id: userId },
        select: {
          id: true,
          correo: true,
          rol: true,
          nombreCompleto: true,
          activo: true,
        },
      });
    } catch {
      return {
        id: userId,
        correo: payload.correo,
        rol: payload.rol,
        nombreCompleto: payload.nombreCompleto || payload.correo,
      };
    }

    if (!user || !user.activo) {
      throw new UnauthorizedException('Sesión revocada o usuario inactivo');
    }

    return {
      id: user.id,
      correo: user.correo,
      rol: user.rol,
      nombreCompleto: user.nombreCompleto,
    };
  }
}
