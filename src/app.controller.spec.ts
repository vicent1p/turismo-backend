import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { getTypeOrmConfig } from './config/typeorm.config';

describe('AppController', () => {
  let appController: AppController;
  const mockPrisma = {
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  };

  beforeEach(async () => {
    mockPrisma.$queryRaw.mockReset().mockResolvedValue([{ '?column?': 1 }]);
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });

    it('should return database health ok when PostgreSQL responds', async () => {
      const health = await appController.getHealth();
      expect(health.status).toBe('ok');
      expect(health.database).toBe('connected');
      expect(typeof health.timestamp).toBe('string');
    });

    it('should throw 503 ServiceUnavailableException with Spanish message when PostgreSQL fails', async () => {
      mockPrisma.$queryRaw.mockRejectedValueOnce(new Error('ECONNREFUSED'));
      await expect(appController.getHealth()).rejects.toThrow(
        new ServiceUnavailableException(
          'El servicio está en ejecución, pero no fue posible conectar con la base de datos.',
        ),
      );
    });

    it('should throw 503 ServiceUnavailableException when query times out (> 3000ms)', async () => {
      jest.useFakeTimers();
      // Promise that never resolves immediately
      mockPrisma.$queryRaw.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 10000)),
      );

      const healthPromise = appController.getHealth();
      jest.advanceTimersByTime(3100);

      await expect(healthPromise).rejects.toThrow(
        new ServiceUnavailableException(
          'El servicio está en ejecución, pero no fue posible conectar con la base de datos.',
        ),
      );
      jest.useRealTimers();
    });
  });

  describe('getTypeOrmConfig', () => {
    it('should configure connection pool defaults and slow query threshold', () => {
      const config = getTypeOrmConfig();
      expect(config.type).toBe('postgres');
      expect(config.extra.max).toBe(20);
      expect(config.extra.min).toBe(2);
      expect(config.extra.connectionTimeoutMillis).toBe(5000);
      expect(config.extra.idleTimeoutMillis).toBe(30000);
      expect(config.maxQueryExecutionTime).toBe(1000);
    });
  });
});
