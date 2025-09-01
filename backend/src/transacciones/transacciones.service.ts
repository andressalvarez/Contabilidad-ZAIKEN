import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransaccionDto } from './dto/create-transaccion.dto';
import { UpdateTransaccionDto } from './dto/update-transaccion.dto';
import { Prisma } from '@prisma/client';
import { CategoriasService } from '../categorias/categorias.service';

export interface FiltrosTransacciones {
  fechaInicio?: string;
  fechaFin?: string;
  tipoId?: number;
  tipo?: string;
  categoria?: string;
  categoriaId?: number;
  categoriasIds?: number[];
  personaId?: number;
  campanaId?: number;
  aprobado?: boolean;
}

export interface EstadisticasTransacciones {
  totalIngresos: number;
  totalGastos: number;
  totalAportes: number;
  balance: number;
  totalTransacciones: number;
  transaccionesAprobadas: number;
  transaccionesPendientes: number;
  promedioIngresos: number;
  promedioGastos: number;
  periodoAnalizado: {
    inicio: string;
    fin: string;
  };
}

export interface ResumenPorCategoria {
  categoria: string;
  totalIngresos: number;
  totalGastos: number;
  balance: number;
  transacciones: number;
}

@Injectable()
export class TransaccionesService {
  private parseFechaLocal(fechaRaw: string | Date): Date {
    if (fechaRaw instanceof Date) {
      return fechaRaw;
    }
    if (typeof fechaRaw !== 'string') {
      return new Date(fechaRaw as any);
    }
    // Si viene solo 'YYYY-MM-DD', fijar a medianoche local
    if (/^\d{4}-\d{2}-\d{2}$/.test(fechaRaw)) {
      return new Date(`${fechaRaw}T00:00:00`);
    }
    // Si ya viene con 'T', confiar en el valor provisto (local/ISO)
    return new Date(fechaRaw);
  }
  constructor(
    private prisma: PrismaService,
    private categoriasService: CategoriasService,
  ) {}

  // Crear transacción
  async create(createTransaccionDto: CreateTransaccionDto): Promise<any> {
    try {
      // Validar relaciones si se proporcionan
      if (createTransaccionDto.personaId) {
        await this.validatePersona(createTransaccionDto.personaId);
      }
      if (createTransaccionDto.campanaId) {
        await this.validateCampana(createTransaccionDto.campanaId);
      }
      if (createTransaccionDto.categoriaId) {
        await this.validateCategoria(createTransaccionDto.categoriaId);
      }

      const transaccion = await this.prisma.transaccion.create({
        data: {
          ...createTransaccionDto,
          // Aceptar 'YYYY-MM-DD' o 'YYYY-MM-DDTHH:mm:ss'
          fecha: this.parseFechaLocal(createTransaccionDto.fecha),
        },
        include: {
          tipo: true,
          persona: true,
          campana: true,
          categoria: true,
        },
      });

      // Actualizar totales de campaña si está asociada
      if (transaccion.campanaId) {
        await this.updateCampanaTotals(transaccion.campanaId);
      }

      return transaccion;
    } catch (error) {
      throw error;
    }
  }

  // Obtener todas las transacciones con filtros
  async findAll(filtros: FiltrosTransacciones = {}): Promise<any[]> {
    const where: Prisma.TransaccionWhereInput = {};

    // Aplicar filtros
    if (filtros.fechaInicio && filtros.fechaFin) {
      where.fecha = {
        gte: new Date(filtros.fechaInicio),
        lte: new Date(filtros.fechaFin),
      };
    } else if (filtros.fechaInicio) {
      where.fecha = { gte: new Date(filtros.fechaInicio) };
    } else if (filtros.fechaFin) {
      where.fecha = { lte: new Date(filtros.fechaFin) };
    }

    if (filtros.tipoId) {
      where.tipoId = filtros.tipoId;
    }

    if (filtros.categoriaId) {
      where.categoriaId = filtros.categoriaId;
    }

    if (filtros.categoriasIds && filtros.categoriasIds.length > 0) {
      where.categoriaId = { in: filtros.categoriasIds };
    }

    if (filtros.personaId) {
      where.personaId = filtros.personaId;
    }

    if (filtros.campanaId) {
      where.campanaId = filtros.campanaId;
    }

    if (filtros.aprobado !== undefined) {
      where.aprobado = filtros.aprobado;
    }

    return this.prisma.transaccion.findMany({
      where,
      include: {
        tipo: true,
        persona: true,
        campana: true,
        categoria: true,
      },
      orderBy: { fecha: 'desc' },
    });
  }

