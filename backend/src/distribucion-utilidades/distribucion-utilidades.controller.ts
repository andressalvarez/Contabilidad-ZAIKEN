import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { DistribucionUtilidadesService } from './distribucion-utilidades.service';
import { CreateDistribucionUtilidadesDto } from './dto/create-distribucion-utilidades.dto';
import { UpdateDistribucionUtilidadesDto } from './dto/update-distribucion-utilidades.dto';
import { NegocioId } from '../auth/negocio-id.decorator';

@Controller('distribucion-utilidades')
export class DistribucionUtilidadesController {
  constructor(private readonly distribucionUtilidadesService: DistribucionUtilidadesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @NegocioId() negocioId: number,
    @Body() createDistribucionUtilidadesDto: CreateDistribucionUtilidadesDto,
  ) {
    return {
      success: true,
      message: 'Distribución de utilidades creada exitosamente',
      data: await this.distribucionUtilidadesService.create(negocioId, createDistribucionUtilidadesDto),
    };
  }

  @Get()
  async findAll(@NegocioId() negocioId: number) {
    return {
      success: true,
      message: 'Distribuciones de utilidades obtenidas exitosamente',
      data: await this.distribucionUtilidadesService.findAll(negocioId),
    };
  }

  @Get('stats')
  async getStats(@NegocioId() negocioId: number) {
    return {
      success: true,
      message: 'Estadísticas obtenidas exitosamente',
      data: await this.distribucionUtilidadesService.getStats(negocioId),
    };
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @NegocioId() negocioId: number,
  ) {
    return {
      success: true,
      message: 'Distribución de utilidades obtenida exitosamente',
      data: await this.distribucionUtilidadesService.findOne(id, negocioId),
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @NegocioId() negocioId: number,
    @Body() updateDistribucionUtilidadesDto: UpdateDistribucionUtilidadesDto,
  ) {
    return {
      success: true,
      message: 'Distribución de utilidades actualizada exitosamente',
      data: await this.distribucionUtilidadesService.update(id, negocioId, updateDistribucionUtilidadesDto),
    };
  }

  @Post(':id/distribuir-automatico')
  async distribuirAutomaticamente(
    @Param('id', ParseIntPipe) id: number,
    @NegocioId() negocioId: number,
  ) {
    const result = await this.distribucionUtilidadesService.distribuirAutomaticamente(id, negocioId);
    return {
      success: true,
      message: result.message,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @NegocioId() negocioId: number,
  ) {
    const result = await this.distribucionUtilidadesService.remove(id, negocioId);
    return {
      success: true,
      message: result.message,
    };
  }
}
