import { Module } from '@nestjs/common';
import { HourDebtService } from './hour-debt.service';
import { HourDebtController } from './hour-debt.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HourDebtController],
  providers: [HourDebtService],
  exports: [HourDebtService],
})
export class HourDebtModule {}
