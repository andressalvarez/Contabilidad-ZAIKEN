import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { TransaccionesService, FiltrosTransacciones } from './transacciones.service';
import { CreateTransaccionDto, UpdateTransaccionDto } from './dto';
import { NegocioId } from '../auth/negocio-id.decorator';

@Controller('transacciones')
export class TransaccionesController {
  constructor(private readonly transaccionesService: TransaccionesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @NegocioId() negocioId: number,
    @Body() createTransaccionDto: CreateTransaccionDto
  ) {
    return {
      success: true,
      message: 'Transacción creada exitosamente',
      data: await this.transaccionesService.create(negocioId, createTransaccionDto),
    };
  }

  @Get()
  async findAll(
    @NegocioId() negocioId: number,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('tipoId', new ParseIntPipe({ optional: true })) tipoId?: number,
    @Query('categoria') categoria?: string,
    @Query('categoriaId', new ParseIntPipe({ optional: true })) categoriaId?: number,
    @Query('categoriasIds') categoriasIds?: string,
    @Query('personaId', new ParseIntPipe({ optional: true })) personaId?: number,
    @Query('campanaId', new ParseIntPipe({ optional: true })) campanaId?: number,
    @Query('aprobado', new ParseBoolPipe({ optional: true })) aprobado?: boolean,
    @Query('ignorarTipo', new ParseBoolPipe({ optional: true })) ignorarTipo?: boolean,
  ) {
    const filtros: FiltrosTransacciones = {
      fechaInicio,
      fechaFin,
      tipoId: ignorarTipo ? undefined : tipoId, // Ignorar tipo si se especifica
      categoria,
      categoriaId,
      categoriasIds: categoriasIds ? categoriasIds.split(',').map(id => +id) : undefined,
      personaId,
      campanaId,
      aprobado,
    };

    return {
      success: true,
      message: 'Transacciones obtenidas exitosamente',
      data: await this.transaccionesService.findAll(negocioId, filtros),
    };
  }

  @Get('recent')
  async findRecent(
    @NegocioId() negocioId: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number
  ) {
    return {
      success: true,
      message: 'Transacciones recientes obtenidas exitosamente',
      data: await this.transaccionesService.findRecent(negocioId, limit),
    };
  }

  @Get('por-categoria')
  async findByCategoria(
    @NegocioId() negocioId: number,
    @Query('categoriasIds') categoriasIds: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('personaId', new ParseIntPipe({ optional: true })) personaId?: number,
    @Query('campanaId', new ParseIntPipe({ optional: true })) campanaId?: number,
    @Query('aprobado', new ParseBoolPipe({ optional: true })) aprobado?: boolean,
  ) {
    const filtros: FiltrosTransacciones = {
      fechaInicio,
      fechaFin,
      categoriasIds: categoriasIds.split(',').map(id => +id),
      personaId,
      campanaId,
      aprobado,
      // No se especifica tipoId para buscar todos los tipos
    };

    return {
      success: true,
      message: 'Transacciones por categoría obtenidas exitosamente',
      data: await this.transaccionesService.findAll(negocioId, filtros),
    };
  }

  @Get('pending')
  async findPending(@NegocioId() negocioId: number) {
    return {
      success: true,
      message: 'Transacciones pendientes obtenidas exitosamente',
      data: await this.transaccionesService.findPending(negocioId),
    };
  }

  @Get('stats')
  async getStats(
    @NegocioId() negocioId: number,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('categoria') categoria?: string,
    @Query('personaId', new ParseIntPipe({ optional: true })) personaId?: number,
    @Query('campanaId', new ParseIntPipe({ optional: true })) campanaId?: number,
  ) {
    const filtros: FiltrosTransacciones = {
      fechaInicio,
      fechaFin,
      categoria,
      personaId,
      campanaId,
    };

    return {
      success: true,
      message: 'Estadísticas obtenidas exitosamente',
      data: await this.transaccionesService.getStats(negocioId, filtros),
    };
  }

  @Get('resumen-categorias')
  async getResumenPorCategorias(
    @NegocioId() negocioId: number,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    const filtros: FiltrosTransacciones = { fechaInicio, fechaFin };

    return {
      success: true,
      message: 'Resumen por categorías obtenido exitosamente',
      data: await this.transaccionesService.getResumenPorCategorias(negocioId, filtros),
    };
  }

