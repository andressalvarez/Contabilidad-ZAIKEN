// Tipos base del sistema
export interface Rol {
  id: number;
  nombreRol: string;
  importancia: number;
  descripcion?: string;
  createdAt: string;
  updatedAt: string;
  personas?: Persona[];
  usuarios?: Usuario[];
  _count?: {
    personas: number;
    usuarios: number;
    valorHoras: number;
  };
}

// ✅ Usuario - Entidad principal consolidada
export interface Usuario {
  id: number;
  negocioId: number;
  email: string;
  nombre: string;
  rol: 'ADMIN_NEGOCIO' | 'USER' | 'EMPLEADO';
  activo: boolean;

  // Campos migrados de Persona
  rolId?: number;
  rolNegocio?: Rol;
  participacionPorc: number;
  horasTotales: number;
  aportesTotales: number;
  valorHora: number;
  inversionHoras: number;
  inversionTotal: number;
  notas?: string;

  // Campos de autenticación (SMTP)
  emailVerified?: boolean;
  activationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;

  createdAt: string;
  updatedAt: string;

  // Relaciones
  personas?: Persona[]; // Para compatibilidad temporal
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
  fecha: string;
  horas: number;
  descripcion?: string;
  aprobado: boolean;
  rechazado?: boolean;
  motivoRechazo?: string;
  origen?: string; // 'MANUAL' | 'TIMER'
  timerInicio?: string;
  timerFin?: string;
  estado?: string; // 'RUNNING' | 'PAUSADO' | 'COMPLETADO'
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

// DTOs para formularios
export interface CreateRolDto {
  nombreRol: string;
  importancia: number;
  descripcion?: string;
}

export interface UpdateRolDto extends Partial<CreateRolDto> {}

// DTOs para Usuario
export interface CreateUsuarioDto {
  email: string;
  password: string;
  nombre: string;
  rol: 'ADMIN_NEGOCIO' | 'USER' | 'EMPLEADO';
  activo?: boolean;
  // Campos migrados de Persona
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

