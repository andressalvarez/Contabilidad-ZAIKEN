import { Module } from '@nestjs/common';
import { TiposTransaccionService } from './tipos-transaccion.service';
import { TiposTransaccionController } from './tipos-transaccion.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TiposTransaccionController],
  providers: [TiposTransaccionService],
  exports: [TiposTransaccionService]
})
export class TiposTransaccionModule {}
