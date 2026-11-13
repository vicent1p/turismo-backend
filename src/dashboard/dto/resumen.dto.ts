export class MunicipioCountDto {
  municipio: string;
  total: number;
}

export class UsuariosResumenDto {
  total: number;
  administradores: number;
  gestores: number;
}

export class ResumenResponseDto {
  totalHoteles: number;
  hotelesDisponibles: number;
  hotelesNoDisponibles: number;
  hotelesPorMunicipio: MunicipioCountDto[];
  usuarios?: UsuariosResumenDto;
}
