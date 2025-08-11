import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { VSCategoriasService } from './vs-categorias.service';

@Controller('vs-categorias')
export class VSCategoriasController {
  constructor(private readonly vsCategoriasService: VSCategoriasService) {}

  // ===== CARPETAS =====
  @Post('carpetas')
  async createCarpeta(@Body() data: { nombre: string; color: string; visible?: boolean; orden?: number }) {
    return this.vsCategoriasService.createCarpeta(data);
  }

  @Get('carpetas')
  async findAllCarpetas() {
    return this.vsCategoriasService.findAllCarpetas();
  }

  @Get('carpetas/:id')
  async findCarpetaById(@Param('id') id: string) {
    return this.vsCategoriasService.findCarpetaById(+id);
  }

  @Put('carpetas/:id')
  async updateCarpeta(
    @Param('id') id: string,
    @Body() data: { nombre?: string; color?: string; visible?: boolean; orden?: number }
  ) {
    return this.vsCategoriasService.updateCarpeta(+id, data);
  }

  @Delete('carpetas/:id')
  async deleteCarpeta(@Param('id') id: string) {
    return this.vsCategoriasService.deleteCarpeta(+id);
  }

  // ===== GRUPOS =====
  @Post('grupos')
  async createGrupo(@Body() data: {
    nombre: string;
    color: string;
    visible?: boolean;
    orden?: number;
    carpetaId?: number;
    categorias: number[];
  }) {
    return this.vsCategoriasService.createGrupo(data);
  }

  @Get('grupos')
  async findAllGrupos() {
    return this.vsCategoriasService.findAllGrupos();
  }

  @Get('grupos/:id')
  async findGrupoById(@Param('id') id: string) {
    return this.vsCategoriasService.findGrupoById(+id);
  }

  @Put('grupos/:id')
  async updateGrupo(
    @Param('id') id: string,
    @Body() data: {
      nombre?: string;
      color?: string;
      visible?: boolean;
      orden?: number;
      carpetaId?: number;
      categorias?: number[];
    }
  ) {
    return this.vsCategoriasService.updateGrupo(+id, data);
  }

  @Delete('grupos/:id')
  async deleteGrupo(@Param('id') id: string) {
    return this.vsCategoriasService.deleteGrupo(+id);
  }

  // ===== CONFIGURACIONES =====
  @Post('configuraciones')
  async createConfiguracion(@Body() data: { nombre: string; configuracion: any }) {
    return this.vsCategoriasService.createConfiguracion(data);
  }

  @Get('configuraciones')
  async findAllConfiguraciones() {
    return this.vsCategoriasService.findAllConfiguraciones();
  }

  @Get('configuraciones/:id')
  async findConfiguracionById(@Param('id') id: string) {
    return this.vsCategoriasService.findConfiguracionById(+id);
  }

  @Get('configuraciones/nombre/:nombre')
  async findConfiguracionByNombre(@Param('nombre') nombre: string) {
    return this.vsCategoriasService.findConfiguracionByNombre(nombre);
  }

  @Put('configuraciones/:id')
  async updateConfiguracion(
    @Param('id') id: string,
    @Body() data: { nombre?: string; configuracion?: any; activo?: boolean }
  ) {
    return this.vsCategoriasService.updateConfiguracion(+id, data);
  }

  @Delete('configuraciones/:id')
  async deleteConfiguracion(@Param('id') id: string) {
    return this.vsCategoriasService.deleteConfiguracion(+id);
  }

  // ===== DATOS COMPLETOS =====
  @Get('data')
  async getVSCategoriasData() {
    return this.vsCategoriasService.getVSCategoriasData();
  }

  // ===== DATOS PARA GRÁFICOS =====
  @Get('datos-grafico')
  async getDatosParaGrafico(@Query() filtros: {
    tipo?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    groupIds?: string[] | string;
  }) {
    // Normalizar groupIds: puede venir como string o array de strings
    const raw = filtros.groupIds as any;
    const arr: string[] = Array.isArray(raw) ? raw : (raw ? [raw] : []);
    const groupIds = arr
      .map((id) => Number(id))
      .filter((n) => Number.isFinite(n) && n > 0);

    return this.vsCategoriasService.getDatosParaGrafico({
      tipo: filtros.tipo,
      fechaDesde: filtros.fechaDesde,
      fechaHasta: filtros.fechaHasta,
      groupIds: groupIds.length ? groupIds : undefined,
    });
  }
}
