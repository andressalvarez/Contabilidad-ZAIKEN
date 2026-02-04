# Migración Multi-Tenant - Fase 3

## ¿Qué hace esta migración?

Esta migración transforma el sistema en multi-tenant, permitiendo que múltiples negocios usen la misma base de datos de forma aislada.

### Cambios principales:

1. **Crea tabla `negocios`**: Almacena información de cada negocio
2. **Agrega `negocioId`** a todas las tablas: Usuarios, Personas, Categorías, Campañas, Transacciones, etc.
3. **Crea un negocio por defecto** (ID=1) y asigna todos los datos existentes a ese negocio
4. **Agrega campos para Timer** en `registro_horas`:
   - `aprobadoPor`, `fechaAprobacion`
   - `rechazado`, `motivoRechazo`
   - `origen` (MANUAL o TIMER)
   - `timerInicio`, `timerFin`, `estado`
5. **Actualiza constraints**: Los nombres únicos ahora son únicos por negocio
6. **Agrega indexes**: Para mejorar performance en consultas multi-tenant

## ⚠️ IMPORTANTE: Cómo aplicar esta migración

### Opción 1: Aplicar con Prisma (RECOMENDADO)

```bash
cd backend

# 1. Hacer backup ANTES de migrar
npm run backup

# 2. Aplicar migración
npx prisma migrate deploy

# 3. Validar que todo salió bien
npm run validate:migration
```

### Opción 2: Aplicar manualmente (solo si Prisma falla)

```bash
cd backend

# 1. Backup
npm run backup

# 2. Aplicar SQL directamente
psql $DATABASE_URL -f prisma/migrations/20260203000001_add_multi_tenant/migration.sql

# 3. Validar
npm run validate:migration
```

## ¿Qué pasa con mis datos existentes?

**TUS DATOS ESTÁN SEGUROS**. La migración:

1. Crea un negocio llamado "Mi Negocio" con ID=1
2. Asigna TODOS tus datos existentes a ese negocio
3. NO elimina ningún dato
4. NO modifica valores existentes (solo agrega columnas nuevas)

### Verificación post-migración:

```sql
-- Verificar que el negocio fue creado
SELECT * FROM negocios;
-- Deberías ver 1 negocio: "Mi Negocio"

-- Verificar que todos los usuarios tienen negocioId
SELECT COUNT(*) FROM usuarios WHERE "negocioId" IS NULL;
-- Debería ser 0

-- Verificar que todas las transacciones tienen negocioId
SELECT COUNT(*) FROM transacciones WHERE "negocioId" IS NULL;
-- Debería ser 0
```

## ¿Qué hacer si algo sale mal?

### Opción 1: Restaurar desde backup

```bash
cd backend
npm run rollback
```

### Opción 2: Rollback SQL manual

```bash
psql $DATABASE_URL -f backend/scripts/rollback-multitenant.sql
```

## Después de la migración

### 1. Regenerar el cliente de Prisma

```bash
cd backend
npx prisma generate
```

### 2. Actualizar el código del backend

Ver [FASE_4_AUTH.md] para los cambios necesarios en:
- JWT payload (incluir negocioId)
- Servicios (filtrar por negocioId)
- Guards (verificar permisos por negocio)

### 3. Rebuild y restart

```bash
cd backend
npm run build
npm run deploy
```

## Notas técnicas

### Indexes creados:

- `usuarios_negocioId_idx`: Para filtrar usuarios por negocio
- `usuarios_negocioId_rol_idx`: Para filtrar usuarios por negocio y rol
- `registro_horas_negocioId_aprobado_idx`: Para consultas de horas aprobadas
- Y más...

### Foreign Keys:

Todos los `negocioId` tienen foreign keys con:
- `ON DELETE RESTRICT`: No se puede eliminar un negocio con datos
- `ON UPDATE CASCADE`: Si se actualiza el ID del negocio, se actualiza en cascada

### Unique Constraints:

- `personas`: nombre único POR NEGOCIO (antes era global)
- `categorias`: nombre único POR NEGOCIO
- `campanas`: nombre único POR NEGOCIO
- `vs_configuraciones`: nombre único POR NEGOCIO

Esto permite que diferentes negocios tengan personas/categorías con el mismo nombre sin conflicto.

## Testing

Después de aplicar la migración, verifica:

- ✅ Frontend carga correctamente
- ✅ Login funciona
- ✅ Puedes ver transacciones
- ✅ Puedes crear nuevas transacciones
- ✅ Puedes ver personas
- ✅ Puedes ver campañas
- ✅ No hay errores en los logs

## Soporte

Si tienes problemas:
1. Revisa los logs del backend
2. Ejecuta `npm run validate:migration`
3. Si nada funciona, ejecuta `npm run rollback`
