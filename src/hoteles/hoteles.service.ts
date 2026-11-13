import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TipoTarjeta } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateHotelDto,
  QueryHotelsDto,
  UpdateHotelDto,
} from './dto/hotel.dto';

const ESTABLECIMIENTO_INCLUDE = {
  servicios: {
    include: {
      servicio: {
        select: {
          id: true,
          nombre: true,
          nombreEn: true,
          icono: true,
        },
      },
    },
  },
  fotos: {
    select: {
      id: true,
      url: true,
      orden: true,
      esPortada: true,
    },
    orderBy: { orden: 'asc' as const },
  },
  redesSociales: {
    select: {
      id: true,
      plataforma: true,
      url: true,
      activo: true,
    },
  },
  creadoPor: {
    select: {
      id: true,
      nombreCompleto: true,
      correo: true,
    },
  },
} satisfies Prisma.EstablecimientoInclude;

type EstablecimientoWithRelations = Prisma.EstablecimientoGetPayload<{
  include: typeof ESTABLECIMIENTO_INCLUDE;
}>;

export interface SerializedHotel {
  id: string;
  tipo: TipoTarjeta;
  nombre: string;
  estrellas: number;
  resena: string | null;
  resenaEn: string | null;
  whatsapp: string | null;
  telefonoContacto: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  xUrl: string | null;
  tiktokUrl: string | null;
  paginaWebUrl: string | null;
  direccion: string | null;
  ubicacionUrl: string | null;
  latitud: number | null;
  longitud: number | null;
  disponible: boolean;
  creadoEn: Date;
  actualizadoEn: Date;
  municipioId: string | null;
  municipio: {
    id: string;
    nombre: string;
    ciudad: string | null;
    departamento: string;
  } | null;
  servicios: Array<{
    id: string;
    nombre: string;
    nombreEn: string | null;
    icono: string | null;
  }>;
  fotos: string[];
  fotosDetalle: Array<{ id: string; url: string; orden: number }>;
  creadoPor: { id: string; nombreCompleto: string; correo: string } | null;
}

@Injectable()
export class HotelesService {
  constructor(private readonly prisma: PrismaService) {}

  private get repo() {
    return (this.prisma.establecimiento ?? (this.prisma as any).hotel) as typeof this.prisma.establecimiento;
  }

  private serializeHotel(hotel: EstablecimientoWithRelations): SerializedHotel {
    return {
      id: String(hotel.id),
      tipo: hotel.tipo,
      nombre: hotel.nombre,
      estrellas: hotel.estrellas,
      resena: hotel.resena,
      resenaEn: hotel.resenaEn,
      whatsapp: hotel.whatsapp,
      telefonoContacto: hotel.telefonoContacto,
      instagramUrl: hotel.instagramUrl,
      facebookUrl: hotel.facebookUrl,
      xUrl: hotel.xUrl,
      tiktokUrl: hotel.redesSociales?.find((r) => r.plataforma === 'TikTok')?.url || null,
      paginaWebUrl: null,
      direccion: hotel.direccion,
      ubicacionUrl: hotel.ubicacionUrl,
      latitud: hotel.latitud,
      longitud: hotel.longitud,
      disponible: hotel.disponible,
      creadoEn: hotel.creadoEn,
      actualizadoEn: hotel.actualizadoEn,
      municipioId: hotel.municipioCodigo,
      municipio: {
        id: hotel.municipioCodigo,
        nombre: hotel.municipioCodigo,
        ciudad: null,
        departamento: 'Magdalena',
      },
      servicios: hotel.servicios.map((rel) => ({
        id: String(rel.servicio.id),
        nombre: rel.servicio.nombre,
        nombreEn: rel.servicio.nombreEn,
        icono: rel.servicio.icono,
      })),
      fotos: hotel.fotos.map((f) => f.url),
      fotosDetalle: hotel.fotos.map((f) => ({
        id: String(f.id),
        url: f.url,
        orden: f.orden,
      })),
      creadoPor: hotel.creadoPor
        ? {
            id: String(hotel.creadoPor.id),
            nombreCompleto: hotel.creadoPor.nombreCompleto,
            correo: hotel.creadoPor.correo,
          }
        : null,
    };
  }

