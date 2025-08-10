import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { DistribucionDetalleService } from './distribucion-detalle.service';
import { CreateDistribucionDetalleDto } from './dto/create-distribucion-detalle.dto';
import { UpdateDistribucionDetalleDto } from './dto/update-distribucion-detalle.dto';

@Controller('distribucion-detalle')
export class DistribucionDetalleController {
  constructor(private readonly distribucionDetalleService: DistribucionDetalleService) {}

  @Post()
  create(@Body() createDistribucionDetalleDto: CreateDistribucionDetalleDto) {
    return this.distribucionDetalleService.create(createDistribucionDetalleDto);
  }

  @Get()
  findAll(@Query('distribucionId') distribucionId?: string) {
    return this.distribucionDetalleService.findAll(distribucionId ? +distribucionId : undefined);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.distribucionDetalleService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDistribucionDetalleDto: UpdateDistribucionDetalleDto) {
    return this.distribucionDetalleService.update(+id, updateDistribucionDetalleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.distribucionDetalleService.remove(+id);
  }
}
