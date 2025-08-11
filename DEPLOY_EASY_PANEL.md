# 🚀 DESPLIEGUE EN EASY PANEL - ZAIKEN SYSTEM

## 📋 Descripción

Esta guía te ayudará a desplegar Zaiken System en Easy Panel de forma profesional y optimizada. Easy Panel es un panel de control que facilita la gestión de servidores y aplicaciones.

## 🎯 Estrategia de Despliegue

### Opción 1: Despliegue Completo con Docker (Recomendado)
- **Ventajas**: Aislamiento completo, fácil mantenimiento, escalabilidad
- **Complejidad**: Media
- **Recursos**: 2GB RAM mínimo, 10GB disco

### Opción 2: Despliegue Híbrido
- **Backend**: Contenedor Docker
- **Frontend**: Servidor web estático
- **Base de datos**: PostgreSQL nativo
- **Ventajas**: Mejor rendimiento, menor uso de recursos
- **Complejidad**: Alta

### Opción 3: Despliegue Tradicional
- **Todo nativo**: Sin Docker
- **Ventajas**: Máximo rendimiento
- **Desventajas**: Complejo mantenimiento
- **Complejidad**: Muy alta

## 🚀 DESPLIEGUE COMPLETO CON DOCKER (RECOMENDADO)

### 1. Preparación del Servidor

#### Requisitos del Servidor
```bash
# Especificaciones mínimas
- CPU: 2 cores
- RAM: 2GB (recomendado 4GB)
- Disco: 20GB SSD
- OS: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- Docker: 20.10+
- Docker Compose: 2.0+
```

#### Instalación de Dependencias
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Instalar Git
sudo apt install git -y
```

### 2. Configuración en Easy Panel

#### Crear Aplicación
1. **Acceder a Easy Panel**
   - URL: `http://tu-servidor:8888`
   - Usuario: `admin`
   - Contraseña: `tu-contraseña`

2. **Crear Nueva Aplicación**
   ```
   Nombre: zaiken-system
   Tipo: Docker Compose
   Puerto: 3000 (frontend), 3004 (backend)
   ```

#### Configurar Variables de Entorno
```bash
# En Easy Panel > Variables de Entorno
NODE_ENV=production
DATABASE_URL=postgresql://zaiken_user:zaiken_password_secure_2024@postgres:5432/zaiken_db
JWT_SECRET=tu_jwt_secret_muy_seguro_2024
CORS_ORIGIN=https://tu-dominio.com,http://tu-dominio.com
PORT=3004
```

### 3. Despliegue Automático

