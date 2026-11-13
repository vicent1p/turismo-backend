import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CatalogosService } from './catalogos.service';
import { MunicipiosController } from './municipios.controller';
import { ServiciosController } from './servicios.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [MunicipiosController, ServiciosController],
  providers: [CatalogosService],
  exports: [CatalogosService],
})
export class CatalogosModule {}

