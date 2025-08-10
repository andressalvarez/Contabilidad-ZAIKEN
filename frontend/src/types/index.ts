// Tipos base del sistema
export interface Rol {
  id: number;
  nombreRol: string;
  importancia: number;
  descripcion?: string;
  createdAt: string;
  updatedAt: string;
  personas?: Persona[];
  _count?: {
    personas: number;
    valorHoras: number;
  };
}

export interface Persona {
  id: number;
  nombre: string;
  rolId: number;
  horasTotales: number;
  aportesTotales: number;
  valorHora: number;
  inversionHoras: number;
  inversionTotal: number;
  participacionPorc: number;
  notas?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  rol?: Rol;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  color?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Campana {
  id: number;
  nombre: string;
  descripcion?: string;
  fechaInicio: string;
  fechaFin?: string;
  presupuesto?: number;
  ingresoTotal: number;
  gastoTotal: number;
  utilidad: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TipoTransaccion {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaccion {
  id: number;
  tipoId: number;
  monto: number;
  concepto: string;
  fecha: string;
  categoriaId?: number;
  categoria?: Categoria;
  personaId?: number;
  campanaId?: number;
  moneda: string;
  notas?: string;
  comprobante?: string;
  aprobado: boolean;
  createdAt: string;
  updatedAt: string;
  tipo?: TipoTransaccion;
  persona?: Persona;
  campana?: Campana;
}

export interface ValorHora {
  id: number;
  personaId: number;
  rolId: number;
  valor: number;
  notas?: string;
  fechaInicio: string;
  fechaFin?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  persona?: Persona;
  rol?: Rol;
}

export interface RegistroHoras {
  id: number;
  personaId: number;
  fecha: string;
  horas: number;
  descripcion?: string;
  aprobado: boolean;
  createdAt: string;
  updatedAt: string;
  persona?: Persona;
}

export interface DistribucionUtilidades {
  id: number;
  periodo: string;
  fecha: string;
  utilidadTotal: number;
  estado: string;
  createdAt: string;
  updatedAt: string;
  detalles?: DistribucionDetalle[];
}

export interface DistribucionDetalle {
  id: number;
  distribucionId: number;
  personaId: number;
  porcentajeParticipacion: number;
  montoDistribuido: number;
  createdAt: string;
  updatedAt: string;
  distribucion?: DistribucionUtilidades;
  persona?: Persona;
}

// DTOs para formularios
export interface CreateRolDto {
  nombreRol: string;
  importancia: number;
  descripcion?: string;
}

export interface UpdateRolDto extends Partial<CreateRolDto> {}

export interface CreatePersonaDto {
  nombre: string;
  rolId: number;
  valorHora?: number;
  participacionPorc: number;
  notas?: string;
}

export interface UpdatePersonaDto extends Partial<CreatePersonaDto> {}

export interface CreateTransaccionDto {
  tipoId: number;
  monto: number;
  concepto: string;
  fecha: string;
  categoria?: string;
  personaId?: number;
  campanaId?: number;
  moneda?: string;
  notas?: string;
}

export interface UpdateTransaccionDto extends Partial<CreateTransaccionDto> {}

export interface CreateValorHoraDto {
  personaId: number;
  valor: number;
  fechaInicio: string;
  notas?: string;
}

export interface UpdateValorHoraDto extends Partial<CreateValorHoraDto> {}

export interface CreateRegistroHorasDto {
  personaId: number;
  campanaId?: number;
  fecha: string;
  horas: number;
  descripcion?: string;
}

export interface UpdateRegistroHorasDto extends Partial<CreateRegistroHorasDto> {}

// Tipos para filtros y consultas
export interface FiltroFecha {
  startDate?: string;
  endDate?: string;
}

export interface EstadisticasRol {
  rol: Rol;
  estadisticas: {
    totalPersonas: number;
    horasTotales: number;
    aportesTotales: number;
    inversionTotal: number;
    valorHoraPromedio: number;
    participacionPromedio: number;
  };
}

// Tipos para UI
export interface TablaColumna {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

export interface PaginacionInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
// DTOs para Campañas
export interface CreateCampanaDto {
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  presupuesto?: number;
  objetivoIngresos?: number;
  descripcion?: string;
  activo?: boolean;
}

export interface UpdateCampanaDto extends Partial<CreateCampanaDto> {}

// Extender la interfaz Campana existente con métricas calculadas
export interface CampanaConMetricas extends Campana {
  horasInvertidas?: number;
  gastoTotalReal?: number;
  ingresoTotalReal?: number;
  rentabilidadReal?: number;
  objetivoIngresos?: number;
}

