import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { VSCategoriasService } from './vs-categorias.service';
import { NegocioId } from '../auth/negocio-id.decorator';

@Controller('vs-categorias')
export class VSCategoriasController {
  constructor(private readonly vsCategoriasService: VSCategoriasService) {}

  // ===== CARPETAS =====
  @Post('carpetas')
  async createCarpeta(
    @NegocioId() negocioId: number,
    @Body() data: { nombre: string; color: string; visible?: boolean; orden?: number }
  ) {
    return this.vsCategoriasService.createCarpeta(negocioId, data);
  }

  @Get('carpetas')
  async findAllCarpetas(@NegocioId() negocioId: number) {
    return this.vsCategoriasService.findAllCarpetas(negocioId);
  }

  @Get('carpetas/:id')
  async findCarpetaById(@Param('id') id: string, @NegocioId() negocioId: number) {
    return this.vsCategoriasService.findCarpetaById(+id, negocioId);
  }

  @Put('carpetas/:id')
  async updateCarpeta(
    @Param('id') id: string,
    @NegocioId() negocioId: number,
    @Body() data: { nombre?: string; color?: string; visible?: boolean; orden?: number }
  ) {
    return this.vsCategoriasService.updateCarpeta(+id, negocioId, data);
  }

  @Delete('carpetas/:id')
  async deleteCarpeta(@Param('id') id: string, @NegocioId() negocioId: number) {
    return this.vsCategoriasService.deleteCarpeta(+id, negocioId);
  }

  // ===== GRUPOS =====
  @Post('grupos')
  async createGrupo(
    @NegocioId() negocioId: number,
    @Body() data: {
      nombre: string;
      color: string;
      visible?: boolean;
      orden?: number;
      carpetaId?: number;
      categorias: number[];
    }
  ) {
    return this.vsCategoriasService.createGrupo(negocioId, data);
  }

  @Get('grupos')
  async findAllGrupos(@NegocioId() negocioId: number) {
    return this.vsCategoriasService.findAllGrupos(negocioId);
  }

  @Get('grupos/:id')
  async findGrupoById(@Param('id') id: string, @NegocioId() negocioId: number) {
    return this.vsCategoriasService.findGrupoById(+id, negocioId);
  }

  @Put('grupos/:id')
  async updateGrupo(
    @Param('id') id: string,
    @NegocioId() negocioId: number,
    @Body() data: {
      nombre?: string;
      color?: string;
      visible?: boolean;
      orden?: number;
      carpetaId?: number;
      categorias?: number[];
    }
  ) {
    return this.vsCategoriasService.updateGrupo(+id, negocioId, data);
  }

  @Delete('grupos/:id')
  async deleteGrupo(@Param('id') id: string, @NegocioId() negocioId: number) {
    return this.vsCategoriasService.deleteGrupo(+id, negocioId);
  }

  // ===== CONFIGURACIONES =====
  @Post('configuraciones')
  async createConfiguracion(
    @NegocioId() negocioId: number,
    @Body() data: { nombre: string; configuracion: any }
  ) {
    return this.vsCategoriasService.createConfiguracion(negocioId, data);
  }

  @Get('configuraciones')
  async findAllConfiguraciones(@NegocioId() negocioId: number) {
    return this.vsCategoriasService.findAllConfiguraciones(negocioId);
  }

  @Get('configuraciones/:id')
  async findConfiguracionById(@Param('id') id: string, @NegocioId() negocioId: number) {
    return this.vsCategoriasService.findConfiguracionById(+id, negocioId);
  }

  @Get('configuraciones/nombre/:nombre')
  async findConfiguracionByNombre(@Param('nombre') nombre: string, @NegocioId() negocioId: number) {
    return this.vsCategoriasService.findConfiguracionByNombre(nombre, negocioId);
  }

  @Put('configuraciones/:id')
  async updateConfiguracion(
    @Param('id') id: string,
    @NegocioId() negocioId: number,
    @Body() data: { nombre?: string; configuracion?: any; activo?: boolean }
  ) {
    return this.vsCategoriasService.updateConfiguracion(+id, negocioId, data);
  }

  @Delete('configuraciones/:id')
  async deleteConfiguracion(@Param('id') id: string, @NegocioId() negocioId: number) {
    return this.vsCategoriasService.deleteConfiguracion(+id, negocioId);
  }

  // ===== DATOS COMPLETOS =====
  @Get('data')
  async getVSCategoriasData(@NegocioId() negocioId: number) {
    return this.vsCategoriasService.getVSCategoriasData(negocioId);
  }

  // ===== DATOS PARA GRÁFICOS =====
  @Get('datos-grafico')
  async getDatosParaGrafico(
    @NegocioId() negocioId: number,
    @Query() filtros: {
      tipo?: string;
      fechaDesde?: string;
      fechaHasta?: string;
      groupIds?: string[] | string;
    }
  ) {
    // Normalizar groupIds: puede venir como string o array de strings
    const raw = filtros.groupIds as any;
    const arr: string[] = Array.isArray(raw) ? raw : (raw ? [raw] : []);
    const groupIds = arr
      .map((id) => Number(id))
      .filter((n) => Number.isFinite(n) && n > 0);

    return this.vsCategoriasService.getDatosParaGrafico(negocioId, {
      tipo: filtros.tipo,
      fechaDesde: filtros.fechaDesde,
      fechaHasta: filtros.fechaHasta,
      groupIds: groupIds.length ? groupIds : undefined,
    });
  }
}
