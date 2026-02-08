import { api } from '@/lib/api';

// Types
export interface Permission {
  id: number;
  code: string;
  resource: string;
  context: string;
  subject: string;
  action: string;
  description: string;
  category: string;
  route?: string | null;
  dependencies?: string[];
  displayOrder: number;
  isSystem: boolean;
  active: boolean;
}

export interface RolePermission {
  id: number;
  permissionId: number;
  conditions?: Record<string, unknown>;
  permission: Permission;
}

export interface SecurityRole {
  id: number;
  negocioId: number;
  name: string;
  description?: string;
  color?: string;
  isSystem: boolean;
  priority: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  permissions: RolePermission[];
  _count?: {
    users: number;
  };
  users?: Array<{
    id: number;
    nombre: string;
    email: string;
    activo: boolean;
  }>;
}

export interface CreateRoleDto {
  name: string;
  description?: string;
  color?: string;
  priority?: number;
  active?: boolean;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  color?: string;
  priority?: number;
  active?: boolean;
}

export interface AssignPermissionsDto {
  permissionIds: number[];
  conditions?: Record<number, Record<string, unknown>>;
}

export interface CreatePermissionDto {
  code: string;
  resource: string;
  context: string;
  subject: string;
  action: string;
  description: string;
  category: string;
  route?: string;
  dependencies?: string[];
  displayOrder?: number;
  isSystem?: boolean;
  active?: boolean;
}

export interface UpdatePermissionDto extends Partial<CreatePermissionDto> {}

export interface SecuritySettings {
  id: number;
  negocioId: number;
  minPasswordLength: number;
  requireUppercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  auditRetentionDays: number;
}

export interface UpdateSecuritySettingsDto {
  minPasswordLength?: number;
  requireUppercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
  sessionTimeoutMinutes?: number;
  maxLoginAttempts?: number;
  lockoutDurationMinutes?: number;
  auditRetentionDays?: number;
}

export interface AuditLog {
  id: number;
  negocioId: number;
  userId?: number;
  eventType: string;
  targetType?: string;
  targetId?: number;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    id: number;
    nombre: string;
    email: string;
  };
}

export interface AuditLogQuery {
  page?: number;
  limit?: number;
  eventType?: string;
  userId?: number;
  startDate?: string;
  endDate?: string;
}

export interface SecuritySession {
  id: string;
  userId: number;
  negocioId: number;
  deviceInfo?: string;
  ipAddress?: string;
  lastActivity: string;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
  user?: {
    id: number;
    nombre: string;
    email: string;
  };
}

export const SecurityService = {
  // Roles
  getRoles: async (): Promise<SecurityRole[]> => {
    const { data } = await api.get('/security/roles');
    return data?.data || data || [];
  },

  getRole: async (id: number): Promise<SecurityRole> => {
    const { data } = await api.get(`/security/roles/${id}`);
    return data?.data || data;
  },

  createRole: async (dto: CreateRoleDto): Promise<SecurityRole> => {
    const { data } = await api.post('/security/roles', dto);
    return data?.data || data;
  },

  updateRole: async (id: number, dto: UpdateRoleDto): Promise<SecurityRole> => {
    const { data } = await api.patch(`/security/roles/${id}`, dto);
    return data?.data || data;
  },

  deleteRole: async (id: number): Promise<void> => {
    await api.delete(`/security/roles/${id}`);
  },

  assignPermissions: async (roleId: number, dto: AssignPermissionsDto): Promise<SecurityRole> => {
    const { data } = await api.put(`/security/roles/${roleId}/permissions`, dto);
    return data?.data || data;
  },

  getRoleUsers: async (roleId: number): Promise<Array<{ id: number; nombre: string; email: string; activo: boolean }>> => {
    const { data } = await api.get(`/security/roles/${roleId}/users`);
    return data?.data || data || [];
  },

  assignRoleToUser: async (userId: number, roleId: number): Promise<void> => {
    await api.put(`/security/roles/${roleId}/users/${userId}`);
  },

  // Permissions
  getPermissions: async (): Promise<Permission[]> => {
    const { data } = await api.get('/security/permissions');
    return data?.data || data || [];
  },

  getPermissionsByCategory: async (): Promise<Record<string, Permission[]>> => {
    const { data } = await api.get('/security/permissions/by-category');
    return data?.data || data || {};
  },

  getMyPermissions: async (): Promise<Permission[]> => {
    const { data } = await api.get('/security/permissions/my-permissions');
    return data?.data || data || [];
  },

  createPermission: async (dto: CreatePermissionDto): Promise<Permission> => {
    const { data } = await api.post('/security/permissions', dto);
    return data?.data || data;
  },

  updatePermission: async (id: number, dto: UpdatePermissionDto): Promise<Permission> => {
    const { data } = await api.patch(`/security/permissions/${id}`, dto);
    return data?.data || data;
  },

  deletePermission: async (id: number): Promise<void> => {
    await api.delete(`/security/permissions/${id}`);
  },

  // Audit Logs
  getAuditLogs: async (query?: AuditLogQuery): Promise<{ data: AuditLog[]; total: number; page: number; limit: number }> => {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.eventType) params.append('eventType', query.eventType);
    if (query?.userId) params.append('userId', query.userId.toString());
    if (query?.startDate) params.append('startDate', query.startDate);
    if (query?.endDate) params.append('endDate', query.endDate);

    const { data } = await api.get(`/security/audit?${params.toString()}`);
    const payload = data?.data || data || { data: [], meta: { total: 0, page: 1, limit: query?.limit || 50 } };

    if (Array.isArray(payload)) {
      return {
        data: payload,
        total: payload.length,
        page: query?.page || 1,
        limit: query?.limit || 50,
      };
    }

    const meta = payload.meta || {};
    return {
      data: payload.data || [],
      total: meta.total || payload.total || (payload.data ? payload.data.length : 0),
      page: meta.page || payload.page || query?.page || 1,
      limit: meta.limit || payload.limit || query?.limit || 50,
    };
  },

  getEventTypes: async (): Promise<string[]> => {
    const { data } = await api.get('/security/audit/event-types');
    return data?.data || data || [];
  },

  // Sessions
  getSessions: async (): Promise<SecuritySession[]> => {
    const { data } = await api.get('/security/sessions');
    return data?.data || data || [];
  },

  getMySessions: async (): Promise<SecuritySession[]> => {
    const { data } = await api.get('/security/sessions/me');
    return data?.data || data || [];
  },

  revokeSession: async (sessionId: string): Promise<void> => {
    await api.delete(`/security/sessions/${sessionId}`);
  },

  revokeAllMySessions: async (): Promise<void> => {
    await api.delete('/security/sessions/me/all');
  },

  // Security Settings
  getSettings: async (): Promise<SecuritySettings | null> => {
    const { data } = await api.get('/security/settings');
    return data?.data || data || null;
  },

  updateSettings: async (dto: UpdateSecuritySettingsDto): Promise<SecuritySettings> => {
    const { data } = await api.patch('/security/settings', dto);
    return data?.data || data;
  },
};

export default SecurityService;
