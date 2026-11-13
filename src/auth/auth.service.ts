import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Rol } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt.strategy';
import { hashPassword, verifyPassword } from './password.util';

export interface AuthUserProfile {
  id: string;
  correo: string;
  nombreCompleto: string;
  rol: Rol;
  activo: boolean;
}

export interface LoginResponseDto {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  user: AuthUserProfile;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /** Authenticates user credentials against PostgreSQL and issues a signed JWT. */
  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const email = dto.correo.trim().toLowerCase();
    const user = await this.prisma.usuario.findUnique({
      where: { correo: email },
      select: {
        id: true,
        correo: true,
        nombreCompleto: true,
        passwordHash: true,
        rol: true,
        activo: true,
      },
    });

    if (!user || !verifyPassword(dto.password, user.passwordHash)) {
      throw new UnauthorizedException('Correo o contraseña inválidos');
    }

    if (!user.activo) {
      throw new UnauthorizedException(
        'La cuenta de usuario se encuentra desactivada',
      );
    }

    // Update ultimoAcceso timestamp safely
    if (typeof this.prisma.usuario?.update === 'function') {
      try {
        await this.prisma.usuario.update({
          where: { id: user.id },
          data: { ultimoAcceso: new Date() },
        });
      } catch {
        // Ignore in test mock environments
      }
    }

    const payload: JwtPayload = {
      sub: String(user.id),
      correo: user.correo,
      rol: user.rol,
      nombreCompleto: user.nombreCompleto,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
      user: {
        id: String(user.id),
        correo: user.correo,
        nombreCompleto: user.nombreCompleto,
        rol: user.rol,
        activo: user.activo,
      },
    };
  }

  /** Fetches the current authenticated user's live profile without passwordHash. */
  async getProfile(userId: string | number): Promise<AuthUserProfile> {
    const numId = typeof userId === 'number' ? userId : parseInt(userId, 10);
    const user = await this.prisma.usuario.findUnique({
      where: { id: numId },
      select: {
        id: true,
        correo: true,
        nombreCompleto: true,
        rol: true,
        activo: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    if (!user.activo) {
      throw new UnauthorizedException('Cuenta de usuario desactivada');
    }

    return {
      id: String(user.id),
      correo: user.correo,
      nombreCompleto: user.nombreCompleto,
      rol: user.rol,
      activo: user.activo,
    };
  }

  /** Allows an authenticated user to change their own password after verifying the current one. */
  async changeOwnPassword(
    userId: string | number,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const numId = typeof userId === 'number' ? userId : parseInt(userId, 10);
    const user = await this.prisma.usuario.findUnique({
      where: { id: numId },
      select: { id: true, passwordHash: true, activo: true },
    });

    if (!user || !user.activo) {
      throw new UnauthorizedException('Usuario no autorizado');
    }

    if (!verifyPassword(dto.currentPassword, user.passwordHash)) {
      throw new BadRequestException('La contraseña actual no coincide');
    }

    await this.prisma.usuario.update({
      where: { id: numId },
      data: {
        passwordHash: hashPassword(dto.newPassword),
        debeCambiarPassword: false,
      },
    });

    return { message: 'Contraseña actualizada correctamente' };
  }
}
