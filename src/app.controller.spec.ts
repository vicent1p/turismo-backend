import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

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

    it('should throw 503 ServiceUnavailableException when PostgreSQL fails', async () => {
      mockPrisma.$queryRaw.mockRejectedValueOnce(new Error('ECONNREFUSED'));
      await expect(appController.getHealth()).rejects.toThrow(ServiceUnavailableException);
    });
  });
});
