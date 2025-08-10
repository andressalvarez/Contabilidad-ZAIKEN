# 🐘 Migración a PostgreSQL

## 📋 Pasos para migrar de SQLite a PostgreSQL

### 1. **Instalar PostgreSQL en Windows**
```bash
# Opción 1: Descargar desde https://www.postgresql.org/download/windows/
# Opción 2: Usar Chocolatey
choco install postgresql

# Opción 3: Usar el script automático
npm run postgres:setup
```

### 2. **Configurar PostgreSQL**
```bash
# Ejecutar como Administrador
powershell -ExecutionPolicy Bypass -File setup-postgresql.ps1

# O manualmente:
# 1. Iniciar PostgreSQL desde Servicios
# 2. Crear base de datos:
psql -U postgres -h localhost
CREATE DATABASE zaiken_db;
\q
```

### 3. **Migrar los datos**
```bash
# Migración completa
npm run postgres:import

# O paso a paso:
npm run postgres:migrate
npm run import:backup:debug
```

### 4. **Verificar con pgweb**
```bash
# Iniciar pgweb
npm run pgweb

# Abrir en navegador: http://localhost:8081
```

## 🔧 Configuración de Variables de Entorno

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/zaiken_db"
PORT=3004
```

## 📊 Herramientas disponibles

- ✅ **pgweb**: Interfaz web para PostgreSQL (http://localhost:8081)
- ✅ **Prisma Studio**: Interfaz de Prisma (http://localhost:5555)
- ✅ **pgAdmin**: Interfaz oficial de PostgreSQL
- ✅ **DBeaver**: Cliente universal de bases de datos

## 🚀 Scripts disponibles

```bash
npm run postgres:setup      # Configurar PostgreSQL
npm run postgres:migrate    # Generar migración
npm run postgres:import     # Migración + importación completa
npm run pgweb              # Iniciar pgweb
npm run db:studio          # Iniciar Prisma Studio
```

## 📊 Ventajas de PostgreSQL

- ✅ **Escalabilidad**: Maneja grandes volúmenes de datos
- ✅ **Concurrencia**: Múltiples usuarios simultáneos
- ✅ **Integridad**: Mejor manejo de transacciones
- ✅ **Funciones avanzadas**: JSON, arrays, full-text search
- ✅ **Herramientas**: pgweb, pgAdmin, DBeaver, etc.
- ✅ **Producción**: Estándar en la industria

## 🚀 Próximos pasos

1. Instalar PostgreSQL
2. Ejecutar `npm run postgres:setup`
3. Ejecutar `npm run postgres:import`
4. Verificar con `npm run pgweb`
