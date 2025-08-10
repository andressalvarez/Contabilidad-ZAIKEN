import { Module } from '@nestjs/common';
import { ValorHoraService } from './valor-hora.service';
import { ValorHoraController } from './valor-hora.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ValorHoraController],
  providers: [ValorHoraService],
  exports: [ValorHoraService],
})
export class ValorHoraModule {}
