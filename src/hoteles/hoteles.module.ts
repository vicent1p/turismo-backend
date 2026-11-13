import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { HotelesController } from './hoteles.controller';
import { HotelesService } from './hoteles.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [HotelesController],
  providers: [HotelesService],
  exports: [HotelesService],
})
export class HotelesModule {}

