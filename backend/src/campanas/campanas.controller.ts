import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, HttpStatus, HttpCode, Query } from '@nestjs/common';
import { CampanasService } from './campanas.service';
import { CreateCampanaDto, UpdateCampanaDto } from './dto';

@Controller('campanas')
export class CampanasController {
  constructor(private readonly campanasService: CampanasService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCampanaDto: CreateCampanaDto) {
    return {
      success: true,
      message: 'Campaña creada exitosamente',
      data: await this.campanasService.create(createCampanaDto),
    };
  }

  @Get()
  async findAll() {
    return {
      success: true,
      message: 'Campañas obtenidas exitosamente',
      data: await this.campanasService.findAll(),
    };
  }

  @Get('stats')
  async getStats(@Query() filters: any) {
    return this.campanasService.getStats(filters);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return {
      success: true,
      message: 'Campaña obtenida exitosamente',
      data: await this.campanasService.findOne(id),
    };
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateCampanaDto: UpdateCampanaDto) {
    return {
      success: true,
      message: 'Campaña actualizada exitosamente',
      data: await this.campanasService.update(id, updateCampanaDto),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.campanasService.remove(id);
    return {
      success: true,
      message: 'Campaña eliminada exitosamente',
    };
  }
}
