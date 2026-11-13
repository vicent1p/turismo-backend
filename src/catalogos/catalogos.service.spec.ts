import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { CatalogosService } from './catalogos.service';

describe('CatalogosService', () => {
  let service: CatalogosService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      municipio: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'm-1',
            nombre: 'Plato',
            ciudad: null,
            departamento: 'Magdalena',
            _count: { hoteles: 3 },
          },
        ]),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      servicio: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogosService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CatalogosService>(CatalogosService);
  });

  it('lists municipalities with active card count', async () => {
    const items = await service.findAllMunicipios();
    expect(items).toEqual([
      {
        id: 'm-1',
        nombre: 'Plato',
        ciudad: null,
        departamento: 'Magdalena',
        totalTarjetas: 3,
      },
    ]);
  });

  it('blocks deleting a municipality that still has active cards', async () => {
    mockPrisma.municipio.findUnique.mockResolvedValueOnce({
      id: 'm-1',
      nombre: 'Plato',
      _count: { hoteles: 2 },
    });

    await expect(service.removeMunicipio('m-1')).rejects.toThrow(
      ConflictException,
    );
  });
});

