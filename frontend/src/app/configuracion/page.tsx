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
  Bell,
  Shield,
  Database,
  Palette,
  ChevronRight,
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

// Define available configuration sections
interface ConfigSection {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  available: boolean; // false = coming soon
}

const CONFIG_SECTIONS: ConfigSection[] = [
  {
    id: 'smtp',
    name: 'Correo SMTP',
    description: 'Servidor de correo para notificaciones',
    icon: Mail,
    available: true,
  },
  {
    id: 'notifications',
    name: 'Notificaciones',
    description: 'Preferencias de alertas y avisos',
    icon: Bell,
    available: false,
  },
  {
    id: 'security',
    name: 'Seguridad',
    description: 'Autenticación y permisos',
    icon: Shield,
    available: false,
  },
  {
    id: 'backup',
    name: 'Respaldos',
    description: 'Copias de seguridad automáticas',
    icon: Database,
    available: false,
  },
  {
    id: 'appearance',
    name: 'Apariencia',
    description: 'Tema y personalización visual',
    icon: Palette,
    available: false,
  },
];

// SMTP Configuration Component
function SmtpConfigSection() {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateMutation.mutateAsync(formData);
  };

  const handleTestConnection = async () => {
    await testMutation.mutateAsync(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Configuración de Correo SMTP</h2>
        <p className="text-gray-600 mt-1">
          Configura el servidor SMTP para envío de notificaciones por correo electrónico
        </p>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-medium text-blue-900">Información</h3>
          <p className="text-sm text-blue-700 mt-1">
            El sistema enviará correos para recuperación de contraseña y
            activación de cuentas. Asegúrate de usar una contraseña de
            aplicación (no tu contraseña normal) para servicios como Gmail.
          </p>
        </div>
      </div>

      {/* Status indicator */}
      {config && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <h3 className="text-sm font-medium text-green-900">SMTP Configurado</h3>
            <p className="text-sm text-green-700">
              El servidor SMTP está configurado y listo para enviar correos.
            </p>
          </div>
        </div>
      )}

      {/* Form */}
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
            onChange={(e) => setFormData({ ...formData, host: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            placeholder="smtp.gmail.com"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Ejemplo: smtp.gmail.com, smtp.office365.com, smtp-mail.outlook.com
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
              onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
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
                onChange={(e) => setFormData({ ...formData, secure: e.target.checked })}
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
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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

        {/* From Name + Email */}
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
  );
}

// Coming Soon Placeholder Component
function ComingSoonSection({ section }: { section: ConfigSection }) {
  const Icon = section.icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 bg-gray-100 rounded-full mb-4">
        <Icon className="h-12 w-12 text-gray-400" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">{section.name}</h2>
      <p className="text-gray-600 mb-4">{section.description}</p>
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
        Próximamente
      </span>
    </div>
  );
}

export default function ConfiguracionPage() {
  const canManage = useCan(Action.Manage, 'Settings');
  const [activeSection, setActiveSection] = useState('smtp');

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

  // Render section content based on activeSection
  const renderSectionContent = () => {
    const section = CONFIG_SECTIONS.find((s) => s.id === activeSection);

    if (!section) return null;

    if (!section.available) {
      return <ComingSoonSection section={section} />;
    }

    switch (activeSection) {
      case 'smtp':
        return <SmtpConfigSection />;
      // Add more cases here as you add more sections
      // case 'notifications':
      //   return <NotificationsSection />;
      default:
        return <ComingSoonSection section={section} />;
    }
  };

  return (
    <MainLayout>
      <div className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
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
                  Administra las opciones y preferencias del sistema
                </p>
              </div>
            </div>
          </div>

          {/* Main Content: Sidebar + Content Area */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar - Section Menu */}
            <div className="lg:w-72 flex-shrink-0">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                  Secciones
                </h3>
                <nav className="space-y-1">
                  {CONFIG_SECTIONS.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;

                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${
                          isActive ? 'bg-indigo-100' : 'bg-gray-100'
                        }`}>
                          <Icon className={`h-5 w-5 ${
                            isActive ? 'text-indigo-600' : 'text-gray-500'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium truncate ${
                              isActive ? 'text-indigo-700' : 'text-gray-900'
                            }`}>
                              {section.name}
                            </span>
                            {!section.available && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">
                                Próx.
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                            {section.description}
                          </p>
                        </div>
                        {isActive && (
                          <ChevronRight className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                {renderSectionContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
