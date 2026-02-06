'use client';

import { useState, useEffect } from 'react';
import { AuthService, UsuariosService } from '@/services';
import { UserProfile } from '@/services/auth.service';
import MainLayout from '@/components/layout/MainLayout';
import { User, Mail, Briefcase, Building2, Save, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function PerfilPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Load user profile
  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await AuthService.getMe();
      setProfile(data);
      setFormData({
        nombre: data.nombre,
        email: data.email,
        password: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Save changes
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password if changing
    if (formData.password) {
      if (formData.password !== formData.confirmPassword) {
        toast.error('Las contraseñas no coinciden');
        return;
      }
      if (formData.password.length < 6) {
        toast.error('La contraseña debe tener al menos 6 caracteres');
        return;
      }
    }

    try {
      setSaving(true);
      const updateData: any = {
        nombre: formData.nombre,
        email: formData.email,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      await UsuariosService.updateMe(updateData);
      toast.success('Perfil actualizado exitosamente');
      setEditing(false);
      setFormData({ ...formData, password: '', confirmPassword: '' });
      await loadProfile();
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    if (profile) {
      setFormData({
        nombre: profile.nombre,
        email: profile.email,
        password: '',
        confirmPassword: '',
      });
    }
    setEditing(false);
  };

  if (loading) {
    return (
      <MainLayout>
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <RefreshCw
            size={48}
            style={{ color: '#3B82F6', margin: '0 auto', animation: 'spin 1s linear infinite' }}
          />
          <p style={{ color: '#6B7280', marginTop: '1rem' }}>Cargando perfil...</p>
        </div>
      </MainLayout>
    );
  }

  if (!profile) {
    return (
      <MainLayout>
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: '#EF4444' }}>No se pudo cargar el perfil</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1
            style={{
              fontSize: '1.875rem',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '0.5rem',
            }}
          >
            Mi Perfil
          </h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>
            Gestiona tu información personal y configuración de cuenta
          </p>
        </div>

        {/* Información del Negocio */}
        {profile.negocio && (
          <div
            style={{
              backgroundColor: '#F0F9FF',
              border: '1px solid #BFDBFE',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Building2 size={20} style={{ color: '#3B82F6' }} />
              <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1E40AF', margin: 0 }}>
                {profile.negocio.nombre}
              </h2>
            </div>
            {profile.negocio.descripcion && (
              <p style={{ color: '#1E40AF', fontSize: '0.875rem', margin: 0 }}>
                {profile.negocio.descripcion}
              </p>
            )}
          </div>
        )}

        {/* Formulario de Perfil */}
        <form onSubmit={handleSubmit}>
          <div
            style={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '0.75rem',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            }}
          >
            {/* Sección: Información Personal */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #E5E7EB' }}>
              <h3
                style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '1rem',
                }}
              >
                Información Personal
              </h3>

              <div style={{ display: 'grid', gap: '1.25rem' }}>
                {/* Nombre */}
                <div>
                  <label
                    htmlFor="nombre"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <User size={16} />
                    Nombre Completo
                  </label>
                  <input
                    id="nombre"
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    disabled={!editing}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      backgroundColor: editing ? 'white' : '#F9FAFB',
                      cursor: editing ? 'text' : 'not-allowed',
                    }}
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <Mail size={16} />
                    Correo Electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!editing}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      backgroundColor: editing ? 'white' : '#F9FAFB',
                      cursor: editing ? 'text' : 'not-allowed',
                    }}
                  />
                </div>

                {/* Rol (solo lectura) */}
                <div>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <Briefcase size={16} />
                    Rol
                  </label>
                  <input
                    type="text"
                    value={profile.rol}
                    disabled
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      backgroundColor: '#F9FAFB',
                      cursor: 'not-allowed',
                      color: '#6B7280',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Sección: Cambiar Contraseña (solo si está editando) */}
            {editing && (
              <div style={{ padding: '1.5rem', borderBottom: '1px solid #E5E7EB' }}>
                <h3
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '0.5rem',
                  }}
                >
                  Cambiar Contraseña
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1rem' }}>
                  Deja en blanco si no deseas cambiar tu contraseña
                </p>

                <div style={{ display: 'grid', gap: '1.25rem' }}>
                  {/* Nueva contraseña */}
                  <div>
                    <label
                      htmlFor="password"
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Nueva Contraseña
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Mínimo 6 caracteres"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          paddingRight: '3rem',
                          border: '1px solid #D1D5DB',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#6B7280',
                          cursor: 'pointer',
                        }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirmar contraseña */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Confirmar Contraseña
                    </label>
                    <input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({ ...formData, confirmPassword: e.target.value })
                      }
                      placeholder="Confirma tu nueva contraseña"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div
              style={{
                padding: '1.5rem',
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'flex-end',
              }}
            >
              {editing ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    style={{
                      padding: '0.625rem 1.25rem',
                      backgroundColor: 'white',
                      border: '1px solid #D1D5DB',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      cursor: saving ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      padding: '0.625rem 1.25rem',
                      backgroundColor: saving ? '#9CA3AF' : '#3B82F6',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: 'white',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <Save size={16} />
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  style={{
                    padding: '0.625rem 1.25rem',
                    backgroundColor: '#3B82F6',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'white',
                    cursor: 'pointer',
                  }}
                >
                  Editar Perfil
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Información adicional */}
        <div
          style={{
            marginTop: '2rem',
            padding: '1rem',
            backgroundColor: '#F9FAFB',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            color: '#6B7280',
          }}
        >
          <p style={{ margin: 0 }}>
            <strong>ID de Usuario:</strong> {profile.id}
          </p>
          <p style={{ margin: '0.5rem 0 0 0' }}>
            <strong>Cuenta creada:</strong>{' '}
            {new Date(profile.createdAt).toLocaleDateString('es-CO', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
