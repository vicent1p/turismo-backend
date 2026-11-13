import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { HotelesModule } from './hoteles/hoteles.module';
import { CatalogosModule } from './catalogos/catalogos.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { UploadsModule } from './uploads/uploads.module';
import { EncuestasModule } from './encuestas/encuestas.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: 60_000,
          limit: 120,
        },
      ],
      errorMessage: 'Demasiadas solicitudes. Por favor, inténtalo de nuevo más tarde.',
    }),
    CommonModule,
    PrismaModule,
    AuthModule,
    DashboardModule,
    HotelesModule,
    CatalogosModule,
    UsuariosModule,
    UploadsModule,
    EncuestasModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
