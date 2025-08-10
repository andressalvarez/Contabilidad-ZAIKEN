# 🐘 Script de configuración de PostgreSQL para Windows
# Ejecutar como Administrador

Write-Host "🐘 Configurando PostgreSQL para Zaiken System..." -ForegroundColor Green

# Verificar si PostgreSQL está instalado
$postgresService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue

if ($postgresService) {
    Write-Host "✅ PostgreSQL encontrado: $($postgresService.Name)" -ForegroundColor Green

    # Iniciar servicio
    Start-Service $postgresService.Name
    Write-Host "✅ Servicio PostgreSQL iniciado" -ForegroundColor Green
} else {
    Write-Host "❌ PostgreSQL no encontrado" -ForegroundColor Red
    Write-Host "📥 Descargar desde: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Write-Host "🔧 O usar Chocolatey: choco install postgresql" -ForegroundColor Yellow
    exit 1
}

# Crear base de datos
Write-Host "🗄️ Creando base de datos zaiken_db..." -ForegroundColor Yellow

# Usar psql para crear la base de datos
$env:PGPASSWORD = "password"
psql -U postgres -h localhost -c "CREATE DATABASE zaiken_db;" 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Base de datos zaiken_db creada" -ForegroundColor Green
} else {
    Write-Host "⚠️ Base de datos ya existe o error en creación" -ForegroundColor Yellow
}

Write-Host "🎉 Configuración completada!" -ForegroundColor Green
Write-Host "📊 Ahora puedes ejecutar: npm run db:setup:postgres" -ForegroundColor Cyan
