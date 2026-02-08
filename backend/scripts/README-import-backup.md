# Import Backup 0802 - Manual Script

This script allows you to manually import production backup data into your development database.

## Important Notes

- **MANUAL EXECUTION ONLY**: This script will NEVER run automatically
- **DESTRUCTIVE OPERATION**: This will DELETE all data from the specified tables before importing
- **DEVELOPMENT DATABASE**: This modifies the database currently in use (`zaiken-postgres` container)

## Prerequisites

1. Docker containers must be running:
   ```bash
   docker-compose up -d
   ```

2. The backup files must be mounted correctly (configured in `docker-compose.yml`)

## Usage

### Option 1: Execute bash script directly (Linux/Mac/Git Bash)

```bash
docker exec -it zaiken-postgres /backup-data/import-backup-0802.sh
```

### Option 2: Use PowerShell script (Windows)

```powershell
.\zaiken-system\backend\scripts\import-backup-0802.ps1
```

Or from the project root:

```powershell
cd zaiken-system/backend/scripts
.\import-backup-0802.ps1
```

## What the script does

1. **Verifies** all backup SQL files exist
2. **Asks for confirmation** before proceeding
3. **Truncates** (deletes all data from) the following tables in order:
   - hour_debt_audit_log
   - distribucion_detalles
   - distribucion_utilidades
   - registro_horas
   - transacciones
   - usuarios_roles
   - vs_grupo_categorias
   - vs_grupos
   - vs_configuraciones
   - vs_carpetas
   - campanas
   - categorias
   - valor_horas
   - roles_sistema
   - roles
   - tipos_transaccion
   - usuarios
   - negocios

4. **Imports** production data from backup files in correct dependency order:
   - negocios.sql
   - roles.sql
   - roles_sistema.sql
   - tipos_transaccion.sql
   - usuarios.sql
   - usuarios_roles.sql
   - valor_horas.sql
   - categorias.sql
   - campanas.sql
   - transacciones.sql
   - registro_horas.sql
   - distribucion_utilidades.sql
   - distribucion_detalles.sql
   - hour_debt_audit_log.sql
   - vs_carpetas.sql
   - vs_grupos.sql
   - vs_configuraciones.sql
   - vs_grupo_categorias.sql

## Tables NOT affected

The following tables are **NOT** modified by this script:
- security_roles
- permissions
- role_permissions
- security_audit_logs
- security_sessions
- security_settings
- hour_debts
- debt_deductions
- _prisma_migrations

## Troubleshooting

### Script not found in container

Make sure:
1. The volume is mounted correctly in `docker-compose.yml`
2. You have restarted containers after modifying docker-compose.yml:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### Permission denied

The script should be executable. If not, run:
```bash
docker exec zaiken-postgres chmod +x /backup-data/import-backup-0802.sh
```

### Connection errors

Verify the container is running:
```bash
docker ps | grep zaiken-postgres
```

## Safety

- The script asks for explicit confirmation before proceeding
- Only tables with backup files are affected
- System security tables are never touched
- The script can be run multiple times safely (it truncates before importing)

