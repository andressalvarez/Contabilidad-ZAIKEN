'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Mail,
  Server,
  Lock,
  Send,
  Save,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useCan } from '@/hooks/usePermissions';
import { Action } from '@/contexts/AbilityContext';
import {
  useSmtpConfig,
  useUpdateSmtpConfig,
  useTestSmtpConnection,
} from '@/hooks/useSettings';
import { SmtpConfig } from '@/services/settings.service';
import MainLayout from '@/components/layout/MainLayout';

export default function ConfiguracionPage() {
  const canManage = useCan(Action.Manage, 'Settings');
  const { data: config, isLoading } = useSmtpConfig();
  const updateMutation = useUpdateSmtpConfig();
  const testMutation = useTestSmtpConnection();

  const [formData, setFormData] = useState<SmtpConfig>({
    host: '',
    port: 587,
    secure: false,
    auth: { user: '', pass: '' },
    from: { name: 'Sistema Zaiken', email: '' },
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  if (!canManage) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle size={64} className="text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Acceso Denegado
            </h1>
            <p className="text-gray-600">
              No tienes permisos para acceder a esta página
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateMutation.mutateAsync(formData);
  };

  const handleTestConnection = async () => {
    await testMutation.mutateAsync(formData);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Cargando configuración...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Settings className="text-indigo-600" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Configuración del Sistema
              </h1>
              <p className="text-gray-600">
                Configura el servidor SMTP para notificaciones por correo
                electrónico
              </p>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">Información</h3>
            <p className="text-sm text-blue-700 mt-1">
              El sistema enviará correos para recuperación de contraseña y
              activación de cuentas. Asegúrate de usar una contraseña de
              aplicación (no tu contraseña normal) para servicios como Gmail.
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* SMTP Host */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Server className="h-4 w-4" />
                Servidor SMTP *
              </label>
              <input
                type="text"
                value={formData.host}
                onChange={(e) =>
                  setFormData({ ...formData, host: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                placeholder="smtp.gmail.com"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Ejemplo: smtp.gmail.com, smtp.office365.com,
                smtp-mail.outlook.com
              </p>
            </div>

            {/* Port + Secure */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Puerto *
                </label>
                <input
                  type="number"
                  value={formData.port}
                  onChange={(e) =>
                    setFormData({ ...formData, port: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  placeholder="587"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Común: 587 (STARTTLS), 465 (SSL)
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Seguridad
                </label>
                <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.secure}
                    onChange={(e) =>
                      setFormData({ ...formData, secure: e.target.checked })
                    }
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Usar SSL/TLS</span>
                </label>
              </div>
            </div>

            {/* Auth User */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Mail className="h-4 w-4" />
                Usuario (Email) *
              </label>
              <input
                type="email"
                value={formData.auth.user}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    auth: { ...formData.auth, user: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                placeholder="tu-email@gmail.com"
                required
              />
            </div>

            {/* Auth Password */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Lock className="h-4 w-4" />
                Contraseña de Aplicación *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.auth.pass}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      auth: { ...formData.auth, pass: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  placeholder="••••••••••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Para Gmail:{' '}
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  Genera una contraseña de aplicación aquí
                </a>
              </p>
            </div>

            {/* From Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Nombre del Remitente *
                </label>
                <input
                  type="text"
                  value={formData.from.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      from: { ...formData.from, name: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  placeholder="Sistema Zaiken"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Email del Remitente *
                </label>
                <input
                  type="email"
                  value={formData.from.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      from: { ...formData.from, email: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  placeholder="noreply@zaiken.com"
                  required
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
                {testMutation.isPending ? 'Probando...' : 'Probar Conexión'}
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                {updateMutation.isPending ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          </form>
        </div>

        {/* Success/Error Messages */}
        {config && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <h3 className="text-sm font-medium text-green-900">
                SMTP Configurado
              </h3>
              <p className="text-sm text-green-700">
                El servidor SMTP está configurado y listo para enviar correos.
              </p>
            </div>
          </div>
        )}
        </div>
      </div>
    </MainLayout>
  );
}
