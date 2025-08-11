import { api } from '@/lib/api';

export interface VSCarpeta {
  id: number;
  nombre: string;
  color: string;
  visible: boolean;
  orden: number;
  createdAt: string;
  updatedAt: string;
  grupos?: VSGrupo[];
}

export interface VSGrupo {
  id: number;
  nombre: string;
  color: string;
  visible: boolean;
  orden: number;
  carpetaId?: number;
  createdAt: string;
  updatedAt: string;
  carpeta?: VSCarpeta;
  categorias?: VSGrupoCategoria[];
  categoriaIds?: number[];       // ✅ nuevo: IDs de categorías
  categoriaNames?: string[];     // ✅ nuevo: nombres de categorías
}

export interface VSGrupoCategoria {
  id: number;
  grupoId: number;
  categoriaId: number;
  createdAt: string;
  categoria: {
    id: number;
    nombre: string;
    color?: string;
  };
}

export interface VSConfiguracion {
  id: number;
  nombre: string;
  configuracion: any;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DatosGrafico {
  datos: Record<string, number>;
  esGrupo: boolean;
  grupos?: VSGrupo[];
}

export class VSCategoriasService {
  // ===== CARPETAS =====
  static async createCarpeta(data: { nombre: string; color: string; visible?: boolean; orden?: number }) {
    const response = await api.post('/vs-categorias/carpetas', data);
    return response.data;
  }

  static async findAllCarpetas() {
    const response = await api.get('/vs-categorias/carpetas');
    return response.data;
  }

  static async findCarpetaById(id: number) {
    const response = await api.get(`/vs-categorias/carpetas/${id}`);
    return response.data;
  }

  static async updateCarpeta(id: number, data: { nombre?: string; color?: string; visible?: boolean; orden?: number }) {
    const response = await api.put(`/vs-categorias/carpetas/${id}`, data);
    return response.data;
  }

  static async deleteCarpeta(id: number) {
    const response = await api.delete(`/vs-categorias/carpetas/${id}`);
    return response.data;
  }

  // ===== GRUPOS =====
  static async createGrupo(data: {
    nombre: string;
    color: string;
    visible?: boolean;
    orden?: number;
    carpetaId?: number;
    categorias: number[];
  }) {
    const response = await api.post('/vs-categorias/grupos', data);
    return response.data;
  }

  static async findAllGrupos() {
    const response = await api.get('/vs-categorias/grupos');
    return response.data;
  }

  static async findGrupoById(id: number) {
    const response = await api.get(`/vs-categorias/grupos/${id}`);
    return response.data;
  }

  static async updateGrupo(id: number, data: {
    nombre?: string;
    color?: string;
    visible?: boolean;
    orden?: number;
    carpetaId?: number;
    categorias?: number[];
  }) {
    const response = await api.put(`/vs-categorias/grupos/${id}`, data);
    return response.data;
  }

  static async deleteGrupo(id: number) {
    const response = await api.delete(`/vs-categorias/grupos/${id}`);
    return response.data;
  }

  // ===== CONFIGURACIONES =====
  static async createConfiguracion(data: { nombre: string; configuracion: any }) {
    const response = await api.post('/vs-categorias/configuraciones', data);
    return response.data;
  }

  static async findAllConfiguraciones() {
    const response = await api.get('/vs-categorias/configuraciones');
    return response.data;
  }

  static async findConfiguracionById(id: number) {
    const response = await api.get(`/vs-categorias/configuraciones/${id}`);
    return response.data;
  }

  static async findConfiguracionByNombre(nombre: string) {
    const response = await api.get(`/vs-categorias/configuraciones/nombre/${nombre}`);
    return response.data;
  }

  static async updateConfiguracion(id: number, data: { nombre?: string; configuracion?: any; activo?: boolean }) {
    const response = await api.put(`/vs-categorias/configuraciones/${id}`, data);
    return response.data;
  }

  static async deleteConfiguracion(id: number) {
    const response = await api.delete(`/vs-categorias/configuraciones/${id}`);
    return response.data;
  }

  // ===== DATOS COMPLETOS =====
  static async getVSCategoriasData() {
    const response = await api.get('/vs-categorias/data');
    return response.data;
  }

  // ===== DATOS PARA GRÁFICOS =====
  static async getDatosParaGrafico(filtros: {
    tipo?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    groupIds?: number[];
  }) {
    const params = new URLSearchParams();

    if (filtros.tipo) params.append('tipo', filtros.tipo);
    if (filtros.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
    if (filtros.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);
    if (filtros.groupIds && filtros.groupIds.length > 0) {
      filtros.groupIds.forEach(id => params.append('groupIds', id.toString()));
    }

    const response = await api.get(`/vs-categorias/datos-grafico?${params.toString()}`);
    return response.data;
  }

  // ===== TRANSACCIONES POR SEGMENTO =====
  static async getTransaccionesPorSegmento(filtros: {
    categoriaId?: number;
    categoriasIds?: number[];
    fechaInicio?: string;
    fechaFin?: string;
    tipo?: string;
  }) {
    const params = new URLSearchParams();

    // Si es una categoría específica
    if (filtros.categoriaId) {
      params.append('categoriaId', filtros.categoriaId.toString());
    }

    // Si son múltiples categorías (grupo)
    if (filtros.categoriasIds && filtros.categoriasIds.length > 0) {
      filtros.categoriasIds.forEach(id => params.append('categoriasIds', id.toString()));
    }

    // Filtros adicionales
    if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
    if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);

    // Lógica mejorada para el filtro de tipo
    if (filtros.tipo && filtros.tipo !== 'Todos') {
      // Mapear tipo a tipoId si es necesario
      const tipoMapping: Record<string, number> = {
        'GASTO': 1,
        'APORTE': 2,
        'INGRESO': 3
      };
      const tipoId = tipoMapping[filtros.tipo];
      if (tipoId) {
        params.append('tipoId', tipoId.toString());
        // Agregar ignorarTipo=true para permitir que el backend ignore el tipo
        // si no hay transacciones que coincidan con el tipo específico
        params.append('ignorarTipo', 'true');
      }
    }

    console.log('🌐 Llamando API de transacciones con filtros:', params.toString());
    const response = await api.get(`/transacciones?${params.toString()}`);
    return response.data;
  }
}
