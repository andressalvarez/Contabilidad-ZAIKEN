# 🚀 ZAIKEN SYSTEM - Sistema de Gestión Financiera y de Proyectos

[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://www.docker.com/)
[![NestJS](https://img.shields.io/badge/NestJS-Backend-red?logo=nestjs)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-Frontend-black?logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue?logo=postgresql)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Language-blue?logo=typescript)](https://www.typescriptlang.org/)

## 📋 Descripción

**Zaiken System** es una aplicación completa de gestión financiera y de proyectos diseñada para negocios modernos. El sistema incluye gestión de transacciones, análisis de gastos, distribución de utilidades, y visualización de datos con gráficos interactivos.

### 🎯 Características Principales

- ✅ **API REST Robusta** - Backend con NestJS y TypeScript
- ✅ **Frontend Moderno** - Next.js con React y Tailwind CSS
- ✅ **Base de Datos Escalable** - PostgreSQL con Prisma ORM
- ✅ **Docker Ready** - Contenedores optimizados para producción
- ✅ **Gráficos Interactivos** - Dashboard con Chart.js
- ✅ **Gestión de Transacciones** - Ingresos, gastos y aportes
- ✅ **Análisis VS Categorías** - Visualización avanzada de datos
- ✅ **Sistema de Roles** - Gestión de permisos y participación
- ✅ **Distribución de Utilidades** - Cálculo automático
- ✅ **Exportación de Datos** - CSV, JSON, y reportes

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   PostgreSQL    │
│   (Next.js)     │◄──►│   (NestJS)      │◄──►│   (Database)    │
│   Port: 3000    │    │   Port: 3004    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 📁 Estructura del Proyecto

```
zaiken-system/
├── 📁 backend/                    # API REST con NestJS
│   ├── 📁 src/
│   │   ├── 📁 transacciones/     # Gestión de transacciones
│   │   ├── 📁 categorias/        # Gestión de categorías
│   │   ├── 📁 personas/          # Gestión de personas
│   │   ├── 📁 roles/             # Gestión de roles
│   │   ├── 📁 campanas/          # Gestión de campañas
│   │   ├── 📁 vs-categorias/     # Análisis VS Categorías
│   │   └── 📁 distribucion-*/    # Distribución de utilidades
│   ├── 📁 prisma/                # Esquema y migraciones DB
│   ├── 🐳 Dockerfile             # Contenedor Backend
│   └── 📄 package.json
├── 📁 frontend/                   # Aplicación Next.js
│   ├── 📁 src/
│   │   ├── 📁 app/               # Páginas de la aplicación
│   │   ├── 📁 components/        # Componentes React
│   │   ├── 📁 hooks/             # Custom hooks
│   │   ├── 📁 services/          # Servicios API
│   │   └── 📁 types/             # Tipos TypeScript
│   ├── 🐳 Dockerfile             # Contenedor Frontend
│   └── 📄 package.json
├── 📁 docs/                       # Documentación
├── 🐳 docker-compose.yml         # Orquestación Docker
├── 🚀 deploy.sh                   # Script de despliegue
├── 📚 README_DEPLOYMENT.md        # Guía de despliegue
└── 📄 README.md                   # Este archivo
```

## 🚀 Inicio Rápido

### Prerrequisitos

- **Docker** (versión 20.10+)
- **Docker Compose** (versión 2.0+)
- **Git** (para clonar el repositorio)
- **4GB RAM** mínimo (recomendado 8GB)
- **10GB** espacio en disco

### Despliegue Automático (Recomendado)

```bash
# 1. Clonar el repositorio
git clone https://github.com/andressalvarez/Contabilidad-ZAIKEN.git
cd Contabilidad-ZAIKEN

# 2. Ejecutar despliegue automático
./deploy.sh
```

El script automáticamente:
- ✅ Verifica dependencias
- ✅ Crea directorios necesarios
- ✅ Configura variables de entorno
- ✅ Construye imágenes Docker
- ✅ Inicia todos los servicios
- ✅ Verifica la salud de cada servicio

### Despliegue Manual

```bash
# 1. Configurar variables de entorno
cp .env.example .env

# 2. Crear directorios necesarios
mkdir -p data/postgres backend/logs nginx/ssl

# 3. Construir e iniciar servicios
docker-compose up -d

# 4. Verificar estado
docker-compose ps
```

## 📊 Funcionalidades del Sistema

### 🏠 Dashboard Principal
- **KPIs en tiempo real** - Ingresos, gastos, balance
- **Gráficos interactivos** - Chart.js con filtros
- **Análisis temporal** - Tendencias por fecha
- **Estado del sistema** - Health checks

### 💰 Gestión de Transacciones
- **CRUD completo** - Crear, leer, actualizar, eliminar
- **Filtros avanzados** - Por tipo, categoría, fecha, persona
- **Aprobación de gastos** - Workflow de aprobación
- **Exportación** - CSV, JSON, reportes

### 📈 Análisis VS Categorías
- **Visualización avanzada** - Gráficos drill-down
- **Agrupación inteligente** - Categorías y grupos
- **Filtros por tipo** - GASTO, INGRESO, APORTE
- **Ignorar tipo automático** - Cuando no hay datos

### 👥 Gestión de Personas y Roles
- **Perfiles completos** - Información detallada
- **Sistema de roles** - Porcentajes de participación
- **Valor por hora** - Configuración individual
- **Registro de horas** - Tracking de tiempo

### 🎯 Gestión de Campañas
- **Proyectos completos** - Presupuesto y seguimiento
- **Análisis de rentabilidad** - ROI por campaña
- **Distribución de utilidades** - Cálculo automático
- **Reportes detallados** - Métricas y KPIs

## 🔧 Configuración y Personalización

### Variables de Entorno

```bash
# Base de datos
DATABASE_URL=postgresql://zaiken_user:password@postgres:5432/zaiken_db

# JWT
JWT_SECRET=tu_jwt_secret_muy_seguro

# CORS
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000

# Puerto
PORT=3004

# Entorno
NODE_ENV=production
```

### Personalización de Estilos

```css
/* Frontend - Tailwind CSS */
/* Modificar en frontend/src/app/globals.css */
```

### Extensión de Funcionalidades

```typescript
// Backend - Nuevos endpoints
// Crear en backend/src/nuevo-modulo/

// Frontend - Nuevos componentes
// Crear en frontend/src/components/
```

## 📈 Monitoreo y Logs

### Health Checks
- **Backend**: `http://localhost:3004/api/v1/health`
- **Frontend**: `http://localhost:3000/api/health`
- **PostgreSQL**: `docker-compose exec postgres pg_isready`

### Comandos de Monitoreo

```bash
# Ver logs en tiempo real
docker-compose logs -f

# Logs específicos
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Estado de servicios
docker-compose ps

# Uso de recursos
docker stats
```

## 🔍 Comandos Útiles

### Gestión de Servicios
```bash
# Iniciar servicios
docker-compose up -d

# Parar servicios
docker-compose down

# Reiniciar servicios
docker-compose restart

# Reconstruir imágenes
docker-compose build --no-cache
```

### Gestión de Base de Datos
```bash
# Acceder a PostgreSQL
docker-compose exec postgres psql -U zaiken_user -d zaiken_db

# Ejecutar migraciones
docker-compose exec backend npx prisma migrate deploy

# Generar Prisma client
docker-compose exec backend npx prisma generate

# Ver estado de migraciones
docker-compose exec backend npx prisma migrate status
```

### Desarrollo Local
```bash
# Backend (desarrollo)
cd backend && npm run start:dev

# Frontend (desarrollo)
cd frontend && npm run dev

# Instalar dependencias
npm install
```

## 🚨 Troubleshooting

### Problemas Comunes

#### 1. Puerto ya en uso
```bash
# Verificar puertos ocupados
netstat -tulpn | grep :3000
netstat -tulpn | grep :3004

# Cambiar puertos en docker-compose.yml
```

#### 2. Base de datos no conecta
```bash
# Verificar estado de PostgreSQL
docker-compose exec postgres pg_isready

# Verificar variables de entorno
docker-compose exec backend env | grep DATABASE
```

#### 3. Frontend no carga
```bash
# Verificar logs del frontend
docker-compose logs frontend

# Verificar conectividad con backend
curl http://localhost:3004/api/v1/health
```

#### 4. Permisos de archivos
```bash
# Corregir permisos
sudo chown -R $USER:$USER data/
chmod -R 755 data/
```

## 🔄 Actualizaciones

### Actualizar Aplicación
```bash
# Obtener cambios
git pull origin main

# Reconstruir y reiniciar
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Actualizar Base de Datos
```bash
# Ejecutar migraciones
docker-compose exec backend npx prisma migrate deploy

# Verificar estado
docker-compose exec backend npx prisma migrate status
```

## 🔒 Seguridad

### Configuración de Seguridad
- **Usuarios no-root** en contenedores
- **Variables de entorno** para secretos
- **Health checks** para monitoreo
- **Firewall** configurado
- **SSL/TLS** para producción

### Variables Críticas a Cambiar
```bash
# Cambiar en producción
JWT_SECRET=tu_jwt_secret_muy_seguro_2024
DATABASE_PASSWORD=tu_password_muy_seguro_2024
```

## 📚 Documentación Adicional

- [📖 Guía de Despliegue](README_DEPLOYMENT.md) - Instrucciones detalladas
- [🔗 API Documentation](http://localhost:3004/api/v1) - Documentación de endpoints
- [📊 Prisma Documentation](https://www.prisma.io/docs) - ORM y base de datos
- [⚡ NestJS Documentation](https://docs.nestjs.com) - Framework backend
- [🚀 Next.js Documentation](https://nextjs.org/docs) - Framework frontend

## 🤝 Contribución

### Guías de Contribución
1. **Fork** el repositorio
2. **Crear** una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. **Commit** tus cambios (`git commit -m 'Add nueva funcionalidad'`)
4. **Push** a la rama (`git push origin feature/nueva-funcionalidad`)
5. **Crear** un Pull Request

### Estándares de Código
- **TypeScript** para todo el código
- **ESLint** y **Prettier** para formato
- **Commits semánticos** (feat:, fix:, docs:, etc.)
- **Documentación** en funciones y módulos

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 Soporte

### Canales de Soporte
- **Issues**: [GitHub Issues](https://github.com/andressalvarez/Contabilidad-ZAIKEN/issues)
- **Documentación**: [README_DEPLOYMENT.md](README_DEPLOYMENT.md)
- **Logs**: `docker-compose logs`

### Checklist de Solución de Problemas
1. ✅ Verificar logs: `docker-compose logs`
2. ✅ Revisar health checks: Verificar endpoints de salud
3. ✅ Verificar recursos: `docker stats`
4. ✅ Reiniciar servicios: `docker-compose restart`

## 🎯 Roadmap

### Próximas Funcionalidades
- [ ] **Autenticación OAuth** - Google, GitHub
- [ ] **Notificaciones push** - WebSockets
- [ ] **Reportes avanzados** - PDF, Excel
- [ ] **Integración con bancos** - APIs bancarias
- [ ] **App móvil** - React Native
- [ ] **Machine Learning** - Predicciones financieras

### Mejoras Técnicas
- [ ] **Microservicios** - Arquitectura distribuida
- [ ] **Cache Redis** - Optimización de rendimiento
- [ ] **CI/CD Pipeline** - GitHub Actions
- [ ] **Monitoreo APM** - New Relic, DataDog
- [ ] **Backup automático** - S3, Google Cloud

---

**Zaiken System** - Sistema de gestión financiera moderno, escalable y robusto para negocios del siglo XXI.

**Desarrollado con ❤️ usando tecnologías modernas y mejores prácticas de desarrollo.**
