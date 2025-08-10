import { Module } from '@nestjs/common';
import { TransaccionesController } from './transacciones.controller';
import { TransaccionesService } from './transacciones.service';
import { CategoriasService } from '../categorias/categorias.service';

@Module({
  controllers: [TransaccionesController],
  providers: [TransaccionesService, CategoriasService]
})
export class TransaccionesModule {}
