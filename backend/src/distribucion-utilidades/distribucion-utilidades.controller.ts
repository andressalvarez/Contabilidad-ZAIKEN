import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { DistribucionUtilidadesService } from './distribucion-utilidades.service';
import { CreateDistribucionUtilidadesDto } from './dto/create-distribucion-utilidades.dto';
import { UpdateDistribucionUtilidadesDto } from './dto/update-distribucion-utilidades.dto';

@Controller('distribucion-utilidades')
export class DistribucionUtilidadesController {
  constructor(private readonly distribucionUtilidadesService: DistribucionUtilidadesService) {}

  @Post()
  create(@Body() createDistribucionUtilidadesDto: CreateDistribucionUtilidadesDto) {
    return this.distribucionUtilidadesService.create(createDistribucionUtilidadesDto);
  }

  @Get()
  findAll() {
    return this.distribucionUtilidadesService.findAll();
  }

  @Get('stats')
  getStats() {
    return this.distribucionUtilidadesService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.distribucionUtilidadesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDistribucionUtilidadesDto: UpdateDistribucionUtilidadesDto) {
    return this.distribucionUtilidadesService.update(+id, updateDistribucionUtilidadesDto);
  }

  @Post(':id/distribuir-automatico')
  distribuirAutomaticamente(@Param('id') id: string) {
    return this.distribucionUtilidadesService.distribuirAutomaticamente(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.distribucionUtilidadesService.remove(+id);
  }
}
