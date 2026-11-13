import { MunicipioCountDto } from './resumen.dto';

export class DisponibilidadGraficaDto {
  disponibles: number;
  noDisponibles: number;
}

export class EstrellasGraficaDto {
  estrellas: number;
  total: number;
}

export class GraficasResponseDto {
  disponibilidad: DisponibilidadGraficaDto;
  porEstrellas: EstrellasGraficaDto[];
  porMunicipio: MunicipioCountDto[];
}