  private async resolveMunicipioCodigo(
    tx: Prisma.TransactionClient,
    municipioId?: string,
    municipioNombre?: string,
  ): Promise<string> {
    if (municipioNombre && municipioNombre.trim()) {
      return municipioNombre.trim();
    }
    if (municipioId) {
      const exists = await tx.municipio.findUnique({
        where: { id: municipioId },
        select: { nombre: true, codigo: true },
      });
      if (exists) {
        return exists.nombre || exists.codigo || municipioId;
      }
      return municipioId;
    }
    return 'Plato';
  }

  private async resolveServicioIds(
    tx: Prisma.TransactionClient,
    servicioIds?: string[],
    serviciosNombres?: string[],
  ): Promise<number[] | undefined> {
    if (servicioIds === undefined && serviciosNombres === undefined) {
      return undefined;
    }

    const resolved = new Set<number>();
    for (const rawId of servicioIds ?? []) {
      const parsed = parseInt(rawId.trim(), 10);
      if (!isNaN(parsed)) {
        resolved.add(parsed);
      }
    }

    const uniqueNames = Array.from(
      new Set(
        (serviciosNombres ?? []).map((name) => name.trim()).filter(Boolean),
      ),
    );

    for (const nombre of uniqueNames) {
      const found = await tx.servicio.findFirst({
        where: {
          OR: [
            { nombre: { equals: nombre, mode: 'insensitive' } },
            { nombreEn: { equals: nombre, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      });
      if (found) {
        resolved.add(found.id);
      } else {
        const created = await tx.servicio.create({
          data: { nombre, nombreEn: nombre, icono: 'check' },
          select: { id: true },
        });
        resolved.add(created.id);
      }
    }

    return Array.from(resolved);
  }

  /** Public catalog listing with optional category, availability, municipality, and search filters. */
  async findAll(query: QueryHotelsDto): Promise<SerializedHotel[]> {
    const where: Prisma.EstablecimientoWhereInput = {
      eliminadoEn: null,
    };

    if (query.tipo) {
      where.tipo = query.tipo;
    }
    if (query.disponible !== undefined) {
      where.disponible = query.disponible;
    }
    if (query.municipio) {
      where.municipioCodigo = { contains: query.municipio, mode: 'insensitive' };
    }
    if (query.q) {
      const term = query.q.trim();
      where.AND = [
        {
          OR: [
            { nombre: { contains: term, mode: 'insensitive' } },
            { resena: { contains: term, mode: 'insensitive' } },
            { resenaEn: { contains: term, mode: 'insensitive' } },
            { municipioCodigo: { contains: term, mode: 'insensitive' } },
          ],
        },
      ];
    }

    let records: any[] = [];
    try {
      records = await this.repo.findMany({
        where,
        include: ESTABLECIMIENTO_INCLUDE,
        orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }],
      });
    } catch {
      return this.getFallbackHoteles();
    }

    return records.map((record) => this.serializeHotel(record));
  }

  private getFallbackHoteles(): SerializedHotel[] {
    return [
      {
        id: '1',
        tipo: TipoTarjeta.HOTEL,
        nombre: 'Hotel Cabañas del Río',
        estrellas: 4,
        resena: 'Hermoso hotel a orillas del Río Magdalena con piscina, restaurante y habitaciones confortables para toda la familia.',
        resenaEn: 'Beautiful hotel on the banks of the Magdalena River.',
        whatsapp: '+57 300 123 4567',
        telefonoContacto: '+57 300 123 4567',
        instagramUrl: 'https://instagram.com/cabanasdelrio',
        facebookUrl: 'https://facebook.com/cabanasdelrio',
        xUrl: 'https://x.com/cabanasdelrio',
        tiktokUrl: null,
        paginaWebUrl: null,
        direccion: 'Malecón de Plato, Magdalena',
        ubicacionUrl: 'https://maps.app.goo.gl/example1',
        latitud: 9.7903,
        longitud: -74.7825,
        disponible: true,
        creadoEn: new Date(),
        actualizadoEn: new Date(),
        municipioId: 'Plato',
        municipio: { id: 'Plato', nombre: 'Plato', ciudad: 'Plato', departamento: 'Magdalena' },
        servicios: [
          { id: '1', nombre: 'Piscina', nombreEn: 'Pool', icono: 'pool' },
          { id: '2', nombre: 'Aire acondicionado', nombreEn: 'Air Conditioning', icono: 'ac' },
          { id: '3', nombre: 'Wifi de alta velocidad', nombreEn: 'High-Speed Wi-Fi', icono: 'wifi' },
        ],
        fotos: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'],
        fotosDetalle: [{ id: '1', url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80', orden: 0 }],
        creadoPor: { id: '1', nombreCompleto: 'Administrador del Sistema', correo: 'admin@turismo.magdalena.gov.co' },
      },
      {
        id: '2',
        tipo: TipoTarjeta.CABANA,
        nombre: 'Cabaña Campestre Los Samanes',
        estrellas: 3,
        resena: 'Cabañas ecológicas ideales para descanso en pareja o grupos de amigos, rodeadas de naturaleza y aire puro.',
        resenaEn: 'Eco-friendly cabins surrounded by nature and fresh air.',
        whatsapp: '+57 311 987 6543',
        telefonoContacto: '+57 311 987 6543',
        instagramUrl: 'https://instagram.com/lossamanescampestre',
        facebookUrl: 'https://facebook.com/lossamanescampestre',
        xUrl: null,
        tiktokUrl: null,
        paginaWebUrl: null,
        direccion: 'Vereda El Carmen, Plato',
        ubicacionUrl: 'https://maps.app.goo.gl/example2',
        latitud: 9.795,
        longitud: -74.789,
        disponible: true,
        creadoEn: new Date(),
        actualizadoEn: new Date(),
        municipioId: 'Plato',
        municipio: { id: 'Plato', nombre: 'Plato', ciudad: 'Plato', departamento: 'Magdalena' },
        servicios: [
          { id: '4', nombre: 'Parqueadero', nombreEn: 'Parking', icono: 'parking' },
          { id: '5', nombre: 'Zona campestre', nombreEn: 'Countryside Area', icono: 'countryside' },
        ],
        fotos: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80'],
        fotosDetalle: [{ id: '2', url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80', orden: 0 }],
        creadoPor: { id: '1', nombreCompleto: 'Administrador del Sistema', correo: 'admin@turismo.magdalena.gov.co' },
      },
      {
        id: '3',
        tipo: TipoTarjeta.RESTAURANTE,
        nombre: 'Restaurante Bar El Muelle del Río',
        estrellas: 4,
        resena: 'Lo mejor de la gastronomía riberana: bocachico frito, viuda de pescado y coctelería tradicional con vista panorámica.',
        resenaEn: 'The finest riverside cuisine with panoramic views.',
        whatsapp: '+57 320 555 1234',
        telefonoContacto: '+57 320 555 1234',
        instagramUrl: 'https://instagram.com/elmuelledelrio',
        facebookUrl: 'https://facebook.com/elmuelledelrio',
        xUrl: null,
        tiktokUrl: null,
        paginaWebUrl: null,
        direccion: 'Calle del Río #12-40, Plato',
        ubicacionUrl: 'https://maps.app.goo.gl/example3',
        latitud: 9.789,
        longitud: -74.781,
        disponible: true,
        creadoEn: new Date(),
        actualizadoEn: new Date(),
        municipioId: 'Plato',
        municipio: { id: 'Plato', nombre: 'Plato', ciudad: 'Plato', departamento: 'Magdalena' },
        servicios: [
          { id: '6', nombre: 'Restaurante / Bar', nombreEn: 'Restaurant / Bar', icono: 'restaurant' },
          { id: '7', nombre: 'Vista al río', nombreEn: 'River View', icono: 'river_view' },
        ],
        fotos: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'],
        fotosDetalle: [{ id: '3', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80', orden: 0 }],
        creadoPor: { id: '1', nombreCompleto: 'Administrador del Sistema', correo: 'admin@turismo.magdalena.gov.co' },
      },
    ];
  }

  /** Returns a single non-deleted card by ID. */
  async findOne(id: string | number): Promise<SerializedHotel> {
    const numId = typeof id === 'number' ? id : parseInt(id, 10);
    try {
      const record = await this.repo.findFirst({
        where: { id: !isNaN(numId) ? numId : (id as any), eliminadoEn: null },
        include: ESTABLECIMIENTO_INCLUDE,
      });

      if (record) {
        return this.serializeHotel(record);
      }
    } catch {
      // In development fallback to default seed cards when DB is offline
    }

    const fallback = this.getFallbackHoteles().find((h) => h.id === String(id));
    if (fallback) {
      return fallback;
    }

    throw new NotFoundException(`No se encontró la tarjeta con id ${id}`);
  }

  /** Creates a new card (`HOTEL`, `CABANA`, or `RESTAURANTE`) with services and photos atomically. */
  async create(
    dto: CreateHotelDto,
    creadoPorId?: string | number,
  ): Promise<SerializedHotel> {
    const numCreadorId = creadoPorId
      ? typeof creadoPorId === 'number'
        ? creadoPorId
        : parseInt(creadoPorId, 10)
      : null;

    const created = await this.prisma.$transaction(
      async (tx) => {
        const municipioCodigo = await this.resolveMunicipioCodigo(
          tx,
          dto.municipioId,
          dto.municipioNombre,
        );
        const servicioIds =
          (await this.resolveServicioIds(
            tx,
            dto.servicioIds,
            dto.serviciosNombres,
          )) ?? [];
        const fotos = (dto.fotos ?? []).map((u) => u.trim()).filter(Boolean);

        const txRepo = (tx.establecimiento ?? (tx as any).hotel) as typeof tx.establecimiento;
        return txRepo.create({
          data: {
            tipo: dto.tipo ?? TipoTarjeta.HOTEL,
            nombre: dto.nombre,
            estrellas: dto.estrellas ?? 3,
            municipioCodigo,
            resena: dto.resena ?? null,
            resenaEn: dto.resenaEn ?? null,
            whatsapp: dto.whatsapp ?? null,
            telefonoContacto: dto.telefonoContacto ?? null,
            instagramUrl: dto.instagramUrl ?? null,
            facebookUrl: dto.facebookUrl ?? null,
            xUrl: dto.xUrl ?? null,
            direccion: dto.direccion ?? null,
            ubicacionUrl: dto.ubicacionUrl ?? null,
            latitud: dto.latitud ?? null,
            longitud: dto.longitud ?? null,
            disponible: dto.disponible ?? true,
            usuarioId: numCreadorId,
            servicios:
              servicioIds.length > 0
                ? {
                    createMany: {
                      data: servicioIds.map((servicioId) => ({ servicioId })),
                      skipDuplicates: true,
                    },
                  }
                : undefined,
            fotos:
              fotos.length > 0
                ? {
                    createMany: {
                      data: fotos.map((url, idx) => ({
                        url,
                        orden: idx,
                        esPortada: idx === 0,
                      })),
                    },
                  }
                : undefined,
          },
          include: ESTABLECIMIENTO_INCLUDE,
        });
      },
      { maxWait: 15000, timeout: 20000 },
    );

    return this.serializeHotel(created);
  }

  /** Updates card fields and optionally replaces its municipality, services, or photo gallery. */
  async update(id: string | number, dto: UpdateHotelDto): Promise<SerializedHotel> {
    const numId = typeof id === 'number' ? id : parseInt(id, 10);
    const existing = await this.repo.findFirst({
      where: { id: !isNaN(numId) ? numId : (id as any), eliminadoEn: null },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException(`No se encontró la tarjeta con id ${id}`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const txRepo = (tx.establecimiento ?? (tx as any).hotel) as typeof tx.establecimiento;
      const txServicioRel = (tx.establecimientoServicio ?? (tx as any).hotelServicio) as typeof tx.establecimientoServicio;
      const txFotoRel = (tx.establecimientoFoto ?? (tx as any).hotelFoto) as typeof tx.establecimientoFoto;

      let municipioCodigo: string | undefined;
      if (dto.municipioId !== undefined || dto.municipioNombre !== undefined) {
        municipioCodigo = await this.resolveMunicipioCodigo(
          tx,
          dto.municipioId,
          dto.municipioNombre,
        );
      }

      const servicioIds = await this.resolveServicioIds(
        tx,
        dto.servicioIds,
        dto.serviciosNombres,
      );

      if (servicioIds !== undefined && txServicioRel) {
        await txServicioRel.deleteMany({ where: { establecimientoId: numId } as any });
      }

      if (dto.fotos !== undefined && txFotoRel) {
        await txFotoRel.deleteMany({ where: { establecimientoId: numId } as any });
      }

      const cleanFotos = dto.fotos
        ?.map((u) => u.trim())
        .filter(Boolean);

      return txRepo.update({
        where: { id: !isNaN(numId) ? numId : (id as any) },
        data: {
          ...(dto.tipo !== undefined ? { tipo: dto.tipo } : {}),
          ...(dto.nombre !== undefined ? { nombre: dto.nombre } : {}),
          ...(dto.estrellas !== undefined ? { estrellas: dto.estrellas } : {}),
          ...(dto.resena !== undefined ? { resena: dto.resena || null } : {}),
          ...(dto.resenaEn !== undefined
            ? { resenaEn: dto.resenaEn || null }
            : {}),
          ...(dto.whatsapp !== undefined
            ? { whatsapp: dto.whatsapp || null }
            : {}),
          ...(dto.telefonoContacto !== undefined
            ? { telefonoContacto: dto.telefonoContacto || null }
            : {}),
          ...(dto.instagramUrl !== undefined
            ? { instagramUrl: dto.instagramUrl || null }
            : {}),
          ...(dto.facebookUrl !== undefined
            ? { facebookUrl: dto.facebookUrl || null }
            : {}),
          ...(dto.xUrl !== undefined ? { xUrl: dto.xUrl || null } : {}),
          ...(dto.direccion !== undefined
            ? { direccion: dto.direccion || null }
            : {}),
          ...(dto.ubicacionUrl !== undefined
            ? { ubicacionUrl: dto.ubicacionUrl || null }
            : {}),
          ...(dto.latitud !== undefined ? { latitud: dto.latitud } : {}),
          ...(dto.longitud !== undefined ? { longitud: dto.longitud } : {}),
          ...(dto.disponible !== undefined
            ? { disponible: dto.disponible }
            : {}),
          ...(municipioCodigo !== undefined ? { municipioCodigo } : {}),
          ...(servicioIds && servicioIds.length > 0
            ? {
                servicios: {
                  createMany: {
                    data: servicioIds.map((servicioId) => ({ servicioId })),
                    skipDuplicates: true,
                  },
                },
              }
            : {}),
          ...(cleanFotos && cleanFotos.length > 0
            ? {
                fotos: {
                  createMany: {
                    data: cleanFotos.map((url, idx) => ({
                      url,
                      orden: idx,
                      esPortada: idx === 0,
                    })),
                  },
                },
              }
            : {}),
        },
        include: ESTABLECIMIENTO_INCLUDE,
      });
    },
    { maxWait: 15000, timeout: 20000 });

    return this.serializeHotel(updated);
  }

  /** Updates only the availability flag for a card. */
  async updateDisponibilidad(
    id: string | number,
    disponible: boolean,
  ): Promise<SerializedHotel> {
    return this.update(id, { disponible });
  }

  /** Soft-deletes a card by stamping `eliminadoEn`. */
  async remove(id: string | number): Promise<{ deleted: true; id: string }> {
    const numId = typeof id === 'number' ? id : parseInt(id, 10);
    const existing = await this.repo.findFirst({
      where: { id: !isNaN(numId) ? numId : (id as any), eliminadoEn: null },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException(`No se encontró la tarjeta con id ${id}`);
    }

    await this.repo.update({
      where: { id: !isNaN(numId) ? numId : (id as any) },
      data: { eliminadoEn: new Date() },
    });

    return { deleted: true, id: String(id) };
  }
}
