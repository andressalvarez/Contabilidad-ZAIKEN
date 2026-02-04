'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, ArrowRight } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';

/**
 * ⚠️ PÁGINA DEPRECADA
 *
 * La gestión de Personas se ha consolidado en la sección de Usuarios.
 * Esta página redirige automáticamente a /usuarios.
 *
 * Fecha de deprecación: 2026-02-04
 * Razón: Consolidación de entidades Persona → Usuario (FASE 6)
 */
export default function PersonasDeprecatedPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir automáticamente después de 3 segundos
    const timer = setTimeout(() => {
      router.push('/usuarios');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <MainLayout>
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-8 shadow-lg">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Users className="text-amber-600" size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-amber-900">
                  ⚠️ Sección Consolidada
                </h2>
                <p className="text-amber-700 text-sm mt-1">
                  Esta página ha sido actualizada
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-gray-700">
                La gestión de <strong>Personas</strong> se ha integrado completamente en la sección de <strong>Usuarios</strong>.
              </p>

              <div className="bg-white rounded-lg p-4 border border-amber-200">
                <h3 className="font-semibold text-gray-900 mb-2">¿Qué cambió?</h3>
                <ul className="text-gray-700 text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>Ahora cada usuario tiene todos los campos de persona (participación, horas, valor/hora, etc.)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>Toda la funcionalidad de personas está disponible en la sección de usuarios</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>Los registros existentes se han migrado automáticamente</span>
                  </li>
                </ul>
              </div>

              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                <p className="text-indigo-900 text-sm">
                  <strong>📌 Nota:</strong> Serás redirigido automáticamente en 3 segundos...
                </p>
              </div>
            </div>

            <button
              onClick={() => router.push('/usuarios')}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm font-medium"
            >
              Ir a Usuarios
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
