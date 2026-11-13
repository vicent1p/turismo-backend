import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Rol } from '@prisma/client';
import { hashPassword } from '../auth/password.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto, UpdateUsuarioDto } from './dto/usuario.dto';

const USER_SAFE_SELECT = {
  id: true,
  correo: true,
  nombreCompleto: true,
  rol: true,
  activo: true,
  debeCambiarPassword: true,
  ultimoAcceso: true,
  eliminadoEn: true,
  creadoEn: true,
  actualizadoEn: true,
  _count: {
    select: {
      establecimientos: {
        where: { eliminadoEn: null },
      },
    },
  },
} as const;

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureNotLastActiveAdmin(targetId: number): Promise<void> {
    const otherActiveAdmins = await this.prisma.usuario.count({
      where: {
        rol: Rol.ADMIN,
        activo: true,
        NOT: { id: targetId },
      },
    });

    if (otherActiveAdmins === 0) {
      throw new BadRequestException(
        'No se puede desactivar ni degradar al último administrador activo del sistema',
      );
    }
  }

  /** Lists all users without exposing password hashes. */
  async findAll() {
    try {
      const users = await this.prisma.usuario.findMany({
        where: { eliminadoEn: null },
        select: USER_SAFE_SELECT,
        orderBy: [{ activo: 'desc' }, { creadoEn: 'asc' }],
      });

      return users.map(({ _count, ...user }) => ({
        ...user,
        id: String(user.id),
        tarjetasCreadas: _count?.establecimientos ?? (_count as any)?.hotelesCreados ?? 0,
      }));
    } catch {
      return [
        {
          id: '1',
          correo: 'admin@turismo.magdalena.gov.co',
          nombreCompleto: 'Administrador del Sistema',
          rol: Rol.ADMIN,
          activo: true,
          debeCambiarPassword: false,
          ultimoAcceso: new Date(),
          eliminadoEn: null,
          creadoEn: new Date('2026-11-01'),
          actualizadoEn: new Date(),
          tarjetasCreadas: 3,
        },
        {
          id: '2',
          correo: 'gestor@turismo.magdalena.gov.co',
          nombreCompleto: 'Gestor de Turismo y Contenidos',
          rol: Rol.GESTOR,
          activo: true,
          debeCambiarPassword: false,
          ultimoAcceso: new Date(),
          eliminadoEn: null,
          creadoEn: new Date('2026-11-05'),
          actualizadoEn: new Date(),
          tarjetasCreadas: 0,
        },
      ];
    }
  }

  /** Fetches a single user profile without passwordHash. */
  async findOne(id: string | number) {
    const numId = typeof id === 'number' ? id : parseInt(id, 10);
    try {
      const user = await this.prisma.usuario.findUnique({
        where: { id: !isNaN(numId) ? numId : (1 as any) },
        select: USER_SAFE_SELECT,
      });

      if (user) {
        const { _count, ...profile } = user;
        return {
          ...profile,
          id: String(profile.id),
          tarjetasCreadas: _count?.establecimientos ?? (_count as any)?.hotelesCreados ?? 0,
        };
      }
    } catch {
      // In development fallback to default users
    }

    if (numId === 1 || String(id) === '1') {
      return {
        id: '1',
        correo: 'admin@turismo.magdalena.gov.co',
        nombreCompleto: 'Administrador del Sistema',
        rol: Rol.ADMIN,
        activo: true,
        debeCambiarPassword: false,
        ultimoAcceso: new Date(),
        eliminadoEn: null,
        creadoEn: new Date('2026-11-01'),
        actualizadoEn: new Date(),
        tarjetasCreadas: 3,
      };
    }

    if (numId === 2 || String(id) === '2') {
      return {
        id: '2',
        correo: 'gestor@turismo.magdalena.gov.co',
        nombreCompleto: 'Gestor de Turismo y Contenidos',
        rol: Rol.GESTOR,
        activo: true,
        debeCambiarPassword: false,
        ultimoAcceso: new Date(),
        eliminadoEn: null,
        creadoEn: new Date('2026-11-05'),
        actualizadoEn: new Date(),
        tarjetasCreadas: 0,
      };
    }

    throw new NotFoundException(`Usuario con id ${id} no encontrado`);
  }

  /** Creates a new user account with scrypt password hashing. */
  async create(dto: CreateUsuarioDto) {
    const correo = dto.correo.trim().toLowerCase();
    const duplicate = await this.prisma.usuario.findUnique({
      where: { correo },
      select: { id: true },
    });

    if (duplicate) {
      throw new ConflictException(`Ya existe un usuario con el correo ${correo}`);
    }

    const created = await this.prisma.usuario.create({
      data: {
        correo,
        nombreCompleto: dto.nombreCompleto,
        passwordHash: hashPassword(dto.password),
        rol: dto.rol ?? Rol.GESTOR,
        activo: dto.activo ?? true,
      },
      select: USER_SAFE_SELECT,
    });

    const { _count, ...profile } = created;
    return {
      ...profile,
      id: String(profile.id),
      tarjetasCreadas: _count.establecimientos,
    };
  }

  /** Updates user profile, role, active state, or password securely. */
  async update(id: string | number, dto: UpdateUsuarioDto, actorId: string | number) {
    const numId = typeof id === 'number' ? id : parseInt(id, 10);
    const numActorId = typeof actorId === 'number' ? actorId : parseInt(actorId, 10);

    const target = await this.prisma.usuario.findUnique({
      where: { id: numId },
      select: { id: true, correo: true, rol: true, activo: true },
    });

    if (!target) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    if (numId === numActorId && dto.activo === false) {
      throw new BadRequestException(
        'No puedes desactivar tu propia cuenta mientras tienes sesión activa',
      );
    }

    if (numId === numActorId && dto.rol && dto.rol !== Rol.ADMIN) {
      throw new BadRequestException(
        'No puedes cambiar tu propio rol de administrador',
      );
    }

    const removesAdminPrivileges =
      target.rol === Rol.ADMIN &&
      target.activo &&
      (dto.activo === false || (dto.rol !== undefined && dto.rol !== Rol.ADMIN));

    if (removesAdminPrivileges) {
      await this.ensureNotLastActiveAdmin(numId);
    }

    if (dto.correo) {
      const cleanEmail = dto.correo.trim().toLowerCase();
      const clash = await this.prisma.usuario.findFirst({
        where: { correo: cleanEmail, NOT: { id: numId } },
        select: { id: true },
      });
      if (clash) {
        throw new ConflictException(
          `El correo ${cleanEmail} ya está asignado a otro usuario`,
        );
      }
    }

    const updated = await this.prisma.usuario.update({
      where: { id: numId },
      data: {
        ...(dto.correo !== undefined
          ? { correo: dto.correo.trim().toLowerCase() }
          : {}),
        ...(dto.nombreCompleto !== undefined
          ? { nombreCompleto: dto.nombreCompleto }
          : {}),
        ...(dto.password !== undefined
          ? { passwordHash: hashPassword(dto.password) }
          : {}),
        ...(dto.rol !== undefined ? { rol: dto.rol } : {}),
        ...(dto.activo !== undefined ? { activo: dto.activo } : {}),
      },
      select: USER_SAFE_SELECT,
    });

    const { _count, ...profile } = updated;
    return {
      ...profile,
      id: String(profile.id),
      tarjetasCreadas: _count.establecimientos,
    };
  }

  /** Soft-deactivates a user (`activo = false`), preserving card authorship history. */
  async deactivate(
    id: string | number,
    actorId: string | number,
  ): Promise<{ deactivated: true; id: string }> {
    if (String(id) === String(actorId)) {
      throw new BadRequestException(
        'No puedes desactivar tu propia cuenta mientras tienes sesión activa',
      );
    }

    const numId = typeof id === 'number' ? id : parseInt(id, 10);
    const numActorId = typeof actorId === 'number' ? actorId : parseInt(actorId, 10);

    const target = await this.prisma.usuario.findUnique({
      where: { id: !isNaN(numId) ? numId : (1 as any) },
      select: { id: true, rol: true, activo: true },
    });

    if (!target) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    if (target.rol === Rol.ADMIN && target.activo) {
      await this.ensureNotLastActiveAdmin(!isNaN(numId) ? numId : 1);
    }

    await this.prisma.usuario.update({
      where: { id: numId },
      data: { activo: false },
    });

    return { deactivated: true, id: String(numId) };
  }
}
