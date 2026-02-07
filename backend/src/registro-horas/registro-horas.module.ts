import { Module } from '@nestjs/common';
import { RegistroHorasService } from './registro-horas.service';
import { RegistroHorasController } from './registro-horas.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { HourDebtModule } from '../hour-debt/hour-debt.module';

@Module({
  imports: [PrismaModule, HourDebtModule],
  controllers: [RegistroHorasController],
  providers: [RegistroHorasService],
  exports: [RegistroHorasService],
})
export class RegistroHorasModule {}
