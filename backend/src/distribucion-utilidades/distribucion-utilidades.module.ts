import { Module } from '@nestjs/common';
import { DistribucionUtilidadesService } from './distribucion-utilidades.service';
import { DistribucionUtilidadesController } from './distribucion-utilidades.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DistribucionUtilidadesController],
  providers: [DistribucionUtilidadesService],
  exports: [DistribucionUtilidadesService],
})
export class DistribucionUtilidadesModule {}