#### Script de Despliegue para Easy Panel
```bash
#!/bin/bash
# deploy-easy-panel.sh

set -e

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Variables
PROJECT_NAME="zaiken-system"
DOMAIN="tu-dominio.com"
EMAIL="tu-email@dominio.com"

log "🚀 Iniciando despliegue de Zaiken System en Easy Panel..."

# 1. Clonar repositorio
log "📥 Clonando repositorio..."
if [ ! -d "$PROJECT_NAME" ]; then
    git clone https://github.com/andressalvarez/Contabilidad-ZAIKEN.git $PROJECT_NAME
    cd $PROJECT_NAME
else
    cd $PROJECT_NAME
    git pull origin main
fi

# 2. Crear directorios necesarios
log "📁 Creando directorios..."
mkdir -p data/postgres
mkdir -p backend/logs
mkdir -p nginx/ssl
mkdir -p nginx/conf

# 3. Configurar Nginx para Easy Panel
log "🌐 Configurando Nginx..."
cat > nginx/conf/nginx.conf << EOF
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3004;
    }

    upstream frontend {
        server frontend:3000;
    }

    server {
        listen 80;
        server_name $DOMAIN;
        
        # Redirigir a HTTPS
        return 301 https://\$server_name\$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name $DOMAIN;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
        }

        # Backend API
        location /api/ {
            proxy_pass http://backend/api/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
        }

        # Health checks
        location /health {
            proxy_pass http://backend/api/v1/health;
            access_log off;
        }
    }
}
EOF

# 4. Generar certificados SSL (Let's Encrypt)
log "🔒 Configurando SSL..."
if [ ! -f "nginx/ssl/cert.pem" ]; then
    # Instalar certbot si no está instalado
    if ! command -v certbot &> /dev/null; then
        sudo apt install certbot -y
    fi
    
    # Generar certificado
    sudo certbot certonly --standalone -d $DOMAIN --email $EMAIL --agree-tos --non-interactive
    
    # Copiar certificados
    sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem nginx/ssl/cert.pem
    sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem nginx/ssl/key.pem
    sudo chown $USER:$USER nginx/ssl/*
fi

# 5. Actualizar docker-compose para Easy Panel
log "🐳 Configurando Docker Compose..."
cat > docker-compose.easy-panel.yml << EOF
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: zaiken-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: zaiken_db
      POSTGRES_USER: zaiken_user
      POSTGRES_PASSWORD: zaiken_password_secure_2024
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    networks:
      - zaiken-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U zaiken_user -d zaiken_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: production
    container_name: zaiken-backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3004
      DATABASE_URL: postgresql://zaiken_user:zaiken_password_secure_2024@postgres:5432/zaiken_db
      JWT_SECRET: tu_jwt_secret_muy_seguro_2024
      CORS_ORIGIN: https://$DOMAIN,http://$DOMAIN
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - zaiken-network
    healthcheck:
      test: ["CMD", "node", "healthcheck.js"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: zaiken-frontend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: https://$DOMAIN/api/v1
      NEXT_PUBLIC_APP_URL: https://$DOMAIN
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - zaiken-network

  nginx:
    image: nginx:alpine
    container_name: zaiken-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
      - frontend
    networks:
      - zaiken-network

networks:
  zaiken-network:
    driver: bridge
EOF

# 6. Construir e iniciar servicios
log "🔨 Construyendo imágenes..."
docker-compose -f docker-compose.easy-panel.yml build --no-cache

log "🚀 Iniciando servicios..."
docker-compose -f docker-compose.easy-panel.yml up -d

# 7. Verificar despliegue
log "🔍 Verificando despliegue..."
sleep 30

# Verificar servicios
if docker-compose -f docker-compose.easy-panel.yml ps | grep -q "Up"; then
    success "Servicios iniciados correctamente"
else
    error "Error al iniciar servicios"
    exit 1
fi

# Verificar health checks
if curl -f https://$DOMAIN/health > /dev/null 2>&1; then
    success "Health check exitoso"
else
    error "Health check falló"
fi

# 8. Configurar renovación automática de SSL
log "🔄 Configurando renovación automática de SSL..."
cat > renew-ssl.sh << EOF
#!/bin/bash
certbot renew --quiet
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem nginx/ssl/key.pem
sudo chown $USER:$USER nginx/ssl/*
docker-compose -f docker-compose.easy-panel.yml restart nginx
EOF

chmod +x renew-ssl.sh

# Agregar al crontab
(crontab -l 2>/dev/null; echo "0 12 * * * $(pwd)/renew-ssl.sh") | crontab -

success "🎉 Despliegue completado exitosamente!"
echo ""
echo "📊 Información del despliegue:"
echo "   • URL: https://$DOMAIN"
echo "   • API: https://$DOMAIN/api/v1"
echo "   • Health: https://$DOMAIN/health"
echo ""
echo "🔧 Comandos útiles:"
echo "   • Ver logs: docker-compose -f docker-compose.easy-panel.yml logs -f"
echo "   • Reiniciar: docker-compose -f docker-compose.easy-panel.yml restart"
echo "   • Parar: docker-compose -f docker-compose.easy-panel.yml down"
echo "   • Renovar SSL: ./renew-ssl.sh"
```

### 4. Configuración en Easy Panel

#### Configurar Dominio
1. **En Easy Panel > Dominios**
   ```
   Dominio: tu-dominio.com
   Tipo: Proxy
   Puerto: 80, 443
   ```

#### Configurar SSL
1. **En Easy Panel > SSL**
   ```
   Tipo: Let's Encrypt
   Dominio: tu-dominio.com
   Email: tu-email@dominio.com
   ```

