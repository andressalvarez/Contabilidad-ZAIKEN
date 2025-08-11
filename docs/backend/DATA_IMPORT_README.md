# 📊 Sistema de Importación de Datos - Zaiken

Este sistema permite importar datos del backup del sistema anterior, manejando automáticamente las nuevas relaciones de categorías y tipos de transacción.

## 🏗️ Arquitectura del Sistema

### Principios SOLID Implementados

- **Single Responsibility**: Cada clase tiene una responsabilidad específica
- **Open/Closed**: Extensible para nuevos tipos de importación
- **Liskov Substitution**: Las implementaciones son intercambiables
- **Interface Segregation**: Interfaces específicas para cada funcionalidad
- **Dependency Inversion**: Depende de abstracciones, no de implementaciones

### Componentes Principales

```
📁 Sistema de Importación
├── 🔧 Interfaces
│   ├── ILogger - Manejo de logs
│   ├── IDataValidator - Validación de datos
│   ├── IEntityImporter - Importación de entidades
│   └── IDataMapper - Mapeo de datos
├── 🗂️ Mappers
│   ├── CategoryMapper - Mapeo de categorías string → ID
│   └── TipoTransaccionMapper - Mapeo de tipos string → enum
├── 📥 Importadores
│   ├── RolImporter
│   ├── PersonaImporter
│   ├── CampanaImporter
│   ├── TipoTransaccionImporter
│   └── TransaccionImporter
└── 🎯 Servicios
    ├── DataImportService - Coordinador principal
    └── CategoryAnalyzer - Análisis previo
```

## 🚀 Uso del Sistema

### 1. Análisis Previo (Recomendado)

Antes de importar, analiza qué categorías se van a crear/mapear:

```bash
cd zaiken-system/backend
npm run analyze:categories
```

**Con archivo específico:**
```bash
npm run analyze:categories /ruta/al/backup.json
```

### 2. Auditoría previa (opcional)

Genera un reporte JSON/CSV de transacciones que no se importarían y las razones (ej.: `MISSING_CAMPANA`, `INVALID_FECHA`):

```bash
# Desde la raíz del repo
npx --yes --prefix backend ts-node backend/scripts/audit-backup.ts <ruta/al/backup.json>
```

Los archivos se guardan en: `backend/logs/import-audit-<timestamp>.{json,csv}`.

### 3. Importación de Datos

Antes de importar, aplica migraciones (no usar fresh):
```bash
DATABASE_URL="<tu_conexion_postgres>" npm --prefix backend run prisma:migrate:prod
```

Opciones de importación:

- Borrado total (wipe-all) y luego importar:
```bash
DATABASE_URL="<tu_conexion_postgres>" npx --yes --prefix backend ts-node backend/scripts/import-backup.ts <ruta/al/backup.json> --wipe-all
```

- Solo tablas financieras (transacciones, registro de horas, distribución):
```bash
DATABASE_URL="<tu_conexion_postgres>" npx --yes --prefix backend ts-node backend/scripts/import-backup.ts <ruta/al/backup.json> --wipe-tx
```

## 📋 Proceso de Importación

### Orden de Importación (respeta dependencias)

1. **Roles** (sin dependencias)
2. **Personas** (depende de roles)
3. **Campañas** (sin dependencias)
4. **Tipos de Transacción** (extrae tipos únicos del backup)
5. **Transacciones** (depende de tipos, categorías, personas, campañas)

### Mapeo Automático

#### Tipos de Transacción
```typescript
"Gasto"   → "GASTO"
"Ingreso" → "INGRESO"
"Aporte"  → "APORTE"
```

#### Categorías
- **Existentes**: Se vinculan por nombre
- **Nuevas**: Se crean automáticamente
- **Sin categoría**: `categoriaId = null`

### Reglas importantes del importador
- Requiere `campanaId` o `companyId` en cada transacción; si no, se omite (se registrará como `MISSING_CAMPANA`).
- Evita duplicados por `(fecha, concepto, monto)`.
- Crea tipos `GASTO/INGRESO/APORTE` si faltan.

