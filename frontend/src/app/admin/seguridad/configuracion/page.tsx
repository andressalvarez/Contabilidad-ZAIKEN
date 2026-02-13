'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Lock,
  Key,
  Clock,
  Shield,
  AlertTriangle,
  Save,
  RefreshCw,
  Info,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { SecurityService, SecuritySettings, UpdateSecuritySettingsDto } from '@/services/security.service';

export default function SecuritySettingsPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<UpdateSecuritySettingsDto>({
    minPasswordLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    sessionTimeoutMinutes: 480,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 15,
    auditRetentionDays: 365,
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Query
  const { data: settings, isLoading } = useQuery({
    queryKey: ['security-settings'],
    queryFn: SecurityService.getSettings,
  });

  // Update form when settings load
  useEffect(() => {
    if (settings) {
      setFormData({
        minPasswordLength: settings.minPasswordLength,
        requireUppercase: settings.requireUppercase,
        requireNumbers: settings.requireNumbers,
        requireSpecialChars: settings.requireSpecialChars,
        sessionTimeoutMinutes: settings.sessionTimeoutMinutes,
        maxLoginAttempts: settings.maxLoginAttempts,
        lockoutDurationMinutes: settings.lockoutDurationMinutes,
        auditRetentionDays: settings.auditRetentionDays,
      });
      setHasChanges(false);
    }
  }, [settings]);

  // Mutation
  const updateSettingsMutation = useMutation({
    mutationFn: SecurityService.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-settings'] });
      toast.success('Configuración guardada exitosamente');
      setHasChanges(false);
    },
    
  });

  const handleChange = (key: keyof UpdateSecuritySettingsDto, value: any) => {
    setFormData({ ...formData, [key]: value });
    setHasChanges(true);
  };

  const handleSave = () => {
    updateSettingsMutation.mutate(formData);
  };

  const handleReset = () => {
    if (settings) {
      setFormData({
        minPasswordLength: settings.minPasswordLength,
        requireUppercase: settings.requireUppercase,
        requireNumbers: settings.requireNumbers,
        requireSpecialChars: settings.requireSpecialChars,
        sessionTimeoutMinutes: settings.sessionTimeoutMinutes,
        maxLoginAttempts: settings.maxLoginAttempts,
        lockoutDurationMinutes: settings.lockoutDurationMinutes,
        auditRetentionDays: settings.auditRetentionDays,
      });
      setHasChanges(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Lock className="text-purple-600" size={28} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Políticas de Seguridad</h1>
            </div>
            <p className="text-gray-600 ml-12">
              Configura las políticas de contraseñas, sesiones y bloqueo de cuentas
            </p>
          </div>
          <div className="flex gap-3">
            {hasChanges && (
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors shadow-sm"
              >
                <RefreshCw className="h-4 w-4" />
                Restablecer
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!hasChanges || updateSettingsMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Password Policy */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <Key className="text-green-600" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Política de Contraseñas</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longitud mínima de contraseña
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="6"
                  max="20"
                  value={formData.minPasswordLength}
                  onChange={(e) => handleChange('minPasswordLength', parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="w-12 text-center text-lg font-semibold text-gray-900">
                  {formData.minPasswordLength}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Mínimo 6 caracteres, máximo 20
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requireUppercase}
                  onChange={(e) => handleChange('requireUppercase', e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Requerir mayúsculas</span>
                  <p className="text-xs text-gray-500">Al menos una letra mayúscula (A-Z)</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requireNumbers}
                  onChange={(e) => handleChange('requireNumbers', e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Requerir números</span>
                  <p className="text-xs text-gray-500">Al menos un número (0-9)</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requireSpecialChars}
                  onChange={(e) => handleChange('requireSpecialChars', e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Requerir caracteres especiales</span>
                  <p className="text-xs text-gray-500">Al menos un carácter especial (!@#$%^&*)</p>
                </div>
              </label>
            </div>

            {/* Password strength preview */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Vista previa de requisitos:</p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-700">
                  <CheckCircle className="h-3 w-3" />
                  {formData.minPasswordLength}+ caracteres
                </span>
                {formData.requireUppercase && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                    <CheckCircle className="h-3 w-3" />
                    Mayúsculas
                  </span>
                )}
                {formData.requireNumbers && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                    <CheckCircle className="h-3 w-3" />
                    Números
                  </span>
                )}
                {formData.requireSpecialChars && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                    <CheckCircle className="h-3 w-3" />
                    Especiales
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Session Policy */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="text-blue-600" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Política de Sesiones</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiempo de expiración de sesión
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="15"
                  max="1440"
                  value={formData.sessionTimeoutMinutes}
                  onChange={(e) => handleChange('sessionTimeoutMinutes', parseInt(e.target.value) || 60)}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <span className="text-sm text-gray-600">minutos</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                La sesión expirará después de este tiempo de inactividad ({Math.floor((formData.sessionTimeoutMinutes || 60) / 60)} horas y {(formData.sessionTimeoutMinutes || 60) % 60} minutos)
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Recomendación:</p>
                <p>
                  Para aplicaciones con datos sensibles, se recomienda un tiempo de sesión
                  entre 30 y 60 minutos. Para uso general, 8 horas (480 minutos) es apropiado.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lockout Policy */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="text-red-600" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Política de Bloqueo</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Intentos de login fallidos permitidos
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="3"
                  max="10"
                  value={formData.maxLoginAttempts}
                  onChange={(e) => handleChange('maxLoginAttempts', parseInt(e.target.value) || 5)}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <span className="text-sm text-gray-600">intentos</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                La cuenta se bloqueará después de {formData.maxLoginAttempts} intentos fallidos
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duración del bloqueo
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={formData.lockoutDurationMinutes}
                  onChange={(e) => handleChange('lockoutDurationMinutes', parseInt(e.target.value) || 15)}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <span className="text-sm text-gray-600">minutos</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                El usuario podrá intentar de nuevo después de {formData.lockoutDurationMinutes} minutos
              </p>
            </div>

            <div className="p-4 bg-amber-50 rounded-lg flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Importante:</p>
                <p>
                  El bloqueo protege contra ataques de fuerza bruta. Un administrador
                  puede desbloquear manualmente una cuenta desde la gestión de usuarios.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Policy */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="text-purple-600" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Política de Auditoría</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Retención de registros de auditoría
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="30"
                  max="730"
                  value={formData.auditRetentionDays}
                  onChange={(e) => handleChange('auditRetentionDays', parseInt(e.target.value) || 365)}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <span className="text-sm text-gray-600">días</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Los registros más antiguos se eliminarán automáticamente ({Math.floor((formData.auditRetentionDays || 365) / 30)} meses aprox.)
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Eventos registrados:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Inicios de sesión exitosos y fallidos
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Cambios de contraseña
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Creación, modificación y eliminación de usuarios
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Cambios en roles y permisos
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Modificaciones de configuración
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Unsaved changes warning */}
      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-amber-50 border border-amber-200 rounded-lg px-6 py-3 shadow-lg flex items-center gap-4">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <span className="text-amber-800">Tienes cambios sin guardar</span>
          <button
            onClick={handleSave}
            disabled={updateSettingsMutation.isPending}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors"
          >
            Guardar
          </button>
        </div>
      )}
    </div>
  );
}
