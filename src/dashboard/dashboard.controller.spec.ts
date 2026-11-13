import { Test, TestingModule } from '@nestjs/testing';
import { Rol } from '@prisma/client';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: DashboardService;

  const mockService = {
    getResumen: jest.fn(),
    getGraficas: jest.fn(),
    getMapa: jest.fn(),
    getListas: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [{ provide: DashboardService, useValue: mockService }],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate getResumen passing user role', async () => {
    mockService.getResumen.mockResolvedValueOnce({
      totalHoteles: 10,
      hotelesDisponibles: 8,
      hotelesNoDisponibles: 2,
      hotelesPorMunicipio: [{ municipio: 'Plato', total: 10 }],
    });

    const user = { id: 'u1', correo: 'gestor@test.com', rol: Rol.GESTOR };
    const res = await controller.getResumen(user);

    expect(service.getResumen).toHaveBeenCalledWith(Rol.GESTOR);
    expect(res.totalHoteles).toBe(10);
  });

  it('should delegate getGraficas', async () => {
    mockService.getGraficas.mockResolvedValueOnce({
      disponibilidad: { disponibles: 5, noDisponibles: 1 },
      porEstrellas: [],
      porMunicipio: [],
    });

    const res = await controller.getGraficas();
    expect(service.getGraficas).toHaveBeenCalled();
    expect(res.disponibilidad.disponibles).toBe(5);
  });

  it('should delegate getMapa', async () => {
    mockService.getMapa.mockResolvedValueOnce([]);
    const res = await controller.getMapa();
    expect(service.getMapa).toHaveBeenCalled();
    expect(res).toEqual([]);
  });

  it('should delegate getListas', async () => {
    mockService.getListas.mockResolvedValueOnce({
      recientes: [],
      incompletos: [],
      sinActualizar: [],
    });
    const res = await controller.getListas();
    expect(service.getListas).toHaveBeenCalled();
    expect(res.recientes).toEqual([]);
  });
});
