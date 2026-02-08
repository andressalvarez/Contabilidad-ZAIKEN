#!/bin/bash
# Script to import production backup data into development database
# This script is MANUAL ONLY - it will NOT run automatically
# Execute with: docker exec zaiken-postgres /backup-data/import-backup-0802.sh

set -e

# ============================================================================
# CONFIGURATION SECTION - MODIFY HERE TO ADD NEW TABLES
# ============================================================================
#
# To add a new table to the import process:
# 1. Add the table name to IMPORT_ORDER array (in correct dependency order)
# 2. The TRUNCATE_ORDER will be automatically reversed
# 3. Make sure the SQL file exists in BACKUPPROD 0802 directory
#
# IMPORT_ORDER: Tables listed in dependency order (parent tables first)
# Example: If 'nueva_tabla' depends on 'usuarios', add it AFTER 'usuarios'
# ============================================================================

# Tables in IMPORT order (parent tables first, child tables last)
# This order respects foreign key dependencies
IMPORT_ORDER=(
    "negocios"              # No dependencies
    "roles"                 # No dependencies
    "roles_sistema"         # No dependencies
    "tipos_transaccion"     # No dependencies
    "usuarios"              # Depends on: negocios, roles
    "usuarios_roles"        # Depends on: usuarios, roles_sistema
    "valor_horas"           # Depends on: negocios, usuarios, roles
    "categorias"            # Depends on: negocios, usuarios
    "campanas"              # Depends on: negocios, usuarios
    "transacciones"         # Depends on: negocios, tipos_transaccion, usuarios, categorias, campanas
    "registro_horas"        # Depends on: negocios, usuarios, campanas
    "distribucion_utilidades" # Depends on: negocios
    "distribucion_detalles"   # Depends on: distribucion_utilidades, usuarios
    "hour_debt_audit_log"   # Depends on: usuarios
    "vs_carpetas"           # Depends on: negocios
    "vs_grupos"             # Depends on: negocios, vs_carpetas
    "vs_configuraciones"   # Depends on: negocios
    "vs_grupo_categorias"   # Depends on: vs_grupos, categorias
)

# ============================================================================
# END OF CONFIGURATION - DO NOT MODIFY BELOW UNLESS YOU KNOW WHAT YOU'RE DOING
# ============================================================================

# Database connection parameters
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="zaiken_db"
DB_USER="zaiken"
DB_PASSWORD="zaiken_dev_password"

# Backup data directory
BACKUP_DIR="/backup-data"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Import Backup 0802 - Production to Dev${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Set PGPASSWORD environment variable
export PGPASSWORD="$DB_PASSWORD"

# Function to check if file exists
check_file() {
    if [ ! -f "$1" ]; then
        echo -e "${RED}ERROR: File not found: $1${NC}"
        exit 1
    fi
}

# Function to truncate table
truncate_table() {
    local table=$1
    echo -e "${YELLOW}Truncating table: $table${NC}"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "TRUNCATE TABLE \"$table\" CASCADE;" || {
        echo -e "${RED}Failed to truncate $table${NC}"
        exit 1
    }
}

# Function to import SQL file
import_sql() {
    local file=$1
    local table=$(basename "$file" .sql)
    echo -e "${GREEN}Importing: $file${NC}"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$file" || {
        echo -e "${RED}Failed to import $file${NC}"
        exit 1
    }
    echo -e "${GREEN}✓ Imported $table${NC}"
}

# Verify backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${RED}ERROR: Backup directory not found: $BACKUP_DIR${NC}"
    echo "Make sure the volume is mounted correctly in docker-compose.yml"
    exit 1
fi

# Verify all SQL files exist
echo -e "${YELLOW}Verifying backup files...${NC}"
for table in "${IMPORT_ORDER[@]}"; do
    check_file "$BACKUP_DIR/${table}.sql"
done
echo -e "${GREEN}✓ All backup files verified (${#IMPORT_ORDER[@]} files)${NC}"
echo ""

# Confirm before proceeding
echo -e "${YELLOW}WARNING: This will DELETE all data from the following tables:${NC}"
for table in "${IMPORT_ORDER[@]}"; do
    echo "  - $table"
done
echo ""
echo -e "${YELLOW}And then import production data from backup.${NC}"
echo ""
read -p "Do you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo -e "${YELLOW}Import cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${GREEN}Starting data import process...${NC}"
echo ""

# Step 1: Truncate tables in reverse dependency order
# (Reverse the IMPORT_ORDER array to get truncate order)
echo -e "${YELLOW}Step 1: Truncating existing data...${NC}"
for ((idx=${#IMPORT_ORDER[@]}-1 ; idx>=0 ; idx--)); do
    truncate_table "${IMPORT_ORDER[idx]}"
done

echo ""
echo -e "${GREEN}✓ All tables truncated (${#IMPORT_ORDER[@]} tables)${NC}"
echo ""

# Step 2: Import data in correct dependency order
echo -e "${YELLOW}Step 2: Importing production data...${NC}"
for table in "${IMPORT_ORDER[@]}"; do
    import_sql "$BACKUP_DIR/${table}.sql"
done

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Import completed successfully!${NC}"
echo -e "${GREEN}   Total tables processed: ${#IMPORT_ORDER[@]}${NC}"
echo -e "${GREEN}========================================${NC}"

# Unset PGPASSWORD
unset PGPASSWORD
