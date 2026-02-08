# Cómo Agregar Nuevas Tablas al Script de Importación

Este documento explica cómo agregar nuevas tablas al proceso de importación de datos del backup.

## Ubicación del Archivo de Configuración

El script principal está en: `zaiken-system/backend/scripts/import-backup-0802.sh`

La configuración de tablas está en la sección **CONFIGURATION SECTION** al inicio del archivo.

## Pasos para Agregar una Nueva Tabla

### Paso 1: Identificar las Dependencias

Antes de agregar una tabla, necesitas saber:
- ¿De qué otras tablas depende? (foreign keys)
- ¿Qué otras tablas dependen de ella?

**Ejemplo:**
- Si `nueva_tabla` tiene una foreign key a `usuarios`, entonces `usuarios` debe importarse ANTES que `nueva_tabla`
- Si `otra_tabla` tiene una foreign key a `nueva_tabla`, entonces `nueva_tabla` debe importarse ANTES que `otra_tabla`

### Paso 2: Agregar la Tabla al Array IMPORT_ORDER

Abre el archivo `import-backup-0802.sh` y encuentra la sección:

```bash
IMPORT_ORDER=(
    "negocios"
    "roles"
    # ... más tablas
)
```

Agrega el nombre de tu nueva tabla en la posición correcta según sus dependencias.

**Ejemplo 1: Tabla sin dependencias (agregar al inicio)**
```bash
IMPORT_ORDER=(
    "mi_nueva_tabla"    # ← Nueva tabla sin dependencias
    "negocios"
    "roles"
    # ... resto de tablas
)
```

**Ejemplo 2: Tabla que depende de usuarios (agregar después de usuarios)**
```bash
IMPORT_ORDER=(
    "negocios"
    "roles"
    "usuarios"
    "mi_nueva_tabla"    # ← Nueva tabla que depende de usuarios
    "usuarios_roles"
    # ... resto de tablas
)
```

**Ejemplo 3: Tabla que depende de múltiples tablas**
```bash
IMPORT_ORDER=(
    "negocios"
    "roles"
    "usuarios"
    "categorias"
    "campanas"
    "mi_nueva_tabla"    # ← Nueva tabla que depende de usuarios, categorias y campanas
    # ... resto de tablas
)
```

### Paso 3: Crear el Archivo SQL del Backup

Asegúrate de que existe el archivo SQL en el directorio del backup:
- Ruta: `BACKUPPROD 0802/mi_nueva_tabla.sql`
- El archivo debe contener los comandos `INSERT` para los datos

**Formato del archivo SQL:**
```sql
INSERT INTO "mi_nueva_tabla" ("id", "campo1", "campo2", ...) VALUES 
(1, 'valor1', 'valor2', ...),
(2, 'valor3', 'valor4', ...);
```

### Paso 4: Verificar el Orden

El orden de truncado se genera automáticamente (es el inverso del orden de importación).

**Regla general:**
- **Importación**: De tablas padre a tablas hijo (sin dependencias → con dependencias)
- **Truncado**: De tablas hijo a tablas padre (con dependencias → sin dependencias)

## Ejemplos Completos

### Ejemplo 1: Agregar Tabla "productos" que depende de "categorias"

```bash
# En import-backup-0802.sh, modificar IMPORT_ORDER:
IMPORT_ORDER=(
    "negocios"
    "roles"
    "categorias"
    "productos"          # ← Nueva tabla (depende de categorias)
    "campanas"
    # ... resto
)
```

**Archivo SQL necesario:** `BACKUPPROD 0802/productos.sql`

### Ejemplo 2: Agregar Tabla "ventas" que depende de "usuarios" y "productos"

```bash
IMPORT_ORDER=(
    "negocios"
    "roles"
    "usuarios"
    "categorias"
    "productos"
    "ventas"            # ← Nueva tabla (depende de usuarios y productos)
    "transacciones"
    # ... resto
)
```

**Archivo SQL necesario:** `BACKUPPROD 0802/ventas.sql`

### Ejemplo 3: Agregar Tabla "configuraciones" sin dependencias

```bash
IMPORT_ORDER=(
    "configuraciones"   # ← Nueva tabla sin dependencias (al inicio)
    "negocios"
    "roles"
    # ... resto
)
```

**Archivo SQL necesario:** `BACKUPPROD 0802/configuraciones.sql`

## Verificación

Después de agregar una nueva tabla:

1. **Verifica que el archivo SQL existe:**
   ```bash
   ls "BACKUPPROD 0802/mi_nueva_tabla.sql"
   ```

2. **Verifica el orden de dependencias:**
   - Revisa el schema de Prisma para ver las foreign keys
   - Asegúrate de que las tablas padre estén antes que las hijas

3. **Prueba el script:**
   ```bash
   docker exec zaiken-postgres sh -c "echo 'yes' | sh /backup-data/import-backup-0802.sh"
   ```

## Notas Importantes

1. **El nombre de la tabla debe coincidir exactamente** con el nombre en la base de datos (case-sensitive en PostgreSQL)

2. **El nombre del archivo SQL** debe ser: `{nombre_tabla}.sql`

3. **El orden es crítico**: Si importas una tabla antes de sus dependencias, obtendrás errores de foreign key

4. **El script valida automáticamente** que todos los archivos SQL existan antes de proceder

5. **El truncado se hace automáticamente** en orden inverso, no necesitas configurarlo

## Troubleshooting

### Error: "File not found"
- Verifica que el archivo SQL existe en `BACKUPPROD 0802/`
- Verifica que el nombre del archivo coincide exactamente con el nombre en el array

### Error: "Foreign key constraint violation"
- El orden de importación es incorrecto
- Mueve la tabla que falla más adelante en el array IMPORT_ORDER

### Error: "Table does not exist"
- Verifica que la tabla existe en la base de datos
- Verifica que el nombre de la tabla en el array coincide con el nombre real en PostgreSQL

## Estructura del Script

```
┌─────────────────────────────────────┐
│ CONFIGURATION SECTION               │
│ - IMPORT_ORDER array                │ ← MODIFICA AQUÍ
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ Verification                        │
│ - Verifica que todos los .sql       │
│   archivos existen                  │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ Truncate (automático, orden inverso)│
│ - Itera sobre IMPORT_ORDER al revés │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ Import (orden de IMPORT_ORDER)      │
│ - Itera sobre IMPORT_ORDER          │
└─────────────────────────────────────┘
```

## Resumen

Para agregar una nueva tabla:
1. ✅ Agrega el nombre al array `IMPORT_ORDER` en la posición correcta
2. ✅ Crea el archivo SQL en `BACKUPPROD 0802/{nombre_tabla}.sql`
3. ✅ Verifica las dependencias
4. ✅ Prueba el script

¡Eso es todo! El script se encarga del resto automáticamente.

