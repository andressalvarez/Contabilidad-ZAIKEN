import { Module } from '@nestjs/common';
import { VSCategoriasController } from './vs-categorias.controller';
import { VSCategoriasService } from './vs-categorias.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VSCategoriasController],
  providers: [VSCategoriasService],
  exports: [VSCategoriasService],
})
export class VSCategoriasModule {}