  @Get('tendencias-mensuales')
  async getTendenciasMensuales(
    @NegocioId() negocioId: number,
    @Query('año', new ParseIntPipe({ optional: true })) año?: number
  ) {
    return {
      success: true,
      message: 'Tendencias mensuales obtenidas exitosamente',
      data: await this.transaccionesService.getTendenciasMensuales(negocioId, año),
    };
  }

  @Get('resumen-tipos-gasto')
  async getResumenPorTiposGasto(
    @NegocioId() negocioId: number,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('categoria') categoria?: string,
    @Query('personaId', new ParseIntPipe({ optional: true })) personaId?: number,
    @Query('campanaId', new ParseIntPipe({ optional: true })) campanaId?: number,
  ) {
    const filtros: FiltrosTransacciones = {
      fechaInicio,
      fechaFin,
      categoria,
      personaId,
      campanaId,
    };

    return {
      success: true,
      message: 'Resumen por tipos de gasto obtenido exitosamente',
      data: await this.transaccionesService.getResumenPorTiposGasto(negocioId, filtros),
    };
  }

  @Get('resumen-gastos-por-campana')
  async getResumenGastosPorCampana(
    @NegocioId() negocioId: number,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('personaId', new ParseIntPipe({ optional: true })) personaId?: number,
    @Query('campanaId', new ParseIntPipe({ optional: true })) campanaId?: number,
  ) {
    const filtros: FiltrosTransacciones = {
      fechaInicio,
      fechaFin,
      personaId,
      campanaId,
    };

    return {
      success: true,
      message: 'Resumen de gastos por campaña obtenido exitosamente',
      data: await this.transaccionesService.getResumenGastosPorCampana(negocioId, filtros),
    };
  }

  @Get('gastos')
  async getGastos(
    @NegocioId() negocioId: number,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('categoria') categoria?: string,
    @Query('personaId', new ParseIntPipe({ optional: true })) personaId?: number,
    @Query('campanaId', new ParseIntPipe({ optional: true })) campanaId?: number,
    @Query('aprobado', new ParseBoolPipe({ optional: true })) aprobado?: boolean,
  ) {
    const filtros: FiltrosTransacciones = {
      fechaInicio,
      fechaFin,
      categoria,
      personaId,
      campanaId,
      aprobado,
      tipoId: 1, // Solo GASTOS (corregido de 2 a 1)
    };

    return {
      success: true,
      message: 'Gastos obtenidos exitosamente',
      data: await this.transaccionesService.findAll(negocioId, filtros),
    };
  }

  @Get(':id')
  async findOne(
    @NegocioId() negocioId: number,
    @Param('id', ParseIntPipe) id: number
  ) {
    return {
      success: true,
      message: 'Transacción obtenida exitosamente',
      data: await this.transaccionesService.findOne(id, negocioId),
    };
  }

  @Patch(':id')
  async update(
    @NegocioId() negocioId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTransaccionDto: UpdateTransaccionDto,
  ) {
    return {
      success: true,
      message: 'Transacción actualizada exitosamente',
      data: await this.transaccionesService.update(id, negocioId, updateTransaccionDto),
    };
  }

  @Patch(':id/approve')
  async approve(
    @NegocioId() negocioId: number,
    @Param('id', ParseIntPipe) id: number
  ) {
    return {
      success: true,
      message: 'Transacción aprobada exitosamente',
      data: await this.transaccionesService.updateApprovalStatus(id, negocioId, true),
    };
  }

  @Patch(':id/reject')
  async reject(
    @NegocioId() negocioId: number,
    @Param('id', ParseIntPipe) id: number
  ) {
    return {
      success: true,
      message: 'Transacción rechazada exitosamente',
      data: await this.transaccionesService.updateApprovalStatus(id, negocioId, false),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @NegocioId() negocioId: number,
    @Param('id', ParseIntPipe) id: number
  ) {
    const result = await this.transaccionesService.remove(id, negocioId);
    return {
      success: true,
      message: result.message,
    };
  }
}
