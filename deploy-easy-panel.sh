#!/bin/bash

# ===========================================
# SCRIPT DE DESPLIEGUE EASY PANEL - ZAIKEN SYSTEM
# ===========================================
# Autor: Senior Developer
# Versión: 1.0.0
# ===========================================

set -e

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Variables configurables
PROJECT_NAME="zaiken-system"
DOMAIN="${DOMAIN:-tu-dominio.com}"
EMAIL="${EMAIL:-tu-email@dominio.com}"
BACKUP_ENABLED="${BACKUP_ENABLED:-true}"

# Función para verificar dependencias
check_dependencies() {
    log "Verificando dependencias..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker no está instalado"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose no está instalado"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        error "Git no está instalado"
        exit 1
    fi
    
    success "Dependencias verificadas"
}

# Función para configurar variables
setup_variables() {
    log "Configurando variables..."
    
    if [ "$DOMAIN" = "tu-dominio.com" ]; then
        echo -n "Ingresa tu dominio (ej: zaiken.midominio.com): "
        read -r DOMAIN
    fi
    
    if [ "$EMAIL" = "tu-email@dominio.com" ]; then
        echo -n "Ingresa tu email para SSL: "
        read -r EMAIL
    fi
    
    success "Variables configuradas: $DOMAIN, $EMAIL"
}

# Función para clonar/actualizar repositorio
setup_repository() {
    log "Configurando repositorio..."
    
    if [ ! -d "$PROJECT_NAME" ]; then
        git clone https://github.com/andressalvarez/Contabilidad-ZAIKEN.git $PROJECT_NAME
        cd $PROJECT_NAME
    else
        cd $PROJECT_NAME
        git pull origin main
    fi
    
    success "Repositorio configurado"
}

# Función para crear directorios
create_directories() {
    log "Creando directorios necesarios..."
    
    mkdir -p data/postgres
    mkdir -p backend/logs
    mkdir -p nginx/ssl
    mkdir -p nginx/conf
    mkdir -p backups
    
    success "Directorios creados"
}

# Función para configurar Nginx
setup_nginx() {
    log "Configurando Nginx..."
    
    cat > nginx/conf/nginx.conf << EOF
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    # Logging
    log_format main '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                    '\$status \$body_bytes_sent "\$http_referer" '
                    '"\$http_user_agent" "\$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Upstream servers
    upstream backend {
        server backend:3004;
    }
    
    upstream frontend {
        server frontend:3000;
    }
    
    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name $DOMAIN;
        return 301 https://\$server_name\$request_uri;
    }
    
    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name $DOMAIN;
        
        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;
        
        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
        add_header Referrer-Policy "strict-origin-when-cross-origin";
        
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
            proxy_read_timeout 86400;
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
            proxy_read_timeout 86400;
        }
        
        # Health checks
        location /health {
            proxy_pass http://backend/api/v1/health;
            access_log off;
        }
        
        # Static files cache
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
EOF
    
    success "Nginx configurado"
}

