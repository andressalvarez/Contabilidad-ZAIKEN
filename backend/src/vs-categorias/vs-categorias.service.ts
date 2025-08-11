import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VSCategoriasService {
  constructor(private prisma: PrismaService) {}

  // ===== CARPETAS =====
  async createCarpeta(data: { nombre: string; color: string; visible?: boolean; orden?: number }) {
    return this.prisma.vSCarpeta.create({
      data: {
        nombre: data.nombre,
        color: data.color,
        visible: data.visible ?? true,
        orden: data.orden ?? 0,
      },
    });
  }

  async findAllCarpetas() {
    return this.prisma.vSCarpeta.findMany({
      include: {
        grupos: {
          include: {
            categorias: {
              include: {
                categoria: true,
              },
            },
          },
        },
      },
      orderBy: { orden: 'asc' },
    });
  }

  async findCarpetaById(id: number) {
    return this.prisma.vSCarpeta.findUnique({
      where: { id },
      include: {
        grupos: {
          include: {
            categorias: {
              include: {
                categoria: true,
              },
            },
          },
        },
      },
    });
  }

  async updateCarpeta(id: number, data: { nombre?: string; color?: string; visible?: boolean; orden?: number }) {
    return this.prisma.vSCarpeta.update({
      where: { id },
      data,
    });
  }

  async deleteCarpeta(id: number) {
    // Primero actualizar grupos para quitar la referencia a la carpeta
    await this.prisma.vSGrupo.updateMany({
      where: { carpetaId: id },
      data: { carpetaId: null },
    });

    return this.prisma.vSCarpeta.delete({
      where: { id },
    });
  }

  // ===== GRUPOS =====
  async createGrupo(data: {
    nombre: string;
    color: string;
    visible?: boolean;
    orden?: number;
    carpetaId?: number;
    categorias: number[];
  }) {
    const { categorias, ...grupoData } = data;

    const grupo = await this.prisma.vSGrupo.create({
      data: {
        ...grupoData,
        visible: grupoData.visible ?? true,
        orden: grupoData.orden ?? 0,
        categorias: {
          create: categorias.map(categoriaId => ({
            categoriaId,
          })),
        },
      },
      include: {
        categorias: {
          include: {
            categoria: true,
          },
        },
        carpeta: true,
      },
    });

    // Transformar la respuesta para incluir categoriaIds
    return {
      ...grupo,
      categoriaIds: grupo.categorias.map(c => c.categoriaId),
      categoriaNames: grupo.categorias.map(c => c.categoria.nombre),
    };
  }

  async findAllGrupos() {
    const grupos = await this.prisma.vSGrupo.findMany({
      include: {
        categorias: {
          include: {
            categoria: true,
          },
        },
        carpeta: true,
      },
      orderBy: { orden: 'asc' },
    });

    // Transformar la respuesta para incluir categoriaIds
    return grupos.map(grupo => ({
      ...grupo,
      categoriaIds: grupo.categorias.map(c => c.categoriaId),
      categoriaNames: grupo.categorias.map(c => c.categoria.nombre),
    }));
  }

  async findGrupoById(id: number) {
    const grupo = await this.prisma.vSGrupo.findUnique({
      where: { id },
      include: {
        categorias: {
          include: {
            categoria: true,
          },
        },
        carpeta: true,
      },
    });

    if (!grupo) return null;

    // Transformar la respuesta para incluir categoriaIds
    return {
      ...grupo,
      categoriaIds: grupo.categorias.map(c => c.categoriaId),
      categoriaNames: grupo.categorias.map(c => c.categoria.nombre),
    };
  }

  async updateGrupo(id: number, data: {
    nombre?: string;
    color?: string;
    visible?: boolean;
    orden?: number;
    carpetaId?: number;
    categorias?: number[];
  }) {
    const { categorias, ...grupoData } = data;

    // Si se proporcionan categorías, actualizar la relación
    if (categorias !== undefined) {
      // Eliminar categorías existentes
      await this.prisma.vSGrupoCategoria.deleteMany({
        where: { grupoId: id },
      });

      // Crear nuevas categorías
      if (categorias.length > 0) {
        await this.prisma.vSGrupoCategoria.createMany({
          data: categorias.map(categoriaId => ({
            grupoId: id,
            categoriaId,
          })),
        });
      }
    }

    const grupo = await this.prisma.vSGrupo.update({
      where: { id },
      data: grupoData,
      include: {
        categorias: {
          include: {
            categoria: true,
          },
        },
        carpeta: true,
      },
    });

    // Transformar la respuesta para incluir categoriaIds
    return {
      ...grupo,
      categoriaIds: grupo.categorias.map(c => c.categoriaId),
      categoriaNames: grupo.categorias.map(c => c.categoria.nombre),
    };
  }

  async deleteGrupo(id: number) {
    // Eliminar categorías del grupo
    await this.prisma.vSGrupoCategoria.deleteMany({
      where: { grupoId: id },
    });

    return this.prisma.vSGrupo.delete({
      where: { id },
    });
  }

  // ===== CONFIGURACIONES =====
  async createConfiguracion(data: { nombre: string; configuracion: any }) {
    return this.prisma.vSConfiguracion.create({
      data: {
        nombre: data.nombre,
        configuracion: data.configuracion,
      },
    });
  }

  async findAllConfiguraciones() {
    return this.prisma.vSConfiguracion.findMany({
      where: { activo: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findConfiguracionById(id: number) {
    return this.prisma.vSConfiguracion.findUnique({
      where: { id },
    });
  }

  async findConfiguracionByNombre(nombre: string) {
    return this.prisma.vSConfiguracion.findFirst({
      where: { nombre, activo: true },
    });
  }

  async updateConfiguracion(id: number, data: { nombre?: string; configuracion?: any; activo?: boolean }) {
    return this.prisma.vSConfiguracion.update({
      where: { id },
      data,
    });
  }

  async deleteConfiguracion(id: number) {
    return this.prisma.vSConfiguracion.update({
      where: { id },
      data: { activo: false },
    });
  }

  // ===== DATOS COMPLETOS =====
  async getVSCategoriasData() {
    const [carpetas, grupos, configuraciones] = await Promise.all([
      this.findAllCarpetas(),
      this.findAllGrupos(),
      this.findAllConfiguraciones(),
    ]);

    return {
      carpetas,
      grupos,
      configuraciones,
    };
  }

  // ===== DATOS PARA GRÁFICOS =====
  async getDatosParaGrafico(filtros: {
    tipo?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    groupIds?: number[];
  }) {
    try {
      // Obtener transacciones filtradas
      let whereClause: any = {};

      // Si hay grupos seleccionados, ignorar completamente el filtro de tipo
      // porque los grupos ya definen qué categorías incluir
      if (filtros.groupIds && filtros.groupIds.length > 0) {
        console.log(`Grupos especificados (${filtros.groupIds.length}), ignorando filtro de tipo`);
      } else if (filtros.tipo && filtros.tipo !== 'Todos') {
        // Solo aplicar filtro de tipo si NO hay grupos especificados
        const tipoMapping: Record<string, number> = {
          'GASTO': 1,
          'APORTE': 2,
          'INGRESO': 3
        };

        const tipoId = tipoMapping[filtros.tipo];
        if (tipoId) {
          // Primero intentar con el tipo específico
          whereClause.tipoId = tipoId;

          // Obtener transacciones con el tipo específico
          let transaccionesConTipo = await this.prisma.transaccion.findMany({
            where: whereClause,
            include: { categoria: true, tipo: true },
          });

          // Si no hay transacciones con ese tipo, ignorar el filtro de tipo
          if (transaccionesConTipo.length === 0) {
            console.log(`No se encontraron transacciones con tipo ${filtros.tipo}, ignorando filtro de tipo`);
            delete whereClause.tipoId;
          }
        }
      }

      // Validar fechas de forma segura para evitar Invalid Date
      const parseSafeDate = (s?: string) => {
        if (!s) return undefined;
        const d = new Date(s);
        return Number.isFinite(d.getTime()) ? d : undefined;
      };

      const dDesde = parseSafeDate(filtros.fechaDesde);
      const dHasta = parseSafeDate(filtros.fechaHasta);

      if (dDesde) {
        whereClause.fecha = {
          ...(whereClause.fecha || {}),
          gte: dDesde,
        };
      }

      if (dHasta) {
        whereClause.fecha = {
          ...(whereClause.fecha || {}),
          lte: dHasta,
        };
      }

      const transacciones = await this.prisma.transaccion.findMany({
        where: whereClause,
        include: { categoria: true, tipo: true },
      });

      console.log(`Transacciones encontradas: ${transacciones.length}`);

      // Si hay grupos seleccionados, agrupar por grupos
      if (filtros.groupIds && filtros.groupIds.length > 0) {
        const grupos = await this.prisma.vSGrupo.findMany({
          where: {
            id: { in: filtros.groupIds },
            visible: true,
          },
          include: {
            categorias: {
              include: {
                categoria: true,
              },
            },
          },
        });

        console.log(`Grupos encontrados: ${grupos.length}`);

        const datos: Record<string, number> = {};
        // Pre-indexar transacciones por categoriaId
        const byCatId = new Map<number, number>();
        for (const t of transacciones) {
          if (t.categoriaId) {
            byCatId.set(t.categoriaId, (byCatId.get(t.categoriaId) || 0) + (t.monto || 0));
          }
        }

        for (const grupo of grupos) {
          const catIds = new Set<number>(grupo.categorias.map(gc => gc.categoriaId));
          let suma = 0;
          for (const cid of catIds) {
            suma += byCatId.get(cid) || 0;
          }
          datos[grupo.nombre] = suma;
          console.log('[VS][DBG] Grupo', grupo.nombre, {
            grupoId: grupo.id,
            categoriaIds: Array.from(catIds),
            suma,
            matches: Array.from(catIds).filter(cid => byCatId.has(cid))
          });
        }

        return { datos, esGrupo: true, grupos };
      }

      // Si no hay grupos, agrupar por categorías individuales
      const datos: Record<string, number> = {};
      transacciones.forEach(t => {
        if (t.categoria) {
          datos[t.categoria.nombre] = (datos[t.categoria.nombre] || 0) + (t.monto || 0);
        }
      });

      console.log(`Categorías encontradas: ${Object.keys(datos).length}`);
      console.log(`Datos por categoría:`, datos);

      return { datos, esGrupo: false };
    } catch (error) {
      console.error('❌ Error en getDatosParaGrafico:', {
        message: (error as any)?.message,
        stack: (error as any)?.stack,
        filtros,
      });
      // Nunca lanzar 500 crudo; devolver estructura vacía para no romper el frontend
      return { datos: {}, esGrupo: !!(filtros.groupIds && filtros.groupIds.length) };
    }
  }
}
