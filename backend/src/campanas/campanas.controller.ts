import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, HttpStatus, HttpCode, Query } from '@nestjs/common';
import { CampanasService } from './campanas.service';
import { CreateCampanaDto, UpdateCampanaDto } from './dto';
import { NegocioId } from '../auth/negocio-id.decorator';

@Controller('campanas')
export class CampanasController {
  constructor(private readonly campanasService: CampanasService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @NegocioId() negocioId: number,
    @Body() createCampanaDto: CreateCampanaDto,
  ) {
    return {
      success: true,
      message: 'Campaña creada exitosamente',
      data: await this.campanasService.create(negocioId, createCampanaDto),
    };
  }

  @Get()
  async findAll(@NegocioId() negocioId: number) {
    return {
      success: true,
      message: 'Campañas obtenidas exitosamente',
      data: await this.campanasService.findAll(negocioId),
    };
  }

  @Get('stats')
  async getStats(
    @NegocioId() negocioId: number,
    @Query() filters: any,
  ) {
    return this.campanasService.getStats(negocioId, filters);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @NegocioId() negocioId: number,
  ) {
    return {
      success: true,
      message: 'Campaña obtenida exitosamente',
      data: await this.campanasService.findOne(id, negocioId),
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @NegocioId() negocioId: number,
    @Body() updateCampanaDto: UpdateCampanaDto,
  ) {
    return {
      success: true,
      message: 'Campaña actualizada exitosamente',
      data: await this.campanasService.update(id, negocioId, updateCampanaDto),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @NegocioId() negocioId: number,
  ) {
    await this.campanasService.remove(id, negocioId);
    return {
      success: true,
      message: 'Campaña eliminada exitosamente',
    };
  }
}