# Función para configurar SSL
setup_ssl() {
    log "Configurando SSL..."
    
    if [ ! -f "nginx/ssl/cert.pem" ]; then
        # Instalar certbot si no está instalado
        if ! command -v certbot &> /dev/null; then
            log "Instalando certbot..."
            sudo apt update
            sudo apt install certbot -y
        fi
        
        # Generar certificado
        log "Generando certificado SSL para $DOMAIN..."
        sudo certbot certonly --standalone -d $DOMAIN --email $EMAIL --agree-tos --non-interactive
        
        # Copiar certificados
        sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem nginx/ssl/cert.pem
        sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem nginx/ssl/key.pem
        sudo chown $USER:$USER nginx/ssl/*
        
        success "Certificado SSL generado"
    else
        warning "Certificado SSL ya existe"
    fi
}

# Función para crear docker-compose
create_docker_compose() {
    log "Creando docker-compose para Easy Panel..."
    
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
      POSTGRES_SHARED_BUFFERS: 256MB
      POSTGRES_EFFECTIVE_CACHE_SIZE: 1GB
      POSTGRES_WORK_MEM: 4MB
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    networks:
      - zaiken-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U zaiken_user -d zaiken_db"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

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
      JWT_SECRET: zaiken_jwt_secret_very_secure_2024
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
      start_period: 40s
    volumes:
      - ./backend/logs:/app/logs
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'

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
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'

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
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  zaiken-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
EOF
    
    success "Docker Compose creado"
}

# Función para construir e iniciar servicios
deploy_services() {
    log "Construyendo imágenes..."
    docker-compose -f docker-compose.easy-panel.yml build --no-cache
    
    log "Iniciando servicios..."
    docker-compose -f docker-compose.easy-panel.yml up -d
    
    success "Servicios iniciados"
}

# Función para verificar despliegue
verify_deployment() {
    log "Verificando despliegue..."
    
    # Esperar a que los servicios estén listos
    sleep 30
    
    # Verificar servicios
    if docker-compose -f docker-compose.easy-panel.yml ps | grep -q "Up"; then
        success "Servicios iniciados correctamente"
    else
        error "Error al iniciar servicios"
        docker-compose -f docker-compose.easy-panel.yml logs
        exit 1
    fi
    
    # Verificar health checks
    log "Verificando health checks..."
    sleep 10
    
    if curl -f https://$DOMAIN/health > /dev/null 2>&1; then
        success "Health check exitoso"
    else
        warning "Health check falló, verificando logs..."
        docker-compose -f docker-compose.easy-panel.yml logs backend
    fi
}

# Función para configurar renovación SSL
setup_ssl_renewal() {
    log "Configurando renovación automática de SSL..."
    
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
    
    success "Renovación SSL configurada"
}

# Función para configurar backup
setup_backup() {
    if [ "$BACKUP_ENABLED" = "true" ]; then
        log "Configurando backup automático..."
        
        cat > backup.sh << EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="\$(pwd)/backups"

# Crear directorio de backup
mkdir -p \$BACKUP_DIR

# Backup de base de datos
docker-compose -f docker-compose.easy-panel.yml exec -T postgres pg_dump -U zaiken_user zaiken_db > \$BACKUP_DIR/db_backup_\$DATE.sql

# Backup de archivos
tar -czf \$BACKUP_DIR/files_backup_\$DATE.tar.gz data/ nginx/ssl/

# Limpiar backups antiguos (mantener últimos 7 días)
find \$BACKUP_DIR -name "*.sql" -mtime +7 -delete
find \$BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completado: \$DATE"
EOF
        
        chmod +x backup.sh
        
        # Agregar al crontab (backup diario a las 2 AM)
        (crontab -l 2>/dev/null; echo "0 2 * * * $(pwd)/backup.sh") | crontab -
        
        success "Backup automático configurado"
    fi
}

# Función para mostrar información final
show_info() {
    echo ""
    echo "==========================================="
    echo "🚀 ZAIKEN SYSTEM DESPLEGADO EN EASY PANEL"
    echo "==========================================="
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
    echo "   • Backup manual: ./backup.sh"
    echo ""
    echo "📈 Monitoreo:"
    echo "   • Estado servicios: docker-compose -f docker-compose.easy-panel.yml ps"
    echo "   • Uso recursos: docker stats"
    echo "   • Logs nginx: docker-compose -f docker-compose.easy-panel.yml logs nginx"
    echo ""
    echo "🔒 Seguridad:"
    echo "   • SSL renovación: Automática (diaria)"
    echo "   • Backup: Automático (diario a las 2 AM)"
    echo "   • Health checks: Configurados"
    echo ""
}

# Función principal
main() {
    echo "==========================================="
    echo "🚀 DESPLIEGUE EASY PANEL - ZAIKEN SYSTEM"
    echo "==========================================="
    echo ""
    
    check_dependencies
    setup_variables
    setup_repository
    create_directories
    setup_nginx
    setup_ssl
    create_docker_compose
    deploy_services
    verify_deployment
    setup_ssl_renewal
    setup_backup
    show_info
}

# Ejecutar función principal
main "$@"
