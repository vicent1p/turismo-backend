import { Test, TestingModule } from '@nestjs/testing';
import { Rol } from '@prisma/client';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      hotel: {
        count: jest.fn(),
        groupBy: jest.fn(),
        findMany: jest.fn(),
      },
      municipio: {
        findMany: jest.fn(),
      },
      usuario: {
        count: jest.fn(),
        groupBy: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getResumen', () => {
    it('should return metrics and include usuarios for ADMIN', async () => {
      mockPrisma.hotel.count
        .mockResolvedValueOnce(15) // total
        .mockResolvedValueOnce(12) // disponibles
        .mockResolvedValueOnce(3); // no disponibles

      mockPrisma.hotel.groupBy.mockResolvedValueOnce([
        { municipioId: 'm1', _count: { id: 10 } },
        { municipioId: 'm2', _count: { id: 5 } },
      ]);

      mockPrisma.municipio.findMany.mockResolvedValueOnce([
        { id: 'm1', nombre: 'Plato' },
        { id: 'm2', nombre: 'Santa Marta' },
      ]);

      mockPrisma.usuario.count.mockResolvedValueOnce(4);
      mockPrisma.usuario.groupBy.mockResolvedValueOnce([
        { rol: Rol.ADMIN, _count: { id: 2 } },
        { rol: Rol.GESTOR, _count: { id: 2 } },
      ]);

      const result = await service.getResumen(Rol.ADMIN);

      expect(result.totalHoteles).toBe(15);
      expect(result.hotelesDisponibles).toBe(12);
      expect(result.hotelesNoDisponibles).toBe(3);
      expect(result.hotelesPorMunicipio).toHaveLength(2);
      expect(result.hotelesPorMunicipio[0]).toEqual({ municipio: 'Plato', total: 10 });
      expect(result.usuarios).toBeDefined();
      expect(result.usuarios?.total).toBe(4);
      expect(result.usuarios?.administradores).toBe(2);
      expect(result.usuarios?.gestores).toBe(2);
    });

    it('should OMIT usuarios field when role is GESTOR', async () => {
      mockPrisma.hotel.count
        .mockResolvedValueOnce(15)
        .mockResolvedValueOnce(12)
        .mockResolvedValueOnce(3);

      mockPrisma.hotel.groupBy.mockResolvedValueOnce([]);
      mockPrisma.municipio.findMany.mockResolvedValueOnce([]);

      const result = await service.getResumen(Rol.GESTOR);

      expect(result.totalHoteles).toBe(15);
      expect(result.usuarios).toBeUndefined();
      expect(mockPrisma.usuario.count).not.toHaveBeenCalled();
    });
  });

  describe('getGraficas', () => {
    it('should return availability, all 5 star tiers and municipality distribution', async () => {
      mockPrisma.hotel.count
        .mockResolvedValueOnce(8) // disponibles
        .mockResolvedValueOnce(2); // no disponibles

      mockPrisma.hotel.groupBy
        .mockResolvedValueOnce([
          { estrellas: 3, _count: { id: 4 } },
          { estrellas: 4, _count: { id: 6 } },
        ])
        .mockResolvedValueOnce([
          { municipioId: 'm1', _count: { id: 10 } },
        ]);

      mockPrisma.municipio.findMany.mockResolvedValueOnce([
        { id: 'm1', nombre: 'Plato' },
      ]);

      const result = await service.getGraficas();

      expect(result.disponibilidad).toEqual({ disponibles: 8, noDisponibles: 2 });
      expect(result.porEstrellas).toHaveLength(5);
      expect(result.porEstrellas[0]).toEqual({ estrellas: 1, total: 0 });
      expect(result.porEstrellas[2]).toEqual({ estrellas: 3, total: 4 });
      expect(result.porEstrellas[3]).toEqual({ estrellas: 4, total: 6 });
      expect(result.porMunicipio[0]).toEqual({ municipio: 'Plato', total: 10 });
    });
  });

  describe('getMapa', () => {
    it('should return only hotels with non-null coordinates and not deleted', async () => {
      mockPrisma.hotel.findMany.mockResolvedValueOnce([
        {
          id: 'h1',
          nombre: 'Hotel Los Recuerdos',
          estrellas: 4,
          whatsapp: '573000000001',
          disponible: true,
          latitud: 9.7903,
          longitud: -74.7824,
          municipio: { nombre: 'Plato' },
        },
      ]);

      const result = await service.getMapa();

      expect(result).toHaveLength(1);
      expect(result[0].nombre).toBe('Hotel Los Recuerdos');
      expect(result[0].latitud).toBe(9.7903);
      expect(result[0].longitud).toBe(-74.7824);
      expect(result[0].municipio).toBe('Plato');
    });
  });

  describe('getListas', () => {
    it('should return recent hotels, identify missing items for incomplete hotels, and old hotels', async () => {
      const now = new Date();
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

      mockPrisma.hotel.findMany
        .mockResolvedValueOnce([
          {
            id: 'h1',
            nombre: 'Hotel Caimán Dorado',
            actualizadoEn: now,
            creadoPor: { nombreCompleto: 'Gestor de Contenidos' },
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 'h2',
            nombre: 'Hotel Incompleto',
            whatsapp: '',
            ubicacionUrl: null,
            latitud: null,
            resena: '',
            _count: { fotos: 0 },
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 'h3',
            nombre: 'Hotel Desactualizado',
            actualizadoEn: sixtyDaysAgo,
          },
        ]);

      const result = await service.getListas();

      expect(result.recientes).toHaveLength(1);
      expect(result.recientes[0].quien).toBe('Gestor de Contenidos');

      expect(result.incompletos).toHaveLength(1);
      expect(result.incompletos[0].faltantes).toEqual([
        'Sin fotos',
        'Sin WhatsApp',
        'Sin ubicación',
        'Sin reseña',
      ]);

      expect(result.sinActualizar).toHaveLength(1);
      expect(result.sinActualizar[0].diasSinActualizar).toBeGreaterThanOrEqual(59);
    });
  });
});
