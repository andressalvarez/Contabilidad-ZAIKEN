import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, HttpStatus, HttpCode } from '@nestjs/common';
import { ValorHoraService } from './valor-hora.service';
import { CreateValorHoraDto, UpdateValorHoraDto } from './dto';

@Controller('valor-hora')
export class ValorHoraController {
  constructor(private readonly valorHoraService: ValorHoraService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createValorHoraDto: CreateValorHoraDto) {
    return {
      success: true,
      message: 'Valor por hora creado exitosamente',
      data: await this.valorHoraService.create(createValorHoraDto),
    };
  }

  @Get()
  async findAll() {
    return {
      success: true,
      message: 'Valores por hora obtenidos exitosamente',
      data: await this.valorHoraService.findAll(),
    };
  }

  @Get('stats')
  async getStats() {
    return {
      success: true,
      message: 'Estadísticas de valores por hora obtenidas exitosamente',
      data: await this.valorHoraService.getStats(),
    };
  }

  @Get('persona/:personaId')
  async findByPersonaId(@Param('personaId', ParseIntPipe) personaId: number) {
    return {
      success: true,
      message: 'Valores por hora de la persona obtenidos exitosamente',
      data: await this.valorHoraService.findByPersonaId(personaId),
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return {
      success: true,
      message: 'Valor por hora obtenido exitosamente',
      data: await this.valorHoraService.findOne(id),
    };
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateValorHoraDto: UpdateValorHoraDto) {
    return {
      success: true,
      message: 'Valor por hora actualizado exitosamente',
      data: await this.valorHoraService.update(id, updateValorHoraDto),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.valorHoraService.remove(id);
    return {
      success: true,
      message: 'Valor por hora eliminado exitosamente',
    };
  }
}






