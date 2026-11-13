import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoPregunta } from '@prisma/client';

export class CreateOpcionDto {
  @IsString()
  @IsNotEmpty()
  texto: string;

  @IsOptional()
  @IsInt()
  orden?: number;
}

export class CreatePreguntaDto {
  @IsString()
  @IsNotEmpty()
  pregunta: string;

  @IsEnum(TipoPregunta)
  tipoPregunta: TipoPregunta;

  @IsOptional()
  @IsBoolean()
  obligatoria?: boolean;

  @IsOptional()
  @IsInt()
  orden?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOpcionDto)
  opciones?: CreateOpcionDto[];
}

export class CreateEncuestaDto {
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsBoolean()
  activa?: boolean;

  @IsOptional()
  @IsBoolean()
  mostrarEnLanding?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePreguntaDto)
  preguntas?: CreatePreguntaDto[];
}

export class UpdateEncuestaDto {
  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsBoolean()
  activa?: boolean;

  @IsOptional()
  @IsBoolean()
  mostrarEnLanding?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePreguntaDto)
  preguntas?: CreatePreguntaDto[];
}

export class DetalleRespuestaItemDto {
  @IsInt()
  preguntaId: number;

  @IsOptional()
  @IsInt()
  opcionId?: number;

  @IsOptional()
  @IsString()
  respuestaTexto?: string;
}

export class ResponderEncuestaDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleRespuestaItemDto)
  respuestas: DetalleRespuestaItemDto[];
}

