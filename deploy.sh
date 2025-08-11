#!/bin/bash

# ===========================================
# SCRIPT DE DESPLIEGUE ROBUSTO - ZAIKEN SYSTEM
# ===========================================
# Autor: Senior Developer
# Versión: 1.0.0
# ===========================================

set -e  # Salir en caso de error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

    success "Dependencias verificadas"
}

# Función para crear directorios necesarios
create_directories() {
    log "Creando directorios necesarios..."

    mkdir -p data/postgres
    mkdir -p backend/logs
    mkdir -p nginx/ssl

    success "Directorios creados"
}

# Función para configurar variables de entorno
setup_environment() {
    log "Configurando variables de entorno..."

    if [ ! -f .env ]; then
        cat > .env << EOF
# ===========================================
# VARIABLES DE ENTORNO - ZAIKEN SYSTEM
# ===========================================

# Base de datos
DATABASE_URL=postgresql://zaiken_user:zaiken_password_secure_2024@postgres:5432/zaiken_db

# JWT
JWT_SECRET=zaiken_jwt_secret_very_secure_2024

# CORS
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000

# Puerto
PORT=3004

# Entorno
NODE_ENV=production
EOF
        success "Archivo .env creado"
    else
        warning "Archivo .env ya existe"
    fi
}

# Función para construir imágenes
build_images() {
    log "Construyendo imágenes Docker..."

    docker-compose build --no-cache

    success "Imágenes construidas"
}

# Función para iniciar servicios
start_services() {
    log "Iniciando servicios..."

    docker-compose up -d

    success "Servicios iniciados"
}

# Función para verificar salud de servicios
check_health() {
    log "Verificando salud de servicios..."

    # Esperar a que PostgreSQL esté listo
    log "Esperando PostgreSQL..."
    sleep 30

    # Verificar PostgreSQL
    if docker-compose exec -T postgres pg_isready -U zaiken_user -d zaiken_db; then
        success "PostgreSQL está saludable"
    else
        error "PostgreSQL no está saludable"
        exit 1
    fi

    # Verificar Backend
    log "Verificando Backend..."
    sleep 10

    if curl -f http://localhost:3004/api/v1/health > /dev/null 2>&1; then
        success "Backend está saludable"
    else
        error "Backend no está saludable"
        exit 1
    fi

    # Verificar Frontend
    log "Verificando Frontend..."
    sleep 10

    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        success "Frontend está saludable"
    else
        error "Frontend no está saludable"
        exit 1
    fi
}

# Función para mostrar información del despliegue
show_info() {
    echo ""
    echo "==========================================="
    echo "🚀 ZAIKEN SYSTEM DESPLEGADO EXITOSAMENTE"
    echo "==========================================="
    echo ""
    echo "📊 Servicios:"
    echo "   • Frontend: http://localhost:3000"
    echo "   • Backend API: http://localhost:3004/api/v1"
    echo "   • PostgreSQL: localhost:5432"
    echo ""
    echo "🔧 Comandos útiles:"
    echo "   • Ver logs: docker-compose logs -f"
    echo "   • Parar servicios: docker-compose down"
    echo "   • Reiniciar: docker-compose restart"
    echo "   • Ver estado: docker-compose ps"
    echo ""
    echo "📝 Logs de servicios:"
    echo "   • Backend: docker-compose logs backend"
    echo "   • Frontend: docker-compose logs frontend"
    echo "   • PostgreSQL: docker-compose logs postgres"
    echo ""
}

# Función principal
main() {
    echo "==========================================="
    echo "🚀 DESPLIEGUE ZAIKEN SYSTEM"
    echo "==========================================="
    echo ""

    check_dependencies
    create_directories
    setup_environment
    build_images
    start_services
    check_health
    show_info
}

# Ejecutar función principal
main "$@"
