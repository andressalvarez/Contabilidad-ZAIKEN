import { Module } from '@nestjs/common';
import { HourDebtService } from './hour-debt.service';
import { HourDebtController } from './hour-debt.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CaslModule } from '../casl/casl.module';

@Module({
  imports: [PrismaModule, CaslModule],
  controllers: [HourDebtController],
  providers: [HourDebtService],
  exports: [HourDebtService],
})
export class HourDebtModule {}
