import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TipoTarjeta } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { HotelesService } from './hoteles.service';

describe('HotelesService', () => {
  let service: HotelesService;
  let mockPrisma: any;

  const baseHotelRow = {
    id: 'h-1',
    tipo: TipoTarjeta.RESTAURANTE,
    nombre: 'Fogón Plateño',
    estrellas: 5,
    resena: 'Comida típica',
    resenaEn: 'Traditional food',
    whatsapp: '573001112233',
    telefonoContacto: null,
    instagramUrl: null,
    facebookUrl: null,
    xUrl: null,
    direccion: 'Centro',
    ubicacionUrl: 'https://maps.example',
    latitud: 9.79,
    longitud: -74.78,
    disponible: true,
    eliminadoEn: null,
    creadoEn: new Date(),
    actualizadoEn: new Date(),
    municipioId: 'm-1',
    municipio: {
      id: 'm-1',
      nombre: 'Plato',
      ciudad: null,
      departamento: 'Magdalena',
    },
    servicios: [
      {
        servicio: {
          id: 's-1',
          nombre: 'Wifi',
          nombreEn: 'Wi-Fi',
          icono: 'wifi',
        },
      },
    ],
    fotos: [{ id: 'f-1', url: 'foto.jpg', orden: 0 }],
    creadoPor: {
      id: 'u-1',
      nombreCompleto: 'Admin',
      correo: 'admin@turismo.magdalena.gov.co',
    },
  };

  beforeEach(async () => {
    const tx = {
      municipio: {
        findUnique: jest.fn(),
        findFirst: jest.fn().mockResolvedValue({ id: 'm-1' }),
        create: jest.fn(),
      },
      servicio: {
        findFirst: jest.fn().mockResolvedValue({ id: 's-1' }),
        create: jest.fn(),
      },
      hotel: {
        create: jest.fn().mockResolvedValue(baseHotelRow),
        update: jest.fn().mockResolvedValue(baseHotelRow),
      },
      hotelServicio: {
        deleteMany: jest.fn(),
      },
      hotelFoto: {
        deleteMany: jest.fn(),
      },
    };

    mockPrisma = {
      hotel: {
        findMany: jest.fn().mockResolvedValue([baseHotelRow]),
        findFirst: jest.fn().mockResolvedValue(baseHotelRow),
        update: jest.fn().mockResolvedValue({ ...baseHotelRow, eliminadoEn: new Date() }),
      },
      $transaction: jest.fn((cb: (client: typeof tx) => unknown) => cb(tx)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HotelesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<HotelesService>(HotelesService);
  });

  it('lists serialized non-deleted hotels with filters', async () => {
    const items = await service.findAll({
      tipo: TipoTarjeta.RESTAURANTE,
      disponible: true,
    });

    expect(items).toHaveLength(1);
    expect(items[0].fotos).toEqual(['foto.jpg']);
    expect(items[0].servicios[0].nombre).toBe('Wifi');
    expect(mockPrisma.hotel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          eliminadoEn: null,
          tipo: TipoTarjeta.RESTAURANTE,
          disponible: true,
        }),
      }),
    );
  });

  it('creates a card atomically resolving municipality name and amenities', async () => {
    const created = await service.create(
      {
        tipo: TipoTarjeta.RESTAURANTE,
        nombre: 'Fogón Plateño',
        municipioNombre: 'Plato',
        serviciosNombres: ['Wifi'],
        fotos: ['foto.jpg'],
      },
      'u-1',
    );

    expect(created.id).toBe('h-1');
    expect(created.tipo).toBe(TipoTarjeta.RESTAURANTE);
    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });

  it('throws NotFoundException when fetching or deleting missing hotel', async () => {
    mockPrisma.hotel.findFirst.mockResolvedValueOnce(null);
    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);

    mockPrisma.hotel.findFirst.mockResolvedValueOnce(null);
    await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
  });

  it('soft deletes an existing hotel by setting eliminadoEn', async () => {
    const res = await service.remove('h-1');
    expect(res).toEqual({ deleted: true, id: 'h-1' });
    expect(mockPrisma.hotel.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'h-1' },
        data: expect.objectContaining({ eliminadoEn: expect.any(Date) }),
      }),
    );
  });
});

