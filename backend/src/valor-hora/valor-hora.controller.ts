import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, HttpStatus, HttpCode } from '@nestjs/common';
import { ValorHoraService } from './valor-hora.service';
import { CreateValorHoraDto, UpdateValorHoraDto } from './dto';
import { NegocioId } from '../auth/negocio-id.decorator';

@Controller('valor-hora')
export class ValorHoraController {
  constructor(private readonly valorHoraService: ValorHoraService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @NegocioId() negocioId: number,
    @Body() createValorHoraDto: CreateValorHoraDto,
  ) {
    return {
      success: true,
      message: 'Valor por hora creado exitosamente',
      data: await this.valorHoraService.create(negocioId, createValorHoraDto),
    };
  }

  @Get()
  async findAll(@NegocioId() negocioId: number) {
    return {
      success: true,
      message: 'Valores por hora obtenidos exitosamente',
      data: await this.valorHoraService.findAll(negocioId),
    };
  }

  @Get('stats')
  async getStats(@NegocioId() negocioId: number) {
    return {
      success: true,
      message: 'Estadísticas de valores por hora obtenidas exitosamente',
      data: await this.valorHoraService.getStats(negocioId),
    };
  }

  @Get('persona/:personaId')
  async findByPersonaId(
    @Param('personaId', ParseIntPipe) personaId: number,
    @NegocioId() negocioId: number,
  ) {
    return {
      success: true,
      message: 'Valores por hora de la persona obtenidos exitosamente',
      data: await this.valorHoraService.findByPersonaId(personaId, negocioId),
    };
  }

  // ✅ Nuevo endpoint para buscar por usuarioId
  @Get('usuario/:usuarioId')
  async findByUsuarioId(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @NegocioId() negocioId: number,
  ) {
    return {
      success: true,
      message: 'Valores por hora del usuario obtenidos exitosamente',
      data: await this.valorHoraService.findByUsuarioId(usuarioId, negocioId),
    };
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @NegocioId() negocioId: number,
  ) {
    return {
      success: true,
      message: 'Valor por hora obtenido exitosamente',
      data: await this.valorHoraService.findOne(id, negocioId),
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @NegocioId() negocioId: number,
    @Body() updateValorHoraDto: UpdateValorHoraDto,
  ) {
    return {
      success: true,
      message: 'Valor por hora actualizado exitosamente',
      data: await this.valorHoraService.update(id, negocioId, updateValorHoraDto),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @NegocioId() negocioId: number,
  ) {
    await this.valorHoraService.remove(id, negocioId);
    return {
      success: true,
      message: 'Valor por hora eliminado exitosamente',
    };
  }
}






