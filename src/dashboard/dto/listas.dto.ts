export class HotelRecienteDto {
  id: string;
  nombre: string;
  fecha: Date;
  quien: string;
}

export class HotelIncompletoDto {
  id: string;
  nombre: string;
  faltantes: string[];
}

export class HotelSinActualizarDto {
  id: string;
  nombre: string;
  diasSinActualizar: number;
  actualizadoEn: Date;
}

export class ListasResponseDto {
  recientes: HotelRecienteDto[];
  incompletos: HotelIncompletoDto[];
  sinActualizar: HotelSinActualizarDto[];
}
