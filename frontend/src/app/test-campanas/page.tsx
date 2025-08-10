'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function TestCampanasPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('TestCampanasPage: Iniciando petición...');
        const response = await api.get('/api/v1/campanas');
        console.log('TestCampanasPage: Respuesta completa:', response);
        setData(response.data);
        setLoading(false);
      } catch (err: any) {
        console.error('TestCampanasPage: Error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Test Campañas</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Test Campañas</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Campañas</h1>

      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
        <strong>Éxito:</strong> Datos cargados correctamente
      </div>

      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="font-bold mb-2">Información de la respuesta:</h2>
        <p><strong>Success:</strong> {data?.success ? 'true' : 'false'}</p>
        <p><strong>Message:</strong> {data?.message}</p>
        <p><strong>Cantidad de campañas:</strong> {data?.data?.length || 0}</p>
      </div>

      {data?.data && data.data.length > 0 && (
        <div className="bg-white border rounded p-4">
          <h2 className="font-bold mb-2">Primeras 5 campañas:</h2>
          <div className="space-y-2">
            {data.data.slice(0, 5).map((campana: any) => (
              <div key={campana.id} className="border-b pb-2">
                <p><strong>ID:</strong> {campana.id}</p>
                <p><strong>Nombre:</strong> {campana.nombre}</p>
                <p><strong>Presupuesto:</strong> {campana.presupuesto}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Recargar
        </button>
      </div>
    </div>
  );
}
