'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { showAlert, showConfirm } from '@/lib/app-dialog';
import { api } from '@/lib/api';

/**
 * Componente de ejemplo que muestra el nuevo sistema de manejo de errores
 *
 * Este componente NO está en uso en la aplicación.
 * Es solo para demostración y referencia.
 */
export function ErrorHandlingExample() {
  const [testType, setTestType] = useState<string>('');
  const { handleError, handleErrorWithAlert, showSuccess } = useErrorHandler();

  // ✅ Ejemplo 1: Query automático
  const { data: exampleData } = useQuery({
    queryKey: ['example'],
    queryFn: async () => {
      // Si esto falla, el interceptor muestra automáticamente el error
      const response = await api.get('/example');
      return response.data;
    },
    enabled: false, // Solo como ejemplo, no ejecutar realmente
  });

  // ✅ Ejemplo 2: Mutation automático
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/example', data);
      return response.data;
    },
    onSuccess: () => {
      // ✅ Solo manejar el éxito
      toast.success('Operación exitosa');
    },
    // ❌ NO necesitas onError - el interceptor lo maneja
  });

  // ✅ Ejemplo 3: Llamada directa con try-catch
  const handleDirectCall = async () => {
    try {
      const response = await api.post('/example', { test: true });
      toast.success('Llamada exitosa');
      console.log(response.data);
    } catch (error) {
      // ✅ El toast de error ya se mostró automáticamente
      // Solo maneja lógica adicional si es necesario
      console.error('Lógica adicional después del error:', error);
    }
  };

  // ✅ Ejemplo 4: Usar el hook para casos especiales
  const handleCustomError = async () => {
    try {
      await api.post('/critical-operation', { important: true });
      showSuccess('Operación crítica exitosa');
    } catch (error) {
      // Mostrar como popup en lugar de toast
      handleErrorWithAlert(error, 'Error Crítico');
    }
  };

  // ✅ Ejemplo 5: Confirmación antes de acción peligrosa
  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm({
      title: 'Confirmar eliminación',
      message: '¿Está seguro de eliminar este elemento?',
      danger: true,
    });

    if (!confirmed) return;

    try {
      await api.delete(`/example/${id}`);
      toast.success('Eliminado exitosamente');
    } catch (error) {
      // ✅ El error ya se mostró como toast automáticamente
    }
  };

  // ✅ Ejemplo 6: Simulador de errores para testing
  const simulateError = async (errorType: string) => {
    try {
      switch (errorType) {
        case '400':
          await api.get('/test/error/400');
          break;
        case '401':
          await api.get('/test/error/401');
          break;
        case '403':
          await api.get('/test/error/403');
          break;
        case '404':
          await api.get('/test/error/404');
          break;
        case '500':
          await api.get('/test/error/500');
          break;
        case 'network':
          await api.get('http://localhost:9999/nonexistent');
          break;
        default:
          await api.get('/test/error/unknown');
      }
    } catch (error) {
      // ✅ El error ya se mostró automáticamente
      console.log('Error capturado para testing:', error);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        Ejemplos de Manejo de Errores
      </h1>

      <div className="space-y-6">
        {/* Ejemplo 1: Query */}
        <section className="border rounded-lg p-4">
          <h2 className="font-semibold mb-2">1. Query Automático</h2>
          <p className="text-sm text-gray-600 mb-3">
            Las queries manejan automáticamente los errores. No necesitas onError.
          </p>
          <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`const { data } = useQuery({
  queryKey: ['example'],
  queryFn: () => api.get('/example'),
  // ✅ NO necesitas onError
});`}
          </pre>
        </section>

        {/* Ejemplo 2: Mutation */}
        <section className="border rounded-lg p-4">
          <h2 className="font-semibold mb-2">2. Mutation Automático</h2>
          <p className="text-sm text-gray-600 mb-3">
            Las mutations también manejan errores automáticamente.
          </p>
          <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`const createMutation = useMutation({
  mutationFn: (data) => api.post('/example', data),
  onSuccess: () => toast.success('Éxito'),
  // ✅ NO necesitas onError
});`}
          </pre>
          <button
            onClick={() => createMutation.mutate({ test: true })}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Probar Mutation
          </button>
        </section>

        {/* Ejemplo 3: Try-Catch */}
        <section className="border rounded-lg p-4">
          <h2 className="font-semibold mb-2">3. Llamada Directa con Try-Catch</h2>
          <p className="text-sm text-gray-600 mb-3">
            El toast se muestra automáticamente en el catch.
          </p>
          <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`try {
  await api.post('/example', data);
  toast.success('Éxito');
} catch (error) {
  // ✅ Toast ya se mostró
  // Solo lógica adicional
}`}
          </pre>
          <button
            onClick={handleDirectCall}
            className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Probar Llamada Directa
          </button>
        </section>

        {/* Ejemplo 4: Hook Personalizado */}
        <section className="border rounded-lg p-4">
          <h2 className="font-semibold mb-2">4. Hook Personalizado</h2>
          <p className="text-sm text-gray-600 mb-3">
            Para mostrar errores como popup en lugar de toast.
          </p>
          <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`const { handleErrorWithAlert } = useErrorHandler();

try {
  await criticalOperation();
} catch (error) {
  handleErrorWithAlert(error, 'Error Crítico');
}`}
          </pre>
          <button
            onClick={handleCustomError}
            className="mt-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Probar Error Personalizado
          </button>
        </section>

        {/* Ejemplo 5: Confirmación */}
        <section className="border rounded-lg p-4">
          <h2 className="font-semibold mb-2">5. Con Confirmación</h2>
          <p className="text-sm text-gray-600 mb-3">
            Pedir confirmación antes de acciones peligrosas.
          </p>
          <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`const confirmed = await showConfirm({
  message: '¿Eliminar?',
  danger: true
});

if (confirmed) {
  await api.delete(\`/items/\${id}\`);
}`}
          </pre>
          <button
            onClick={() => handleDelete(123)}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Probar Eliminación
          </button>
        </section>

        {/* Simulador de Errores */}
        <section className="border rounded-lg p-4 bg-yellow-50">
          <h2 className="font-semibold mb-2">🧪 Simulador de Errores</h2>
          <p className="text-sm text-gray-600 mb-3">
            Prueba diferentes tipos de errores para ver cómo se manejan.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button
              onClick={() => simulateError('400')}
              className="px-3 py-2 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
            >
              Error 400
            </button>
            <button
              onClick={() => simulateError('401')}
              className="px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600"
            >
              Error 401
            </button>
            <button
              onClick={() => simulateError('403')}
              className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Error 403
            </button>
            <button
              onClick={() => simulateError('404')}
              className="px-3 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
            >
              Error 404
            </button>
            <button
              onClick={() => simulateError('500')}
              className="px-3 py-2 bg-red-700 text-white rounded text-sm hover:bg-red-800"
            >
              Error 500
            </button>
            <button
              onClick={() => simulateError('network')}
              className="px-3 py-2 bg-gray-700 text-white rounded text-sm hover:bg-gray-800"
            >
              Error Red
            </button>
          </div>
        </section>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold mb-2">💡 Puntos Clave</h3>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>El interceptor muestra automáticamente todos los errores HTTP</li>
          <li>No necesitas <code>onError</code> en queries ni mutations</li>
          <li>Solo maneja el éxito con <code>onSuccess</code></li>
          <li>Usa el hook <code>useErrorHandler</code> para casos especiales</li>
          <li>Los mensajes están en español y son user-friendly</li>
        </ul>
      </div>
    </div>
  );
}

export default ErrorHandlingExample;
