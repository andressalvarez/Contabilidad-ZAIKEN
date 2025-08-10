import { Module } from '@nestjs/common';
import { RegistroHorasService } from './registro-horas.service';
import { RegistroHorasController } from './registro-horas.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RegistroHorasController],
  providers: [RegistroHorasService],
  exports: [RegistroHorasService],
})
export class RegistroHorasModule {}
