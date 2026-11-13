import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

function buildPrismaDatasourceUrl(): string | undefined {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) return undefined;

  const poolMax = process.env.DB_POOL_MAX ?? '20';
  const poolTimeoutSec = Math.ceil(
    Number(process.env.DB_POOL_CONNECTION_TIMEOUT_MS ?? 5000) / 1000,
  );

  try {
    const parsed = new URL(rawUrl);
    if (!parsed.searchParams.has('connection_limit')) {
      parsed.searchParams.set('connection_limit', poolMax);
    }
    if (!parsed.searchParams.has('pool_timeout')) {
      parsed.searchParams.set('pool_timeout', String(poolTimeoutSec));
    }
    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const datasourceUrl = buildPrismaDatasourceUrl();
    super({
      ...(datasourceUrl ? { datasources: { db: { url: datasourceUrl } } } : {}),
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
      ],
    });

    const slowQueryThresholdMs = Number(process.env.DB_SLOW_QUERY_MS ?? 1000);
    (this as any).$on('query', (event: { query: string; params: string; duration: number }) => {
      if (event.duration >= slowQueryThresholdMs) {
        this.logger.warn(
          `⚠️ Slow Query detectada (${event.duration}ms >= ${slowQueryThresholdMs}ms): ${event.query.slice(0, 300)}`,
        );
      }
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Conexión exitosa a la base de datos PostgreSQL');
    } catch (error) {
      this.logger.error(
        '⚠️ Error al conectar a la base de datos PostgreSQL. Verifica que el servidor de PostgreSQL esté corriendo y la URL en .env sea correcta:',
        (error as Error).message,
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