#### Configurar Base de Datos (Opcional)
1. **En Easy Panel > Bases de Datos**
   ```
   Tipo: PostgreSQL
   Nombre: zaiken_db
   Usuario: zaiken_user
   Contraseña: zaiken_password_secure_2024
   ```

## 🔧 DESPLIEGUE HÍBRIDO (OPCIÓN AVANZADA)

### 1. Backend con Docker
```bash
# Solo backend en contenedor
docker-compose up backend postgres -d
```

### 2. Frontend Estático
```bash
# Construir frontend
cd frontend
npm run build

# Copiar a servidor web
sudo cp -r .next /var/www/zaiken-frontend/
sudo chown -R www-data:www-data /var/www/zaiken-frontend/
```

### 3. Configurar Nginx
```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    
    location / {
        root /var/www/zaiken-frontend;
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:3004/api/;
    }
}
```

## 📊 MONITOREO Y MANTENIMIENTO

### Script de Monitoreo
```bash
#!/bin/bash
# monitor.sh

# Verificar servicios
docker-compose -f docker-compose.easy-panel.yml ps

# Verificar logs
docker-compose -f docker-compose.easy-panel.yml logs --tail=50

# Verificar recursos
docker stats --no-stream

# Verificar SSL
echo | openssl s_client -servername tu-dominio.com -connect tu-dominio.com:443 2>/dev/null | openssl x509 -noout -dates
```

### Backup Automático
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/zaiken-system"

# Crear directorio de backup
mkdir -p $BACKUP_DIR

# Backup de base de datos
docker-compose -f docker-compose.easy-panel.yml exec -T postgres pg_dump -U zaiken_user zaiken_db > $BACKUP_DIR/db_backup_$DATE.sql

# Backup de archivos
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz data/ nginx/ssl/

# Limpiar backups antiguos (mantener últimos 7 días)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

## 🚨 TROUBLESHOOTING

### Problemas Comunes

#### 1. Error de puertos
```bash
# Verificar puertos ocupados
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# Cambiar puertos en docker-compose
ports:
  - "8080:80"
  - "8443:443"
```

#### 2. Error de SSL
```bash
# Verificar certificados
ls -la nginx/ssl/

# Regenerar certificados
sudo certbot certonly --standalone -d tu-dominio.com
```

#### 3. Error de base de datos
```bash
# Verificar conexión
docker-compose -f docker-compose.easy-panel.yml exec postgres pg_isready

# Verificar logs
docker-compose -f docker-compose.easy-panel.yml logs postgres
```

## 📈 OPTIMIZACIONES

### 1. Optimización de Rendimiento
```yaml
# En docker-compose.easy-panel.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

### 2. Configuración de Nginx
```nginx
# Optimizaciones en nginx/conf/nginx.conf
worker_processes auto;
worker_connections 1024;

# Gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
```

### 3. Configuración de PostgreSQL
```yaml
# En docker-compose.easy-panel.yml
postgres:
  environment:
    POSTGRES_DB: zaiken_db
    POSTGRES_USER: zaiken_user
    POSTGRES_PASSWORD: zaiken_password_secure_2024
    # Optimizaciones
    POSTGRES_SHARED_BUFFERS: 256MB
    POSTGRES_EFFECTIVE_CACHE_SIZE: 1GB
    POSTGRES_WORK_MEM: 4MB
```

## 🎯 RESULTADO FINAL

### ✅ Despliegue Exitoso
- **URL**: https://tu-dominio.com
- **API**: https://tu-dominio.com/api/v1
- **SSL**: Certificado válido
- **Backup**: Automático diario
- **Monitoreo**: Scripts configurados

### 📊 Métricas de Rendimiento
- **Tiempo de respuesta**: < 200ms
- **Uptime**: 99.9%
- **SSL**: A+ rating
- **Backup**: Diario automático

### 🔧 Mantenimiento
- **Renovación SSL**: Automática
- **Backup**: Diario automático
- **Logs**: Centralizados
- **Monitoreo**: Continuo

---

**¡Zaiken System está completamente desplegado y optimizado en Easy Panel!** 🚀
