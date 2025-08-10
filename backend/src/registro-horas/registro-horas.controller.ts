import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, HttpStatus, HttpCode } from '@nestjs/common';
import { RegistroHorasService } from './registro-horas.service';
import { CreateRegistroHorasDto, UpdateRegistroHorasDto } from './dto';

@Controller('registro-horas')
export class RegistroHorasController {
  constructor(private readonly registroHorasService: RegistroHorasService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createRegistroHorasDto: CreateRegistroHorasDto) {
    return {
      success: true,
      message: 'Registro de horas creado exitosamente',
      data: await this.registroHorasService.create(createRegistroHorasDto),
    };
  }

  @Get()
  async findAll() {
    return {
      success: true,
      message: 'Registros de horas obtenidos exitosamente',
      data: await this.registroHorasService.findAll(),
    };
  }

  @Get('stats')
  async getStats() {
    return {
      success: true,
      message: 'Estadísticas de registros de horas obtenidas exitosamente',
      data: await this.registroHorasService.getStats(),
    };
  }

  @Get('persona/:personaId')
  async findByPersonaId(@Param('personaId', ParseIntPipe) personaId: number) {
    return {
      success: true,
      message: 'Registros de horas de la persona obtenidos exitosamente',
      data: await this.registroHorasService.findByPersonaId(personaId),
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return {
      success: true,
      message: 'Registro de horas obtenido exitosamente',
      data: await this.registroHorasService.findOne(id),
    };
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateRegistroHorasDto: UpdateRegistroHorasDto) {
    return {
      success: true,
      message: 'Registro de horas actualizado exitosamente',
      data: await this.registroHorasService.update(id, updateRegistroHorasDto),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.registroHorasService.remove(id);
    return {
      success: true,
      message: 'Registro de horas eliminado exitosamente',
    };
  }
}
