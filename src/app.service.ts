import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

export interface HealthStatusDto {
  status: 'ok';
  database: 'connected';
  timestamp: string;
}

const HEALTH_CHECK_TIMEOUT_MS = 3000;

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  /**
   * Verifies application liveness and active PostgreSQL connectivity for load balancers/containers.
   * Runs trivial SELECT 1 with a strict 3000ms timeout to avoid hanging if the pool is saturated.
   */
  async checkHealth(): Promise<HealthStatusDto> {
    try {
      const queryPromise = this.prisma.$queryRaw`SELECT 1`;
      let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

      const timeoutPromise = new Promise((_, reject) => {
        timeoutHandle = setTimeout(
          () => reject(new Error('Health check query timed out')),
          HEALTH_CHECK_TIMEOUT_MS,
        );
      });

      try {
        await Promise.race([queryPromise, timeoutPromise]);
      } finally {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }
      }

      return {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException(
        'El servicio está en ejecución, pero no fue posible conectar con la base de datos.',
      );
    }
  }
}
