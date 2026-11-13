import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

function trimString({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

/** Create payload for `POST /api/municipios`. */
export class CreateMunicipioDto {
  @Transform(trimString)
  @IsString()
  @IsNotEmpty({ message: 'El nombre del municipio es obligatorio' })
  @MinLength(2)
  @MaxLength(100)
  nombre: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(100)
  ciudad?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(100)
  departamento?: string;
}

/** Update payload for `PATCH /api/municipios/:id`. */
export class UpdateMunicipioDto {
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nombre?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(100)
  ciudad?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(100)
  departamento?: string;
}

/** Create payload for `POST /api/servicios`. */
export class CreateServicioDto {
  @Transform(trimString)
  @IsString()
  @IsNotEmpty({ message: 'El nombre del servicio es obligatorio' })
  @MinLength(2)
  @MaxLength(80)
  nombre: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(80)
  nombreEn?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(40)
  icono?: string;
}

