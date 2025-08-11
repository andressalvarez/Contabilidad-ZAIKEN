# 🚀 ZAIKEN SYSTEM - GUÍA DE DESPLIEGUE

## 📋 Descripción

Zaiken System es una aplicación completa de gestión financiera y de proyectos que incluye:

- **Backend**: API REST con NestJS y PostgreSQL
- **Frontend**: Aplicación web con Next.js y React
- **Base de datos**: PostgreSQL con Prisma ORM
- **Docker**: Contenedores optimizados para producción

## 🏗️ Arquitectura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   PostgreSQL    │
│   (Next.js)     │◄──►│   (NestJS)      │◄──►│   (Database)    │
│   Port: 3000    │    │   Port: 3004    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Requisitos Previos

- **Docker** (versión 20.10+)
- **Docker Compose** (versión 2.0+)
- **Git** (para clonar el repositorio)
- **4GB RAM** mínimo (recomendado 8GB)
- **10GB** espacio en disco

## 🚀 Despliegue Rápido

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd zaiken-system
```

### 2. Ejecutar despliegue automático
```bash
./deploy.sh
```

El script automáticamente:
- ✅ Verifica dependencias
- ✅ Crea directorios necesarios
- ✅ Configura variables de entorno
- ✅ Construye imágenes Docker
- ✅ Inicia todos los servicios
- ✅ Verifica la salud de cada servicio

## 🔧 Despliegue Manual

### 1. Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

### 2. Crear directorios necesarios
```bash
mkdir -p data/postgres
mkdir -p backend/logs
mkdir -p nginx/ssl
```

### 3. Construir e iniciar servicios
```bash
# Construir imágenes
docker-compose build

# Iniciar servicios
docker-compose up -d

# Verificar estado
docker-compose ps
```

## 📊 Verificación del Despliegue

### Endpoints de salud
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3004/api/v1/health
- **PostgreSQL**: `docker-compose exec postgres pg_isready`

### Verificar logs
```bash
# Todos los servicios
docker-compose logs -f

# Servicio específico
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

## 🔍 Comandos Útiles

### Gestión de servicios
```bash
# Iniciar servicios
docker-compose up -d

# Parar servicios
docker-compose down

# Reiniciar servicios
docker-compose restart

# Ver estado
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f
```

### Gestión de base de datos
```bash
# Acceder a PostgreSQL
docker-compose exec postgres psql -U zaiken_user -d zaiken_db

# Ejecutar migraciones
docker-compose exec backend npx prisma migrate deploy

# Generar Prisma client
docker-compose exec backend npx prisma generate
```

### Gestión de contenedores
```bash
# Reconstruir imágenes
docker-compose build --no-cache

# Limpiar recursos no utilizados
docker system prune -a

# Ver uso de recursos
docker stats
```

## 🔒 Configuración de Seguridad

### Variables de entorno críticas
```bash
# Cambiar en producción
JWT_SECRET=tu_jwt_secret_muy_seguro
DATABASE_PASSWORD=tu_password_muy_seguro
```

### Firewall
```bash
# Solo exponer puertos necesarios
# 3000: Frontend
# 3004: Backend API
# 5432: PostgreSQL (solo local)
```

## 📈 Monitoreo y Logs

### Health Checks
- **Backend**: `/api/v1/health`
- **Frontend**: `/api/health`
- **PostgreSQL**: `pg_isready`

### Logs importantes
```bash
# Logs de aplicación
docker-compose logs backend

# Logs de base de datos
docker-compose logs postgres

# Logs de errores
docker-compose logs --tail=100 | grep ERROR
```

## 🚨 Troubleshooting

### Problemas comunes

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

### Actualizar aplicación
```bash
# Obtener cambios
git pull origin main

# Reconstruir y reiniciar
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Actualizar base de datos
```bash
# Ejecutar migraciones
docker-compose exec backend npx prisma migrate deploy

# Verificar estado
docker-compose exec backend npx prisma migrate status
```

## 📚 Documentación Adicional

- [API Documentation](http://localhost:3004/api/v1)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [Next.js Documentation](https://nextjs.org/docs)

## 🆘 Soporte

Si encuentras problemas:

1. **Verificar logs**: `docker-compose logs`
2. **Revisar health checks**: Verificar endpoints de salud
3. **Verificar recursos**: `docker stats`
4. **Reiniciar servicios**: `docker-compose restart`

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver `LICENSE` para más detalles.
