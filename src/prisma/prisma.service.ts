import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ Conexión exitosa a la base de datos PostgreSQL');
    } catch (error) {
      console.error(
        '⚠️ Error al conectar a la base de datos PostgreSQL. Verifica que el servidor de PostgreSQL esté corriendo y la URL en .env sea correcta:',
        (error as Error).message,
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
