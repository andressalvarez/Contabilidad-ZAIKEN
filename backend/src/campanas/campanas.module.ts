import { Module } from '@nestjs/common';
import { CampanasService } from './campanas.service';
import { CampanasController } from './campanas.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CampanasController],
  providers: [CampanasService],
  exports: [CampanasService],
})
export class CampanasModule {}
