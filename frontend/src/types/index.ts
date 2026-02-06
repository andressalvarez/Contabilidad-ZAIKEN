// Base system types
export interface Rol {
  id: number;
  nombreRol: string;
  importancia: number;
  descripcion?: string;
  createdAt: string;
  updatedAt: string;
  usuarios?: Usuario[];
  _count?: {
    usuarios: number;
    valorHoras: number;
  };
}

// User - Main consolidated entity
export interface Usuario {
  id: number;
  negocioId: number;
  email: string;
  nombre: string;
  rol: 'ADMIN_NEGOCIO' | 'USER' | 'EMPLEADO';
  activo: boolean;

  // Fields migrated from Persona
  rolId?: number;
  rolNegocio?: Rol;
  participacionPorc: number;
  horasTotales: number;
  aportesTotales: number;
  valorHora: number;
  inversionHoras: number;
  inversionTotal: number;
  notas?: string;

  // Authentication fields (SMTP)
  emailVerified?: boolean;
  activationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;

  createdAt: string;
  updatedAt: string;
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
  usuarioId?: number;
  usuario?: Usuario;
  personaId?: number;
  campanaId?: number;
  campana?: Campana;
  moneda: string;
  notas?: string;
  comprobante?: string;
  aprobado: boolean;
  createdAt: string;
  updatedAt: string;
  tipo?: TipoTransaccion;
}

export interface ValorHora {
  id: number;
  usuarioId?: number;
  usuario?: Usuario;
  personaId?: number;
  rolId: number;
  rol?: Rol;
  valor: number;
  notas?: string;
  fechaInicio: string;
  fechaFin?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RegistroHoras {
  id: number;
  usuarioId?: number;
  usuario?: Usuario;
  personaId?: number;
  campanaId?: number;
  campana?: Campana;
  fecha: string;
  horas: number;
  descripcion?: string;
  aprobado: boolean;
  aprobadoPor?: number;
  fechaAprobacion?: string;
  rechazado?: boolean;
  motivoRechazo?: string;
  origen?: string; // 'MANUAL' | 'TIMER'
  timerInicio?: string;
  timerFin?: string;
  estado?: string; // 'RUNNING' | 'PAUSADO' | 'COMPLETADO'

  // Audit fields for time editing
  timerInicioOriginal?: string; // Actual start before editing
  horasOriginales?: number; // Hours before manual editing
  editadoPor?: number; // ID of user who edited
  fechaEdicion?: string; // When it was edited

  createdAt: string;
  updatedAt: string;
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
  usuarioId?: number;
  usuario?: Usuario;
  personaId?: number;
  porcentajeParticipacion: number;
  montoDistribuido: number;
  createdAt: string;
  updatedAt: string;
  distribucion?: DistribucionUtilidades;
}

// DTOs for forms
export interface CreateRolDto {
  nombreRol: string;
  importancia: number;
  descripcion?: string;
}

export interface UpdateRolDto extends Partial<CreateRolDto> {}

// DTOs for Usuario
export interface CreateUsuarioDto {
  email: string;
  password: string;
  nombre: string;
  rol: 'ADMIN_NEGOCIO' | 'USER' | 'EMPLEADO';
  activo?: boolean;
  // Fields migrated from Persona
  rolId?: number;
  participacionPorc?: number;
  horasTotales?: number;
  aportesTotales?: number;
  valorHora?: number;
  notas?: string;
}

export interface UpdateUsuarioDto extends Partial<CreateUsuarioDto> {}

export interface CreateTransaccionDto {
  tipoId: number;
  monto: number;
  concepto: string;
  fecha: string;
  categoriaId?: number;
  usuarioId?: number;
  personaId?: number;
  campanaId?: number;
  moneda?: string;
  notas?: string;
}

export interface UpdateTransaccionDto extends Partial<CreateTransaccionDto> {}

export interface CreateValorHoraDto {
  usuarioId?: number;
  personaId?: number;
  valor: number;
  fechaInicio: string;
  notas?: string;
}

export interface UpdateValorHoraDto extends Partial<CreateValorHoraDto> {}

export interface CreateRegistroHorasDto {
  usuarioId?: number;
  personaId?: number;
  campanaId?: number;
  fecha: string;
  horas: number;
  descripcion?: string;
}

export interface UpdateRegistroHorasDto extends Partial<CreateRegistroHorasDto> {}

// Types for filters and queries
export interface FiltroFecha {
  startDate?: string;
  endDate?: string;
}

export interface EstadisticasRol {
  rol: Rol;
  estadisticas: {
    totalUsuarios: number;
    horasTotales: number;
    aportesTotales: number;
    inversionTotal: number;
    valorHoraPromedio: number;
    participacionPromedio: number;
  };
}

// Types for UI
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
// DTOs for Campaigns
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

// Extend the existing Campaign interface with calculated metrics
export interface CampanaConMetricas extends Campana {
  horasInvertidas?: number;
  gastoTotalReal?: number;
  ingresoTotalReal?: number;
  rentabilidadReal?: number;
  objetivoIngresos?: number;
}

