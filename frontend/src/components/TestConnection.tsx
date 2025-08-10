'use client';

import { useEffect, useState } from 'react';
import { TransaccionesService } from '@/services/transacciones.service';
import { PersonasService } from '@/services/personas.service';
import { CategoriasService } from '@/services/categorias.service';

export default function TestConnection() {
  const [testResults, setTestResults] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testEndpoints = async () => {
      const results: any = {};

      try {
        // Test 1: Estadísticas de transacciones usando servicio
        console.log('Probando endpoint de estadísticas con servicio...');
        const statsData = await TransaccionesService.getStats({});
        console.log('Stats data:', statsData);
        results.stats = { success: true, data: statsData };
      } catch (error) {
        console.error('❌ Error en stats:', error);
        results.stats = { error: error.message, details: error };
      }

      try {
        // Test 2: Resumen de personas usando servicio
        console.log('Probando endpoint de personas con servicio...');
        const personasData = await PersonasService.getAll();
        results.personas = { success: true, data: personasData };
      } catch (error) {
        console.error('❌ Error en personas:', error);
        results.personas = { error: error.message, details: error };
      }

      try {
        // Test 3: Categorías usando servicio
        console.log('Probando endpoint de categorías con servicio...');
        const categoriasData = await CategoriasService.getAll();
        results.categorias = { success: true, data: categoriasData };
      } catch (error) {
        console.error('❌ Error en categorías:', error);
        results.categorias = { error: error.message, details: error };
      }

      setTestResults(results);
      setLoading(false);
    };

    testEndpoints();
  }, []);

  if (loading) {
    return <div>Cargando pruebas de conexión...</div>;
  }

  return (
    <div className="p-4 bg-gray-100 rounded">
      <h3 className="text-lg font-bold mb-4">Pruebas de Conexión API (Servicios)</h3>

      <div className="space-y-4">
        <div>
          <h4 className="font-semibold">Estadísticas de Transacciones:</h4>
          <pre className="bg-white p-2 rounded text-xs overflow-auto">
            {JSON.stringify(testResults.stats, null, 2)}
          </pre>
        </div>

        <div>
          <h4 className="font-semibold">Resumen de Personas:</h4>
          <pre className="bg-white p-2 rounded text-xs overflow-auto">
            {JSON.stringify(testResults.personas, null, 2)}
          </pre>
        </div>

        <div>
          <h4 className="font-semibold">Categorías:</h4>
          <pre className="bg-white p-2 rounded text-xs overflow-auto">
            {JSON.stringify(testResults.categorias, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
