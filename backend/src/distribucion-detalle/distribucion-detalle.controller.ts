import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { DistribucionDetalleService } from './distribucion-detalle.service';
import { CreateDistribucionDetalleDto } from './dto/create-distribucion-detalle.dto';
import { UpdateDistribucionDetalleDto } from './dto/update-distribucion-detalle.dto';
import { NegocioId } from '../auth/negocio-id.decorator';

@Controller('distribucion-detalle')
export class DistribucionDetalleController {
  constructor(private readonly distribucionDetalleService: DistribucionDetalleService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @NegocioId() negocioId: number,
    @Body() createDistribucionDetalleDto: CreateDistribucionDetalleDto,
  ) {
    return {
      success: true,
      message: 'Detalle de distribución creado exitosamente',
      data: await this.distribucionDetalleService.create(negocioId, createDistribucionDetalleDto),
    };
  }

  @Get()
  async findAll(
    @NegocioId() negocioId: number,
    @Query('distribucionId') distribucionId?: string,
  ) {
    return {
      success: true,
      message: 'Detalles de distribución obtenidos exitosamente',
      data: await this.distribucionDetalleService.findAll(negocioId, distribucionId ? +distribucionId : undefined),
    };
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @NegocioId() negocioId: number,
  ) {
    return {
      success: true,
      message: 'Detalle de distribución obtenido exitosamente',
      data: await this.distribucionDetalleService.findOne(id, negocioId),
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @NegocioId() negocioId: number,
    @Body() updateDistribucionDetalleDto: UpdateDistribucionDetalleDto,
  ) {
    return {
      success: true,
      message: 'Detalle de distribución actualizado exitosamente',
      data: await this.distribucionDetalleService.update(id, negocioId, updateDistribucionDetalleDto),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @NegocioId() negocioId: number,
  ) {
    const result = await this.distribucionDetalleService.remove(id, negocioId);
    return {
      success: true,
      message: result.message,
    };
  }
}
