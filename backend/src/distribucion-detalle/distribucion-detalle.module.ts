import { Module } from '@nestjs/common';
import { DistribucionDetalleService } from './distribucion-detalle.service';
import { DistribucionDetalleController } from './distribucion-detalle.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DistribucionDetalleController],
  providers: [DistribucionDetalleService],
  exports: [DistribucionDetalleService],
})
export class DistribucionDetalleModule {}
