# 📊 Documentación: Gráfica "Gastos por Tipo de Gasto" (Debería ser "Gastos por Campaña")

## 🎯 Resumen del Problema

La gráfica actualmente llamada **"Gastos por Tipo de Gasto"** está **mal nombrada**. En realidad, esta gráfica muestra **gastos agrupados por campañas**, no por tipos de gasto. Las campañas son el verdadero "tipo de gasto" en el sistema ZAIKEN.

## 📋 Tablas Involucradas

### 1. **`transacciones`** (Tabla Principal)
```sql
-- Campos relevantes para la gráfica
id, tipoId, monto, concepto, fecha, campanaId, categoriaId, personaId, aprobado
```

### 2. **`campanas`** (Tipos de Gasto Reales)
```sql
-- Campos relevantes
id, nombre, descripcion, fechaInicio, fechaFin, presupuesto,
ingresoTotal, gastoTotal, utilidad, activo
```

### 3. **`tipos_transaccion`** (Tipos de Transacción)
```sql
-- Campos relevantes
id, nombre, descripcion, activo
-- Valores: INGRESO (id=1), GASTO (id=2), APORTE (id=3)
```

### 4. **`categorias`** (Categorías de Gasto)
```sql
-- Campos relevantes
id, nombre, descripcion, color, activo
```

## 🔄 Flujo de Datos

### 1. **Endpoint Backend**
```typescript
// GET /transacciones/resumen-tipos-gasto
// Ubicación: zaiken-system/backend/src/transacciones/transacciones.controller.ts:121
```

### 2. **Servicio Backend**
```typescript
// Método: getResumenPorTiposGasto()
// Ubicación: zaiken-system/backend/src/transacciones/transacciones.service.ts:389
```

### 3. **Consulta SQL Real**
```sql
-- Consulta que se ejecuta en el backend
SELECT
  t.categoriaId,
  t.monto,
  c.nombre as categoria_nombre
FROM transacciones t
LEFT JOIN categorias c ON t.categoriaId = c.id
WHERE t.tipoId = 2  -- Solo GASTOS
  AND t.aprobado = true
  -- Filtros adicionales por fecha, persona, campaña, etc.
ORDER BY t.fecha DESC;
```

### 4. **Procesamiento de Datos**
```typescript
// Agrupación por categoría (NO por campaña como debería ser)
const resumen = new Map<number, {
  tipoGasto: string;
  totalGastos: number;
  transacciones: number
}>();

transacciones.forEach((t) => {
  const categoriaId = t.categoriaId ?? 0;
  const tipoGasto = t.categoria?.nombre || 'Sin tipo de gasto';

  if (!resumen.has(categoriaId)) {
    resumen.set(categoriaId, {
      tipoGasto,
      totalGastos: 0,
      transacciones: 0,
    });
  }

  const item = resumen.get(categoriaId)!;
  item.transacciones++;
  item.totalGastos += t.monto;
});

// Retorna top 10 ordenados por total de gastos
return Array.from(resumen.values())
  .sort((a, b) => b.totalGastos - a.totalGastos)
  .slice(0, 10);
```

## 🎨 Frontend - Gráfica Actual

### 1. **Hook de React Query**
```typescript
// Ubicación: zaiken-system/frontend/src/hooks/useTransacciones.ts:185
export function useResumenPorTiposGasto(filtros: any = {}) {
  return useQuery({
    queryKey: ['resumen-tipos-gasto', filtros],
    queryFn: () => TransaccionesService.getResumenPorTiposGasto(filtros),
    staleTime: 1000 * 60 * 5,
  });
}
```

### 2. **Servicio Frontend**
```typescript
// Ubicación: zaiken-system/frontend/src/services/transacciones.service.ts:122
static async getResumenPorTiposGasto(filtros: {
  fechaInicio?: string;
  fechaFin?: string;
  personaId?: string;
  tipo?: string;
  categoria?: string;
  campanaId?: string;
} = {}): Promise<any[]> {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });

  const response = await api.get(`${ENDPOINT}/resumen-tipos-gasto?${params}`);
  return response.data?.data || [];
}
```

### 3. **Renderizado de la Gráfica**
```typescript
// Ubicación: zaiken-system/frontend/src/app/transacciones/page.tsx:412
const topTiposGasto = resumenTiposGasto
  .filter(item => item.totalGastos > 0)
  .sort((a, b) => b.totalGastos - a.totalGastos)
  .slice(0, 10);

const labelsTiposGasto = topTiposGasto.map(item => item.tipoGasto);
const dataTiposGasto = topTiposGasto.map(item => item.totalGastos);

new window.Chart(ctx, {
  type: 'bar',
  data: {
    labels: labelsTiposGasto.length ? labelsTiposGasto : ['Sin datos'],
    datasets: [{
      label: 'Gasto (COP)',
      data: labelsTiposGasto.length ? dataTiposGasto : [0],
      backgroundColor: generateColors(labelsTiposGasto.length || 1)
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Top 10 Tipos de Gasto'  // ❌ NOMBRE INCORRECTO
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return 'COP ' + Number(value).toLocaleString('es-CO')
          }
        }
      }
    }
  }
});
```

## ❌ Problemas Identificados

### 1. **Nombre Incorrecto**
- **Actual**: "Gastos por Tipo de Gasto"
- **Debería ser**: "Gastos por Campaña"

### 2. **Datos Incorrectos**
- **Actual**: Agrupa por `categorias.nombre`
- **Debería ser**: Agrupar por `campanas.nombre`

