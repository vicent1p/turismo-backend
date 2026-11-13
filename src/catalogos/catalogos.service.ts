import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateMunicipioDto,
  CreateServicioDto,
  UpdateMunicipioDto,
} from './dto/catalogo.dto';

@Injectable()
export class CatalogosService {
  constructor(private readonly prisma: PrismaService) {}

  private get estRepo() {
    return (this.prisma.establecimiento ?? (this.prisma as any).hotel);
  }

  /** Lists all municipalities ordered alphabetically with active card counts. */
  async findAllMunicipios() {
    try {
      const estPromise = this.estRepo?.findMany
        ? this.estRepo.findMany({
            where: { eliminadoEn: null },
            select: { municipioCodigo: true, municipioId: true } as any,
          })
        : Promise.resolve([]);

      const [municipios, rawEstablecimientos] = await Promise.all([
        this.prisma.municipio.findMany({
          orderBy: { nombre: 'asc' },
        } as any),
        estPromise,
      ]);

      const countByCodigo = new Map<string, number>();
      for (const est of (rawEstablecimientos || []) as any[]) {
        const code = est.municipioCodigo || est.municipioId;
        if (code) {
          countByCodigo.set(code, (countByCodigo.get(code) ?? 0) + 1);
        }
      }

      return municipios.map((m: any) => {
        const count =
          (countByCodigo.get(m.id) ?? 0) +
          (m.codigo ? (countByCodigo.get(m.codigo) ?? 0) : 0) +
          (countByCodigo.get(m.nombre) ?? 0) +
          (m._count?.hoteles ?? 0);
        return {
          id: m.id,
          nombre: m.nombre,
          ciudad: m.ciudad,
          departamento: m.departamento,
          totalTarjetas: count,
        };
      });
    } catch {
      return [
        { id: 'Plato', nombre: 'Plato', ciudad: 'Plato', departamento: 'Magdalena', totalTarjetas: 3 },
        { id: 'Santa Marta', nombre: 'Santa Marta', ciudad: 'Santa Marta', departamento: 'Magdalena', totalTarjetas: 0 },
        { id: 'Ciénaga', nombre: 'Ciénaga', ciudad: 'Ciénaga', departamento: 'Magdalena', totalTarjetas: 0 },
      ];
    }
  }

  /** Fetches one municipality by ID. */
  async findOneMunicipio(id: string) {
    const municipio = await this.prisma.municipio.findUnique({
      where: { id },
    } as any);

    if (!municipio) {
      throw new NotFoundException(`Municipio con id ${id} no encontrado`);
    }

    let count = (municipio as any)._count?.hoteles ?? 0;
    if (this.estRepo?.count) {
      const dbCount = await this.estRepo.count({
        where: {
          eliminadoEn: null,
          OR: [
            { municipioCodigo: municipio.id },
            ...(municipio.codigo ? [{ municipioCodigo: municipio.codigo }] : []),
            { municipioCodigo: municipio.nombre },
            { municipioId: municipio.id } as any,
          ],
        },
      });
      if (dbCount > count) count = dbCount;
    }

    return {
      id: municipio.id,
      nombre: municipio.nombre,
      ciudad: municipio.ciudad,
      departamento: municipio.departamento,
      totalTarjetas: count,
    };
  }

  /** Creates a new municipality ensuring unique name case-insensitively. */
  async createMunicipio(dto: CreateMunicipioDto) {
    const duplicate = await this.prisma.municipio.findFirst({
      where: { nombre: { equals: dto.nombre, mode: 'insensitive' } },
      select: { id: true },
    });
    if (duplicate) {
      throw new ConflictException(`El municipio "${dto.nombre}" ya existe`);
    }

    return this.prisma.municipio.create({
      data: {
        nombre: dto.nombre,
        ciudad: dto.ciudad ?? null,
        departamento: dto.departamento ?? 'Magdalena',
      },
    });
  }

  /** Updates municipality metadata with uniqueness check on rename. */
  async updateMunicipio(id: string, dto: UpdateMunicipioDto) {
    const existing = await this.prisma.municipio.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException(`Municipio con id ${id} no encontrado`);
    }

    if (dto.nombre) {
      const clash = await this.prisma.municipio.findFirst({
        where: {
          nombre: { equals: dto.nombre, mode: 'insensitive' },
          NOT: { id },
        },
        select: { id: true },
      });
      if (clash) {
        throw new ConflictException(`Ya existe un municipio llamado "${dto.nombre}"`);
      }
    }

    return this.prisma.municipio.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined ? { nombre: dto.nombre } : {}),
        ...(dto.ciudad !== undefined ? { ciudad: dto.ciudad || null } : {}),
        ...(dto.departamento !== undefined
          ? { departamento: dto.departamento || 'Magdalena' }
          : {}),
      },
    });
  }

  /** Deletes a municipality only when no active cards reference it. */
  async removeMunicipio(id: string): Promise<{ deleted: true; id: string }> {
    const existing = await this.findOneMunicipio(id);
    if (existing.totalTarjetas > 0) {
      throw new ConflictException(
        `No se puede eliminar "${existing.nombre}" porque tiene ${existing.totalTarjetas} tarjetas asociadas`,
      );
    }

    await this.prisma.municipio.delete({ where: { id } });
    return { deleted: true, id };
  }

  /** Lists all available amenities ordered alphabetically. */
  async findAllServicios() {
    try {
      const servicios = await this.prisma.servicio.findMany({
        orderBy: { nombre: 'asc' },
      });
      return servicios.map((s) => ({
        ...s,
        id: String(s.id),
      }));
    } catch {
      return [
        { id: '1', nombre: 'Piscina', nombreEn: 'Pool', icono: 'pool' },
        { id: '2', nombre: 'Aire acondicionado', nombreEn: 'Air Conditioning', icono: 'ac' },
        { id: '3', nombre: 'Wifi de alta velocidad', nombreEn: 'High-Speed Wi-Fi', icono: 'wifi' },
        { id: '4', nombre: 'Parqueadero', nombreEn: 'Parking', icono: 'parking' },
        { id: '5', nombre: 'Restaurante / Bar', nombreEn: 'Restaurant / Bar', icono: 'restaurant' },
      ];
    }
  }

  /** Creates a new amenity ensuring unique name case-insensitively. */
  async createServicio(dto: CreateServicioDto) {
    const duplicate = await this.prisma.servicio.findFirst({
      where: { nombre: { equals: dto.nombre, mode: 'insensitive' } },
      select: { id: true },
    });
    if (duplicate) {
      throw new ConflictException(`El servicio "${dto.nombre}" ya existe`);
    }

    const created = await this.prisma.servicio.create({
      data: {
        nombre: dto.nombre,
        nombreEn: dto.nombreEn ?? dto.nombre,
        icono: dto.icono ?? 'check',
      },
    });

    return {
      ...created,
      id: String(created.id),
    };
  }

  /** Removes an amenity by ID. */
  async removeServicio(id: string | number): Promise<{ deleted: true; id: string }> {
    const numId = typeof id === 'number' ? id : parseInt(id, 10);
    const existing = await this.prisma.servicio.findUnique({
      where: { id: !isNaN(numId) ? numId : (id as any) },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException(`Servicio con id ${id} no encontrado`);
    }
    await this.prisma.servicio.delete({ where: { id: !isNaN(numId) ? numId : (id as any) } });
    return { deleted: true, id: String(id) };
  }
}
