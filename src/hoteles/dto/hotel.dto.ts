import { TipoTarjeta } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** Maps user-friendly or lowercase card types onto `TipoTarjeta`. */
export function normalizeTipoTarjeta(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const clean = value.trim().toUpperCase();
  if (clean === 'HOTEL' || clean === 'HOTELES') return TipoTarjeta.HOTEL;
  if (clean === 'CABANA' || clean === 'CABAÑA' || clean === 'CABANAS' || clean === 'CABAÑAS') {
    return TipoTarjeta.CABANA;
  }
  if (clean === 'RESTAURANTE' || clean === 'RESTAURANTES') {
    return TipoTarjeta.RESTAURANTE;
  }
  return clean;
}

function trimOrUndefined({ value }: { value: unknown }): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function toBooleanOrUndefined({ value }: { value: unknown }): unknown {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const clean = value.trim().toLowerCase();
    if (clean === 'true' || clean === '1') return true;
    if (clean === 'false' || clean === '0') return false;
  }
  return value;
}

/** Query filters supported by `GET /api/hoteles`. */
export class QueryHotelsDto {
  @IsOptional()
  @Transform(({ value }) => normalizeTipoTarjeta(value))
  @IsEnum(TipoTarjeta, {
    message: 'tipo debe ser HOTEL, CABANA o RESTAURANTE',
  })
  tipo?: TipoTarjeta;

  @IsOptional()
  @Transform(toBooleanOrUndefined)
  @IsBoolean()
  disponible?: boolean;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  municipio?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  q?: string;
}

/** Shared body schema for creating a hotel, cabin, or restaurant card. */
export class CreateHotelDto {
  @IsOptional()
  @Transform(({ value }) => normalizeTipoTarjeta(value))
  @IsEnum(TipoTarjeta, {
    message: 'tipo debe ser HOTEL, CABANA o RESTAURANTE',
  })
  tipo?: TipoTarjeta;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MinLength(2)
  @MaxLength(160)
  nombre: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  estrellas?: number;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  resena?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  resenaEn?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  telefonoContacto?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  instagramUrl?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  facebookUrl?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  xUrl?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  tiktokUrl?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  paginaWebUrl?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  direccion?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  ubicacionUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitud?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitud?: number;

  @IsOptional()
  @Transform(toBooleanOrUndefined)
  @IsBoolean()
  disponible?: boolean;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  municipioId?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  municipioNombre?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  servicioIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviciosNombres?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fotos?: string[];
}

/** Partial update payload for `PATCH /api/hoteles/:id`. */
export class UpdateHotelDto {
  @IsOptional()
  @Transform(({ value }) => normalizeTipoTarjeta(value))
  @IsEnum(TipoTarjeta, {
    message: 'tipo debe ser HOTEL, CABANA o RESTAURANTE',
  })
  tipo?: TipoTarjeta;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  nombre?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  estrellas?: number;

  @IsOptional()
  @IsString()
  resena?: string;

  @IsOptional()
  @IsString()
  resenaEn?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsString()
  telefonoContacto?: string;

  @IsOptional()
  @IsString()
  instagramUrl?: string;

  @IsOptional()
  @IsString()
  facebookUrl?: string;

  @IsOptional()
  @IsString()
  xUrl?: string;

  @IsOptional()
  @IsString()
  tiktokUrl?: string;

  @IsOptional()
  @IsString()
  paginaWebUrl?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  ubicacionUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitud?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitud?: number;

  @IsOptional()
  @Transform(toBooleanOrUndefined)
  @IsBoolean()
  disponible?: boolean;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  municipioId?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  municipioNombre?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  servicioIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviciosNombres?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fotos?: string[];
}

/** Availability toggle body for `PATCH /api/hoteles/:id/disponibilidad`. */
export class UpdateAvailabilityDto {
  @Transform(toBooleanOrUndefined)
  @IsBoolean({ message: 'disponible debe ser booleano' })
  disponible: boolean;
}

