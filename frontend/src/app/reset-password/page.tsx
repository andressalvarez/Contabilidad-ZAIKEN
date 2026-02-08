'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import { UsuariosService } from '@/services/usuarios.service';
import { toast } from 'sonner';
import Link from 'next/link';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password validation
  const passwordValidations = {
    minLength: password.length >= 6,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    passwordsMatch: password === confirmPassword && password.length > 0,
  };

  const isFormValid =
    passwordValidations.minLength &&
    passwordValidations.passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError('Token de recuperación no válido');
      return;
    }

    if (!isFormValid) {
      toast.error('Por favor completa todos los requisitos de la contraseña');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await UsuariosService.resetPassword(token, password);
      setIsSuccess(true);
      toast.success('Contraseña actualizada exitosamente');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al restablecer la contraseña';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Enlace Inválido</h1>
          <p className="text-gray-600 mb-6">
            El enlace de recuperación no es válido o ha expirado.
            Por favor solicita un nuevo enlace de recuperación.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
          >
            Volver al Inicio de Sesión
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Contraseña Actualizada</h1>
          <p className="text-gray-600 mb-6">
            Tu contraseña ha sido restablecida exitosamente.
            Ya puedes iniciar sesión con tu nueva contraseña.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium w-full"
          >
            Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Restablecer Contraseña
          </h1>
          <p className="text-gray-600">
            Ingresa tu nueva contraseña para continuar
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* New Password */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Lock className="h-4 w-4" />
              Nueva Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white pr-12"
                placeholder="Ingresa tu nueva contraseña"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Lock className="h-4 w-4" />
              Confirmar Contraseña
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white pr-12"
                placeholder="Confirma tu nueva contraseña"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Requisitos de la contraseña:</p>
            <ul className="space-y-2">
              <li className={`flex items-center gap-2 text-sm ${passwordValidations.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                <CheckCircle className={`h-4 w-4 ${passwordValidations.minLength ? 'text-green-500' : 'text-gray-300'}`} />
                Mínimo 6 caracteres
              </li>
              <li className={`flex items-center gap-2 text-sm ${passwordValidations.hasUppercase ? 'text-green-600' : 'text-gray-500'}`}>
                <CheckCircle className={`h-4 w-4 ${passwordValidations.hasUppercase ? 'text-green-500' : 'text-gray-300'}`} />
                Al menos una mayúscula (recomendado)
              </li>
              <li className={`flex items-center gap-2 text-sm ${passwordValidations.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                <CheckCircle className={`h-4 w-4 ${passwordValidations.hasNumber ? 'text-green-500' : 'text-gray-300'}`} />
                Al menos un número (recomendado)
              </li>
              <li className={`flex items-center gap-2 text-sm ${passwordValidations.passwordsMatch ? 'text-green-600' : 'text-gray-500'}`}>
                <CheckCircle className={`h-4 w-4 ${passwordValidations.passwordsMatch ? 'text-green-500' : 'text-gray-300'}`} />
                Las contraseñas coinciden
              </li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Actualizando...
              </>
            ) : (
              <>
                <KeyRound className="h-5 w-5" />
                Restablecer Contraseña
              </>
            )}
          </button>
        </form>

        {/* Back to login */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
