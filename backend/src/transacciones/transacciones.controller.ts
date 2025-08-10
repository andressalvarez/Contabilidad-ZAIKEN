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

@Controller('transacciones')
export class TransaccionesController {
  constructor(private readonly transaccionesService: TransaccionesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTransaccionDto: CreateTransaccionDto) {
    return {
      success: true,
      message: 'Transacción creada exitosamente',
      data: await this.transaccionesService.create(createTransaccionDto),
    };
  }

  @Get()
  async findAll(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('tipoId', new ParseIntPipe({ optional: true })) tipoId?: number,
    @Query('categoria') categoria?: string,
    @Query('personaId', new ParseIntPipe({ optional: true })) personaId?: number,
    @Query('campanaId', new ParseIntPipe({ optional: true })) campanaId?: number,
    @Query('aprobado', new ParseBoolPipe({ optional: true })) aprobado?: boolean,
  ) {
    const filtros: FiltrosTransacciones = {
      fechaInicio,
      fechaFin,
      tipoId,
      categoria,
      personaId,
      campanaId,
      aprobado,
    };

    return {
      success: true,
      message: 'Transacciones obtenidas exitosamente',
      data: await this.transaccionesService.findAll(filtros),
    };
  }

  @Get('recent')
  async findRecent(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
    return {
      success: true,
      message: 'Transacciones recientes obtenidas exitosamente',
      data: await this.transaccionesService.findRecent(limit),
    };
  }

  @Get('pending')
  async findPending() {
    return {
      success: true,
      message: 'Transacciones pendientes obtenidas exitosamente',
      data: await this.transaccionesService.findPending(),
    };
  }

  @Get('stats')
  async getStats(
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
      data: await this.transaccionesService.getStats(filtros),
    };
  }

  @Get('resumen-categorias')
  async getResumenPorCategorias(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    const filtros: FiltrosTransacciones = { fechaInicio, fechaFin };

    return {
      success: true,
      message: 'Resumen por categorías obtenido exitosamente',
      data: await this.transaccionesService.getResumenPorCategorias(filtros),
    };
  }

  @Get('tendencias-mensuales')
  async getTendenciasMensuales(@Query('año', new ParseIntPipe({ optional: true })) año?: number) {
    return {
      success: true,
      message: 'Tendencias mensuales obtenidas exitosamente',
      data: await this.transaccionesService.getTendenciasMensuales(año),
    };
  }

  @Get('resumen-tipos-gasto')
  async getResumenPorTiposGasto(
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
      data: await this.transaccionesService.getResumenPorTiposGasto(filtros),
    };
  }

  @Get('resumen-gastos-por-campana')
  async getResumenGastosPorCampana(
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
      data: await this.transaccionesService.getResumenGastosPorCampana(filtros),
    };
  }

  @Get('gastos')
  async getGastos(
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
      data: await this.transaccionesService.findAll(filtros),
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return {
      success: true,
      message: 'Transacción obtenida exitosamente',
      data: await this.transaccionesService.findOne(id),
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTransaccionDto: UpdateTransaccionDto,
  ) {
    return {
      success: true,
      message: 'Transacción actualizada exitosamente',
      data: await this.transaccionesService.update(id, updateTransaccionDto),
    };
  }

  @Patch(':id/approve')
  async approve(@Param('id', ParseIntPipe) id: number) {
    return {
      success: true,
      message: 'Transacción aprobada exitosamente',
      data: await this.transaccionesService.updateApprovalStatus(id, true),
    };
  }

  @Patch(':id/reject')
  async reject(@Param('id', ParseIntPipe) id: number) {
    return {
      success: true,
      message: 'Transacción rechazada exitosamente',
      data: await this.transaccionesService.updateApprovalStatus(id, false),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.transaccionesService.remove(id);
    return {
      success: true,
      message: result.message,
    };
  }
}
