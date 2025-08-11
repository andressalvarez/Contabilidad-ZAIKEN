warning: in the working copy of 'deploy.sh', LF will be replaced by CRLF the next time Git touches it
[1mdiff --git a/deploy.sh b/deploy.sh[m
[1mindex ddbe53c..069ca1d 100644[m
[1m--- a/deploy.sh[m
[1m+++ b/deploy.sh[m
[36m@@ -36,35 +36,35 @@[m [merror() {[m
 # Función para verificar dependencias[m
 check_dependencies() {[m
     log "Verificando dependencias..."[m
[31m-    [m
[32m+[m
     if ! command -v docker &> /dev/null; then[m
         error "Docker no está instalado"[m
         exit 1[m
     fi[m
[31m-    [m
[32m+[m
     if ! command -v docker-compose &> /dev/null; then[m
         error "Docker Compose no está instalado"[m
         exit 1[m
     fi[m
[31m-    [m
[32m+[m
     success "Dependencias verificadas"[m
 }[m
 [m
 # Función para crear directorios necesarios[m
 create_directories() {[m
     log "Creando directorios necesarios..."[m
[31m-    [m
[32m+[m
     mkdir -p data/postgres[m
     mkdir -p backend/logs[m
     mkdir -p nginx/ssl[m
[31m-    [m
[32m+[m
     success "Directorios creados"[m
 }[m
 [m
 # Función para configurar variables de entorno[m
 setup_environment() {[m
     log "Configurando variables de entorno..."[m
[31m-    [m
[32m+[m
     if [ ! -f .env ]; then[m
         cat > .env << EOF[m
 # ===========================================[m
[36m@@ -95,29 +95,29 @@[m [mEOF[m
 # Función para construir imágenes[m
 build_images() {[m
     log "Construyendo imágenes Docker..."[m
[31m-    [m
[32m+[m
     docker-compose build --no-cache[m
[31m-    [m
[32m+[m
     success "Imágenes construidas"[m
 }[m
 [m
 # Función para iniciar servicios[m
 start_services() {[m
     log "Iniciando servicios..."[m
[31m-    [m
[32m+[m
     docker-compose up -d[m
[31m-    [m
[32m+[m
     success "Servicios iniciados"[m
 }[m
 [m
 # Función para verificar salud de servicios[m
 check_health() {[m
     log "Verificando salud de servicios..."[m
[31m-    [m
[32m+[m
     # Esperar a que PostgreSQL esté listo[m
     log "Esperando PostgreSQL..."[m
     sleep 30[m
[31m-    [m
[32m+[m
     # Verificar PostgreSQL[m
     if docker-compose exec -T postgres pg_isready -U zaiken_user -d zaiken_db; then[m
         success "PostgreSQL está saludable"[m
[36m@@ -125,22 +125,22 @@[m [mcheck_health() {[m
         error "PostgreSQL no está saludable"[m
         exit 1[m
     fi[m
[31m-    [m
[32m+[m
     # Verificar Backend[m
     log "Verificando Backend..."[m
     sleep 10[m
[31m-    [m
[32m+[m
     if curl -f http://localhost:3004/api/v1/health > /dev/null 2>&1; then[m
         success "Backend está saludable"[m
     else[m
         error "Backend no está saludable"[m
         exit 1[m
     fi[m
[31m-    [m
[32m+[m
     # Verificar Frontend[m
     log "Verificando Frontend..."[m
     sleep 10[m
[31m-    [m
[32m+[m
     if curl -f http://localhost:3000 > /dev/null 2>&1; then[m
         success "Frontend está saludable"[m
     else[m
[36m@@ -180,7 +180,7 @@[m [mmain() {[m
     echo "🚀 DESPLIEGUE ZAIKEN SYSTEM"[m
     echo "==========================================="[m
     echo ""[m
[31m-    [m
[32m+[m
     check_dependencies[m
     create_directories[m
     setup_environment[m
