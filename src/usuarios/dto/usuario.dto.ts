import { Rol } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

function normalizeEmail({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

function normalizeRol({ value }: { value: unknown }): unknown {
  if (typeof value !== 'string') return value;
  return value.trim().toUpperCase();
}

/** Payload for `POST /api/usuarios` (ADMIN only). */
export class CreateUsuarioDto {
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Debe proporcionar un correo válido' })
  @IsNotEmpty()
  correo: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'El nombre completo es obligatorio' })
  @MinLength(2)
  @MaxLength(120)
  nombreCompleto: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsOptional()
  @Transform(normalizeRol)
  @IsEnum(Rol, { message: 'rol debe ser ADMIN o GESTOR' })
  rol?: Rol;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

/** Payload for `PATCH /api/usuarios/:id` (ADMIN only). */
export class UpdateUsuarioDto {
  @IsOptional()
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Debe proporcionar un correo válido' })
  correo?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nombreCompleto?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password?: string;

  @IsOptional()
  @Transform(normalizeRol)
  @IsEnum(Rol, { message: 'rol debe ser ADMIN o GESTOR' })
  rol?: Rol;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