## 🛠️ Características Técnicas

### Validación de Datos

- ✅ Validación de campos requeridos
- ✅ Validación de tipos de datos
- ✅ Validación de referencias foráneas
- ✅ Manejo de errores detallado

### Manejo de Errores

- 🔄 Continuidad: errores individuales no detienen el proceso
- 📝 Logging detallado de errores y warnings
- 📊 Reporte final con estadísticas de importación

### Performance

- 💾 Cache de categorías para evitar consultas repetidas
- 🔄 Upsert para evitar duplicados
- 📦 Procesamiento por lotes eficiente

## 📊 Ejemplo de Reporte de Análisis

```
📊 REPORTE DE ANÁLISIS DE CATEGORÍAS
==================================================
📅 Backup: 2025-07-25T14:32:26.105Z (v1.0)
📝 Total transacciones: 114

🏷️  RESUMEN DE CATEGORÍAS:
------------------------------
✅ Categorías existentes: 3
➕ Categorías nuevas: 8
❌ Sin categoría: 0 transacciones
📊 Total categorías únicas: 11

✅ CATEGORÍAS QUE YA EXISTEN:
------------------------------
   • Publicidad (TikTok)
   • Publicidad (Facebook)
   • Aporte socio

➕ CATEGORÍAS QUE SE CREARÁN:
------------------------------
   • Gastos operativos
   • Infraestructura
   • Productos para contenido/grabación
   • Venta / Ingreso campaña
   • ... y más

🔄 MAPEO DE TIPOS DE TRANSACCIÓN:
------------------------------
   "Gasto" → "GASTO"
   "Ingreso" → "INGRESO"
   "Aporte" → "APORTE"
```

## 🚨 Consideraciones Importantes

### ⚠️ Antes de Importar

1. **Backup de BD**: Siempre haz backup de tu base de datos actual
2. **Análisis previo**: Ejecuta `analyze:categories` para revisar cambios
3. **Verificar entorno**: Asegúrate de estar en el entorno correcto

### ⚙️ Configuración

```bash
# Variable de entorno para BD
DATABASE_URL="file:./dev.db"

# Para producción (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/zaiken_prod"
```

### 🔧 Solución de Problemas

#### Error: "Categoría no encontrada"
```bash
# Verificar que el backup tenga el formato correcto
npm run analyze:categories
```

#### Error: "Tipo de transacción no válido"
```bash
# Los tipos válidos son: "Gasto", "Ingreso", "Aporte"
# Verifica el formato del backup
```

#### Error de conexión a BD
```bash
# Verificar que Prisma esté configurado
npx prisma generate
npx prisma migrate dev
```

## 🔄 Extensibilidad

### Agregar Nuevo Importador

```typescript
class NuevoImporter extends BaseImporter<BackupNuevo, Nuevo> {
  getName(): string {
    return 'Nuevos';
  }

  protected async importSingle(data: BackupNuevo): Promise<Nuevo> {
    return await this.prisma.nuevo.upsert({
      where: { campo: data.campo },
      update: { /* datos */ },
      create: { /* datos */ }
    });
  }
}
```

### Agregar Nuevo Validador

```typescript
class NuevoValidator extends BaseValidator<BackupNuevo> {
  protected performValidation(data: BackupNuevo): boolean {
    if (!data.campoRequerido) this.addError('Campo requerido');
    return this.errors.length === 0;
  }
}
```

## 📈 Estadísticas de Importación

Al final de cada importación, se muestra:

- ✅ **Registros importados** por tipo
- ⚠️ **Registros omitidos** con razones
- ❌ **Errores encontrados** con detalles
- 📊 **Tiempo total** de procesamiento

## 🤝 Contribución

Para agregar nuevas funcionalidades:

1. Extiende las interfaces base
2. Implementa validadores específicos
3. Crea importadores siguiendo el patrón
4. Agrega al pipeline de importación
5. Documenta los cambios

---

**Desarrollado siguiendo principios SOLID y Clean Architecture** 🏗️
