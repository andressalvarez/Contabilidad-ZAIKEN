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

    return this.prisma.vSGrupo.create({
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
  }

  async findAllGrupos() {
    return this.prisma.vSGrupo.findMany({
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
  }

  async findGrupoById(id: number) {
    return this.prisma.vSGrupo.findUnique({
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

    return this.prisma.vSGrupo.update({
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
    gruposSeleccionados?: number[];
  }) {
    // Obtener transacciones filtradas
    let whereClause: any = {};

    if (filtros.tipo && filtros.tipo !== 'Todos') {
      // Mapear nombres de tipo a IDs
      const tipoMapping: Record<string, number> = {
        'GASTO': 1,
        'APORTE': 2,
        'INGRESO': 3
      };

      const tipoId = tipoMapping[filtros.tipo];
      if (tipoId) {
        whereClause.tipoId = tipoId;
      }
    }

    if (filtros.fechaDesde) {
      whereClause.fecha = {
        gte: new Date(filtros.fechaDesde),
      };
    }

    if (filtros.fechaHasta) {
      whereClause.fecha = {
        ...whereClause.fecha,
        lte: new Date(filtros.fechaHasta),
      };
    }

    const transacciones = await this.prisma.transaccion.findMany({
      where: whereClause,
      include: {
        categoria: true,
        tipo: true,
      },
    });

    console.log(`Transacciones encontradas: ${transacciones.length}`);

    // Si hay grupos seleccionados, agrupar por grupos
    if (filtros.gruposSeleccionados && filtros.gruposSeleccionados.length > 0) {
      const grupos = await this.prisma.vSGrupo.findMany({
        where: {
          id: { in: filtros.gruposSeleccionados },
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
      grupos.forEach(grupo => {
        datos[grupo.nombre] = 0;
        grupo.categorias.forEach(gc => {
          transacciones.forEach(t => {
            if (t.categoriaId === gc.categoriaId) {
              datos[grupo.nombre] += t.monto || 0;
            }
          });
        });
      });

      return {
        datos,
        esGrupo: true,
        grupos,
      };
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

    return {
      datos,
      esGrupo: false,
    };
  }
}
