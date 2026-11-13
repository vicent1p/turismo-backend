export class MapaHotelDto {
  id: string;
  nombre: string;
  tipo?: string;
  estrellas: number;
  municipio: string;
  whatsapp: string | null;
  disponible: boolean;
  latitud: number;
  longitud: number;
}
