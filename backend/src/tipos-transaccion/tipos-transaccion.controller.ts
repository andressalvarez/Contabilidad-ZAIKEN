import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { TiposTransaccionService } from './tipos-transaccion.service';
import { CreateTipoTransaccionDto, UpdateTipoTransaccionDto } from './dto';

@Controller('tipos-transaccion')
export class TiposTransaccionController {
  constructor(private readonly tiposTransaccionService: TiposTransaccionService) {}

  @Get()
  findAll() {
    return this.tiposTransaccionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tiposTransaccionService.findOne(id);
  }

  @Post()
  create(@Body() createTipoTransaccionDto: CreateTipoTransaccionDto) {
    return this.tiposTransaccionService.create(createTipoTransaccionDto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateTipoTransaccionDto: UpdateTipoTransaccionDto) {
    return this.tiposTransaccionService.update(id, updateTipoTransaccionDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tiposTransaccionService.remove(id);
  }
}
