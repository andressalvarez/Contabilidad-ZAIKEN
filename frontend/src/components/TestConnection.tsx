'use client';

import { useEffect, useState } from 'react';
import { TransaccionesService } from '@/services/transacciones.service';
import { UsuariosService } from '@/services/usuarios.service';
import { CategoriasService } from '@/services/categorias.service';

export default function TestConnection() {
  const [testResults, setTestResults] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testEndpoints = async () => {
      const results: any = {};

      try {
        // Test 1: Transaction statistics using service
        console.log('Probando endpoint de estadísticas con servicio...');
        const statsData = await TransaccionesService.getStats({});
        console.log('Stats data:', statsData);
        results.stats = { success: true, data: statsData };
      } catch (error) {
        console.error('❌ Error en stats:', error);
        results.stats = { error: error.message, details: error };
      }

      try {
        // Test 2: Resumen de usuarios usando servicio
        console.log('Probando endpoint de usuarios con servicio...');
        const usuariosData = await UsuariosService.list();
        results.usuarios = { success: true, data: usuariosData };
      } catch (error) {
        console.error('❌ Error en usuarios:', error);
        results.usuarios = { error: error.message, details: error };
      }

      try {
        // Test 3: Categories using service
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
          <h4 className="font-semibold">Resumen de Usuarios:</h4>
          <pre className="bg-white p-2 rounded text-xs overflow-auto">
            {JSON.stringify(testResults.usuarios, null, 2)}
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