  // Obtener transacciones recientes
  async findRecent(limit = 10): Promise<any[]> {
    return this.prisma.transaccion.findMany({
      take: limit,
      include: {
        tipo: true,
        persona: true,
        campana: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Obtener transacciones pendientes de aprobación
  async findPending(): Promise<any[]> {
    return this.prisma.transaccion.findMany({
      where: { aprobado: false },
      include: {
        tipo: true,
        persona: true,
        campana: true,
      },
      orderBy: { fecha: 'desc' },
    });
  }

  // Obtener transacción por ID
  async findOne(id: number): Promise<any> {
    const transaccion = await this.prisma.transaccion.findUnique({
      where: { id },
      include: {
        tipo: true,
        persona: true,
        campana: true,
        categoria: true,
      },
    });

    if (!transaccion) {
      throw new NotFoundException(`Transacción con ID ${id} no encontrada`);
    }

    return transaccion;
  }

  // Actualizar transacción
  async update(id: number, updateTransaccionDto: UpdateTransaccionDto): Promise<any> {
    try {
      // Verificar que existe
      const transaccionExistente = await this.findOne(id);

      // Validar relaciones si se proporcionan
      if (updateTransaccionDto.personaId) {
        await this.validatePersona(updateTransaccionDto.personaId);
      }
      if (updateTransaccionDto.campanaId) {
        await this.validateCampana(updateTransaccionDto.campanaId);
      }
      if (updateTransaccionDto.categoriaId) {
        await this.validateCategoria(updateTransaccionDto.categoriaId);
      }

      const updateData: any = { ...updateTransaccionDto };
      if (updateTransaccionDto.fecha) {
        // Aceptar 'YYYY-MM-DD' o 'YYYY-MM-DDTHH:mm:ss'
        updateData.fecha = this.parseFechaLocal(updateTransaccionDto.fecha);
      }

      const transaccion = await this.prisma.transaccion.update({
        where: { id },
        data: updateData,
        include: {
          persona: true,
          campana: true,
          categoria: true,
        },
      });

      // Actualizar totales de campaña afectadas
      const campanasAfectadas = new Set();
      if (transaccionExistente.campanaId) campanasAfectadas.add(transaccionExistente.campanaId);
      if (transaccion.campanaId) campanasAfectadas.add(transaccion.campanaId);

      for (const campanaId of campanasAfectadas) {
        await this.updateCampanaTotals(campanaId as number);
      }

      return transaccion;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Transacción con ID ${id} no encontrada`);
      }
      throw error;
    }
  }

  // Eliminar transacción
  async remove(id: number): Promise<{ message: string }> {
    const transaccion = await this.findOne(id);

    await this.prisma.transaccion.delete({
      where: { id },
    });

    // Actualizar totales de campaña si estaba asociada
    if (transaccion.campanaId) {
      await this.updateCampanaTotals(transaccion.campanaId);
    }

    return {
      message: `Transacción "${transaccion.concepto}" eliminada exitosamente`
    };
  }

  // Aprobar/rechazar transacción
  async updateApprovalStatus(id: number, aprobado: boolean): Promise<any> {
    const transaccion = await this.update(id, { aprobado });
    return transaccion;
  }

  // Obtener estadísticas generales
  async getStats(filters: FiltrosTransacciones = {}) {
    // Asegurar que existan los tipos por defecto
    await this.ensureDefaultTipos();

    const where: any = {};

    if (filters.personaId) {
      where.personaId = parseInt(filters.personaId.toString());
    }

    if (filters.campanaId) {
      where.campanaId = parseInt(filters.campanaId.toString());
    }

    if (filters.fechaInicio || filters.fechaFin) {
      where.fecha = {};
      if (filters.fechaInicio) {
        where.fecha.gte = new Date(filters.fechaInicio);
      }
      if (filters.fechaFin) {
        where.fecha.lte = new Date(filters.fechaFin);
      }
    }

    if (filters.tipo) {
      where.tipo = {
        nombre: filters.tipo
      };
    }

    const transacciones = await this.prisma.transaccion.findMany({
      where,
      include: {
        tipo: true,
        persona: true,
        campana: true
      }
    });

    const ingresos = transacciones
      .filter(t => t.tipo?.nombre === 'INGRESO')
      .reduce((sum, t) => sum + t.monto, 0);

    const gastos = transacciones
      .filter(t => t.tipo?.nombre === 'GASTO')
      .reduce((sum, t) => sum + t.monto, 0);

    const utilidad = ingresos - gastos;

    // Estadísticas por persona
    const statsPorPersona = await this.prisma.persona.findMany({
      include: {
        transacciones: {
          where,
          include: {
            tipo: true
          }
        },
        valorHoras: {
          where: {
            ...(filters.fechaInicio || filters.fechaFin) && {
              fechaInicio: {
                ...(filters.fechaInicio && { gte: new Date(filters.fechaInicio) }),
                ...(filters.fechaFin && { lte: new Date(filters.fechaFin) })
              }
            }
          }
        }
      }
    });

    const personas = statsPorPersona.map(persona => {
      const aportes = persona.transacciones
        .filter(t => t.tipo?.nombre === 'INGRESO')
        .reduce((sum, t) => sum + t.monto, 0);

      const gastosPersona = persona.transacciones
        .filter(t => t.tipo?.nombre === 'GASTO')
        .reduce((sum, t) => sum + t.monto, 0);

      const utilidades = persona.valorHoras
        .reduce((sum, vh) => sum + vh.valor, 0);

      return {
        personaId: persona.id,
        nombre: persona.nombre,
        aportes,
        gastos: gastosPersona,
        utilidades
      };
    });

    // Estadísticas por campaña
    const statsPorCampana = await this.prisma.campana.findMany({
      include: {
        transacciones: {
          where,
          include: {
            tipo: true
          }
        }
      }
    });

    const campanas = statsPorCampana.map(campana => {
      const ingresosCampana = campana.transacciones
        .filter(t => t.tipo?.nombre === 'INGRESO')
        .reduce((sum, t) => sum + t.monto, 0);

      const gastosCampana = campana.transacciones
        .filter(t => t.tipo?.nombre === 'GASTO')
        .reduce((sum, t) => sum + t.monto, 0);

      const utilidadCampana = ingresosCampana - gastosCampana;

      return {
        campanaId: campana.id,
        nombre: campana.nombre,
        ingresos: ingresosCampana,
        gastos: gastosCampana,
        utilidad: utilidadCampana
      };
    });

    return {
      total: transacciones.length,
      ingresos,
      gastos,
      utilidad,
      personas,
      campanas
    };
  }

  // Obtener resumen por tipos de gasto
  async getResumenPorTiposGasto(filtros: FiltrosTransacciones = {}): Promise<any[]> {
    const where: Prisma.TransaccionWhereInput = {
      tipoId: 2, // Solo GASTOS
    };

    // Aplicar filtros de fecha
    if (filtros.fechaInicio && filtros.fechaFin) {
      where.fecha = {
        gte: new Date(filtros.fechaInicio),
        lte: new Date(filtros.fechaFin),
      };
    } else if (filtros.fechaInicio) {
      where.fecha = { gte: new Date(filtros.fechaInicio) };
    } else if (filtros.fechaFin) {
      where.fecha = { lte: new Date(filtros.fechaFin) };
    }

    if (filtros.tipoId) {
      where.tipoId = filtros.tipoId;
    }

    if (filtros.tipo) {
      where.tipo = {
        nombre: filtros.tipo
      };
    }

    if (filtros.categoriaId) {
      where.categoriaId = filtros.categoriaId;
    }

    if (filtros.personaId) {
      where.personaId = filtros.personaId;
    }

    if (filtros.campanaId) {
      where.campanaId = filtros.campanaId;
    }

    if (filtros.aprobado !== undefined) {
      where.aprobado = filtros.aprobado;
    }

    const transacciones = await this.prisma.transaccion.findMany({
      where,
      select: {
        categoriaId: true,
        monto: true,
        categoria: { select: { nombre: true } },
      },
    });

    const resumen = new Map<number, { tipoGasto: string; totalGastos: number; transacciones: number }>();

    transacciones.forEach((t) => {
      const categoriaId = t.categoriaId ?? 0;
      const tipoGasto = t.categoria?.nombre || 'Sin tipo de gasto';

      if (!resumen.has(categoriaId)) {
        resumen.set(categoriaId, {
          tipoGasto,
          totalGastos: 0,
          transacciones: 0,
        });
      }

      const item = resumen.get(categoriaId)!;
      item.transacciones++;
      item.totalGastos += t.monto;
    });

    // Ordenar por total de gastos y tomar top 10
    return Array.from(resumen.values())
      .sort((a, b) => b.totalGastos - a.totalGastos)
      .slice(0, 10);
  }

  // Obtener resumen de gastos por campaña
  async getResumenGastosPorCampana(filtros: FiltrosTransacciones = {}): Promise<any[]> {
    const where: Prisma.TransaccionWhereInput = {
      tipoId: 2, // Solo GASTOS
    };

    // Aplicar filtros de fecha
    if (filtros.fechaInicio && filtros.fechaFin) {
      where.fecha = {
        gte: new Date(filtros.fechaInicio),
        lte: new Date(filtros.fechaFin),
      };
    } else if (filtros.fechaInicio) {
      where.fecha = { gte: new Date(filtros.fechaInicio) };
    } else if (filtros.fechaFin) {
      where.fecha = { lte: new Date(filtros.fechaFin) };
    }

    if (filtros.tipoId) {
      where.tipoId = filtros.tipoId;
    }

    if (filtros.tipo) {
      where.tipo = {
        nombre: filtros.tipo
      };
    }

    if (filtros.categoriaId) {
      where.categoriaId = filtros.categoriaId;
    }

    if (filtros.personaId) {
      where.personaId = filtros.personaId;
    }

    if (filtros.campanaId) {
      where.campanaId = filtros.campanaId;
    }

    if (filtros.aprobado !== undefined) {
      where.aprobado = filtros.aprobado;
    }

    const transacciones = await this.prisma.transaccion.findMany({
      where,
      select: {
        campanaId: true,
        monto: true,
        campana: { select: { nombre: true } },
      },
    });

    const resumen = new Map<number, { campana: string; totalGastos: number; transacciones: number }>();

    transacciones.forEach((t) => {
      const campanaId = t.campanaId ?? 0;
      const campana = t.campana?.nombre || 'Sin campaña';

      if (!resumen.has(campanaId)) {
        resumen.set(campanaId, {
          campana,
          totalGastos: 0,
          transacciones: 0,
        });
      }

      const item = resumen.get(campanaId)!;
      item.transacciones++;
      item.totalGastos += t.monto;
    });

    // Ordenar por total de gastos y tomar top 10
    return Array.from(resumen.values())
      .sort((a, b) => b.totalGastos - a.totalGastos)
      .slice(0, 10);
  }

  // Obtener resumen por categorías
  async getResumenPorCategorias(filtros: FiltrosTransacciones = {}): Promise<ResumenPorCategoria[]> {
    // 1. Traer todas las categorías activas
    const categorias = await this.categoriasService.findAll();

    // 2. Traer todas las transacciones filtradas
    const where: Prisma.TransaccionWhereInput = {};
    if (filtros.fechaInicio && filtros.fechaFin) {
      where.fecha = {
        gte: new Date(filtros.fechaInicio),
        lte: new Date(filtros.fechaFin),
      };
    } else if (filtros.fechaInicio) {
      where.fecha = { gte: new Date(filtros.fechaInicio) };
    } else if (filtros.fechaFin) {
      where.fecha = { lte: new Date(filtros.fechaFin) };
    }
    if (filtros.tipoId) {
      where.tipoId = filtros.tipoId;
    }
    if (filtros.tipo) {
      where.tipo = { nombre: filtros.tipo };
    }
    if (filtros.categoriaId) {
      where.categoriaId = filtros.categoriaId;
    }
    if (filtros.personaId) {
      where.personaId = filtros.personaId;
    }
    if (filtros.campanaId) {
      where.campanaId = filtros.campanaId;
    }
    if (filtros.aprobado !== undefined) {
      where.aprobado = filtros.aprobado;
    }

    const transacciones = await this.prisma.transaccion.findMany({
      where,
      select: {
        categoriaId: true,
        tipoId: true,
        monto: true,
      },
    });

    // 3. Agrupar transacciones por categoriaId
    const resumenTransacciones = new Map<number, ResumenPorCategoria>();
    transacciones.forEach((t) => {
      const categoriaId = t.categoriaId ?? 0; // 0 para 'Sin categoría'
      if (!resumenTransacciones.has(categoriaId)) {
        resumenTransacciones.set(categoriaId, {
          categoria: categoriaId.toString(), // Se reemplazará por nombre luego
          totalIngresos: 0,
          totalGastos: 0,
          balance: 0,
          transacciones: 0,
        });
      }
      const item = resumenTransacciones.get(categoriaId)!;
      item.transacciones++;
      if (t.tipoId === 3) { // INGRESO
        item.totalIngresos += t.monto;
      } else if (t.tipoId === 1) { // GASTO
        item.totalGastos += t.monto;
      }
      item.balance = item.totalIngresos - item.totalGastos;
    });

    // 4. Unir todas las categorías activas con el resumen de transacciones
    const resumenFinal: ResumenPorCategoria[] = categorias.map((cat: any) => {
      const datos = resumenTransacciones.get(cat.id);
      return {
        categoria: cat.nombre,
        totalIngresos: datos?.totalIngresos || 0,
        totalGastos: datos?.totalGastos || 0,
        balance: datos?.balance || 0,
        transacciones: datos?.transacciones || 0,
      };
    });

    // 5. Agregar grupo especial para transacciones sin categoría (categoriaId null)
    if (resumenTransacciones.has(0)) {
      const datosCategoriaSin = resumenTransacciones.get(0)!;
      resumenFinal.push({
        categoria: 'Sin categoría',
        totalIngresos: datosCategoriaSin.totalIngresos,
        totalGastos: datosCategoriaSin.totalGastos,
        balance: datosCategoriaSin.balance,
        transacciones: datosCategoriaSin.transacciones,
      });
    }

    // 6. Ordenar por totalGastos descendente y devolver top 10
    return resumenFinal.sort((a, b) => b.totalGastos - a.totalGastos).slice(0, 10);
  }

  // Obtener tendencias mensuales
  async getTendenciasMensuales(año?: number, filtros: FiltrosTransacciones = {}): Promise<any[]> {
    const where: Prisma.TransaccionWhereInput = {};

    // Aplicar filtro de año
    if (año) {
      where.fecha = {
        gte: new Date(año, 0, 1),
        lte: new Date(año, 11, 31),
      };
    }

    // Aplicar filtros adicionales
    if (filtros.fechaInicio && filtros.fechaFin) {
      where.fecha = {
        gte: new Date(filtros.fechaInicio),
        lte: new Date(filtros.fechaFin),
      };
    } else if (filtros.fechaInicio) {
      where.fecha = { gte: new Date(filtros.fechaInicio) };
    } else if (filtros.fechaFin) {
      where.fecha = { lte: new Date(filtros.fechaFin) };
    }

    if (filtros.tipoId) {
      where.tipoId = filtros.tipoId;
    }

    if (filtros.tipo) {
      where.tipo = {
        nombre: filtros.tipo
      };
    }

    if (filtros.categoria) {
      where.categoria = {
        nombre: filtros.categoria
      };
    }

    if (filtros.personaId) {
      where.personaId = filtros.personaId;
    }

    if (filtros.campanaId) {
      where.campanaId = filtros.campanaId;
    }

    if (filtros.aprobado !== undefined) {
      where.aprobado = filtros.aprobado;
    }

    const transacciones = await this.prisma.transaccion.findMany({
      where,
      select: {
        fecha: true,
        tipoId: true,
        monto: true,
      },
    });

    const meses = Array.from({ length: 12 }, (_, i) => ({
      mes: i + 1,
      nombre: new Date(2000, i).toLocaleDateString('es-CO', { month: 'long' }),
      ingresos: 0,
      gastos: 0,
      aportes: 0,
      balance: 0,
      transacciones: 0,
    }));

    transacciones.forEach((t) => {
      const mes = t.fecha.getMonth();
      const item = meses[mes];

      item.transacciones++;

      if (t.tipoId === 1) { // INGRESO
        item.ingresos += t.monto;
      } else if (t.tipoId === 2) { // GASTO
        item.gastos += t.monto;
      } else if (t.tipoId === 3) { // APORTE
        item.aportes += t.monto;
      }

      item.balance = item.ingresos - item.gastos;
    });

    return meses;
  }

  async ensureDefaultTipos() {
    const tiposExistentes = await this.prisma.tipoTransaccion.findMany();

    if (tiposExistentes.length === 0) {
      console.log('🔧 Creando tipos de transacción por defecto...');

      await Promise.all([
        this.prisma.tipoTransaccion.create({
          data: {
            nombre: 'INGRESO',
            descripcion: 'Ingresos del negocio',
            activo: true
          }
        }),
        this.prisma.tipoTransaccion.create({
          data: {
            nombre: 'GASTO',
            descripcion: 'Gastos del negocio',
            activo: true
          }
        }),
        this.prisma.tipoTransaccion.create({
          data: {
            nombre: 'APORTE',
            descripcion: 'Aportes de socios',
            activo: true
          }
        })
      ]);

      console.log('✅ Tipos de transacción creados');
    }
  }

  // Validaciones privadas
  private async validateCategoria(categoriaId: number): Promise<void> {
    const categoria = await this.prisma.categoria.findUnique({
      where: { id: categoriaId },
    });
    if (!categoria) {
      throw new NotFoundException(`Categoría con ID ${categoriaId} no encontrada`);
    }
  }

  private async validatePersona(personaId: number): Promise<void> {
    const persona = await this.prisma.persona.findUnique({
      where: { id: personaId },
    });
    if (!persona) {
      throw new NotFoundException(`Persona con ID ${personaId} no encontrada`);
    }
  }

  private async validateCampana(campanaId: number): Promise<void> {
    const campana = await this.prisma.campana.findUnique({
      where: { id: campanaId },
    });
    if (!campana) {
      throw new NotFoundException(`Campaña con ID ${campanaId} no encontrada`);
    }
  }

  // Actualizar totales de campaña
  private async updateCampanaTotals(campanaId: number): Promise<void> {
    const [ingresos, gastos] = await Promise.all([
      this.prisma.transaccion.aggregate({
        where: { campanaId, tipoId: 1 }, // Assuming 1 is INGRESO
        _sum: { monto: true },
      }),
      this.prisma.transaccion.aggregate({
        where: { campanaId, tipoId: 2 }, // Assuming 2 is GASTO
        _sum: { monto: true },
      }),
    ]);

    const ingresoTotal = ingresos._sum.monto || 0;
    const gastoTotal = gastos._sum.monto || 0;
    const utilidad = ingresoTotal - gastoTotal;

    await this.prisma.campana.update({
      where: { id: campanaId },
      data: {
        ingresoTotal,
        gastoTotal,
        utilidad,
      },
    });
  }
}