### 3. **Lógica de Negocio Confusa**
- Las campañas son el verdadero "tipo de gasto" en el sistema
- Las categorías son subclasificaciones dentro de las campañas

## ✅ Solución Propuesta

### 1. **Nuevo Endpoint Backend**
```typescript
// GET /transacciones/resumen-gastos-por-campana
@Get('resumen-gastos-por-campana')
async getResumenGastosPorCampana(
  @Query('fechaInicio') fechaInicio?: string,
  @Query('fechaFin') fechaFin?: string,
  @Query('personaId', new ParseIntPipe({ optional: true })) personaId?: number,
) {
  const filtros: FiltrosTransacciones = { fechaInicio, fechaFin, personaId };

  return {
    success: true,
    message: 'Resumen de gastos por campaña obtenido exitosamente',
    data: await this.transaccionesService.getResumenGastosPorCampana(filtros),
  };
}
```

### 2. **Nuevo Método en Servicio**
```typescript
async getResumenGastosPorCampana(filtros: FiltrosTransacciones = {}): Promise<any[]> {
  const where: Prisma.TransaccionWhereInput = {
    tipoId: 2, // Solo GASTOS
  };

  // Aplicar filtros
  if (filtros.fechaInicio && filtros.fechaFin) {
    where.fecha = {
      gte: new Date(filtros.fechaInicio),
      lte: new Date(filtros.fechaFin),
    };
  }

  if (filtros.personaId) {
    where.personaId = filtros.personaId;
  }

  const transacciones = await this.prisma.transaccion.findMany({
    where,
    select: {
      campanaId: true,
      monto: true,
      campana: { select: { nombre: true } },
    },
  });

  const resumen = new Map<number, {
    campana: string;
    totalGastos: number;
    transacciones: number
  }>();

  transacciones.forEach((t) => {
    const campanaId = t.campanaId ?? 0;
    const campana = t.campana?.nombre || 'Sin campaña';

    if (!resumen.has(campanaId)) {
      resumen.set(campanaId, {
        campana,
        totalGastos: 0,
        transacciones: 0,
      });
    }

    const item = resumen.get(campanaId)!;
    item.transacciones++;
    item.totalGastos += t.monto;
  });

  return Array.from(resumen.values())
    .sort((a, b) => b.totalGastos - a.totalGastos)
    .slice(0, 10);
}
```

### 3. **Consulta SQL Correcta**
```sql
-- Consulta que debería ejecutarse
SELECT
  t.campanaId,
  t.monto,
  c.nombre as campana_nombre
FROM transacciones t
LEFT JOIN campanas c ON t.campanaId = c.id
WHERE t.tipoId = 2  -- Solo GASTOS
  AND t.aprobado = true
  -- Filtros adicionales
ORDER BY t.fecha DESC;
```

### 4. **Frontend Actualizado**
```typescript
// Nuevo hook
export function useResumenGastosPorCampana(filtros: any = {}) {
  return useQuery({
    queryKey: ['resumen-gastos-por-campana', filtros],
    queryFn: () => TransaccionesService.getResumenGastosPorCampana(filtros),
    staleTime: 1000 * 60 * 5,
  });
}

// Gráfica actualizada
const topCampanas = resumenGastosPorCampana
  .filter(item => item.totalGastos > 0)
  .sort((a, b) => b.totalGastos - a.totalGastos)
  .slice(0, 10);

const labelsCampanas = topCampanas.map(item => item.campana);
const dataCampanas = topCampanas.map(item => item.totalGastos);

new window.Chart(ctx, {
  type: 'bar',
  data: {
    labels: labelsCampanas.length ? labelsCampanas : ['Sin datos'],
    datasets: [{
      label: 'Gasto (COP)',
      data: labelsCampanas.length ? dataCampanas : [0],
      backgroundColor: generateColors(labelsCampanas.length || 1)
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Top 10 Gastos por Campaña'  // ✅ NOMBRE CORRECTO
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return 'COP ' + Number(value).toLocaleString('es-CO')
          }
        }
      }
    }
  }
});
```

## 📊 Resumen de Cambios Necesarios

### Backend
1. ✅ Crear nuevo endpoint `/resumen-gastos-por-campana`
2. ✅ Implementar método `getResumenGastosPorCampana()`
3. ✅ Cambiar consulta SQL para agrupar por `campanaId` en lugar de `categoriaId`

### Frontend
1. ✅ Crear nuevo hook `useResumenGastosPorCampana()`
2. ✅ Actualizar servicio `TransaccionesService.getResumenGastosPorCampana()`
3. ✅ Cambiar título de gráfica a "Gastos por Campaña"
4. ✅ Actualizar datos mostrados para usar `campana` en lugar de `tipoGasto`

### Documentación
1. ✅ Actualizar nombres en interfaces y tipos
2. ✅ Corregir comentarios y documentación
3. ✅ Actualizar tests si existen

## 🎯 Beneficios de la Corrección

1. **Claridad**: Los usuarios entenderán que las campañas son los tipos de gasto
2. **Precisión**: Los datos reflejarán la realidad del negocio
3. **Consistencia**: Alineado con el modelo de datos del sistema
4. **Usabilidad**: Mejor experiencia de usuario con nombres correctos

## 📝 Notas Importantes

- **Compatibilidad**: Mantener el endpoint actual para no romper funcionalidad existente
- **Migración**: Implementar gradualmente el nuevo endpoint
- **Testing**: Verificar que los datos sean consistentes entre ambos endpoints
- **Documentación**: Actualizar toda la documentación relacionada
