import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EncuestasController } from './encuestas.controller';
import { EncuestasService } from './encuestas.service';

@Module({
  imports: [PrismaModule],
  controllers: [EncuestasController],
  providers: [EncuestasService],
  exports: [EncuestasService],
})
export class EncuestasModule {}

