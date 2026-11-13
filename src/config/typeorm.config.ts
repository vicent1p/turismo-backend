/**
 * Configuración de TypeORM con Pool de conexiones parametrizado y detección de slow queries.
 * Diseñada para producción con PostgreSQL (driver pg / pg-pool).
 *
 * Variables de entorno utilizadas:
 * - DB_POOL_MAX (default 20): Máximo de conexiones simultáneas por instancia.
 * - DB_POOL_MIN (default 2): Conexiones "calientes" siempre abiertas.
 * - DB_POOL_CONNECTION_TIMEOUT_MS (default 5000): Tiempo máximo en ms para obtener una conexión del pool.
 * - DB_POOL_IDLE_TIMEOUT_MS (default 30000): Tiempo máximo en ms de inactividad antes de cerrar una conexión.
 * - DB_SLOW_QUERY_MS (default 1000): Umbral en ms para advertir de consultas lentas (maxQueryExecutionTime).
 */

export interface DatabasePoolOptions {
  max: number;
  min: number;
  connectionTimeoutMillis: number;
  idleTimeoutMillis: number;
}

export interface TypeOrmPostgresConfigOptions {
  type: 'postgres';
  url?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  autoLoadEntities?: boolean;
  synchronize?: boolean;
  maxQueryExecutionTime: number;
  extra: DatabasePoolOptions;
}

export function getTypeOrmConfig(): TypeOrmPostgresConfigOptions {
  const poolMax = Number(process.env.DB_POOL_MAX ?? 20);
  const poolMin = Number(process.env.DB_POOL_MIN ?? 2);
  const connectionTimeoutMillis = Number(process.env.DB_POOL_CONNECTION_TIMEOUT_MS ?? 5000);
  const idleTimeoutMillis = Number(process.env.DB_POOL_IDLE_TIMEOUT_MS ?? 30000);
  const maxQueryExecutionTime = Number(process.env.DB_SLOW_QUERY_MS ?? 1000);

  return {
    type: 'postgres',
    url: process.env.DATABASE_URL,
    autoLoadEntities: true,
    synchronize: false,
    maxQueryExecutionTime,
    extra: {
      max: poolMax,
      min: poolMin,
      connectionTimeoutMillis,
      idleTimeoutMillis,
    },
  };
}
