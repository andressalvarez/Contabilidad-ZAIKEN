#!/bin/sh
set -e

LOG_DIR=/app/logs
LOG_FILE="$LOG_DIR/backup-import.log"
LOCK_FILE=/app/.backup_import_done

mkdir -p "$LOG_DIR"

echo "[entrypoint] Applying Prisma migrations..."
# Si existe el schema en /app/prisma/schema.prisma lo usamos explícitamente
if [ -f "/app/prisma/schema.prisma" ]; then
  prisma migrate deploy --schema=/app/prisma/schema.prisma || true
else
  prisma migrate deploy || true
fi

# Fallback: si el historial de migraciones está desalineado y faltan tablas,
# empuja el schema directamente (solo crea/actualiza estructuras faltantes)
if [ -f "/app/prisma/schema.prisma" ]; then
  prisma db push --schema=/app/prisma/schema.prisma --accept-data-loss --skip-generate || true
fi

# Control flag (default true)
IMPORT_ON_BOOT=${IMPORT_ON_BOOT:-true}
# Permite forzar el import ignorando el lock file (false por defecto)
IMPORT_FORCE=${IMPORT_FORCE:-false}
BACKUP_URL_DEFAULT="https://raw.githubusercontent.com/andressalvarez/Contabilidad-ZAIKEN/main/backup_2025-07-15.json"
BACKUP_URL=${BACKUP_URL:-$BACKUP_URL_DEFAULT}
BACKUP_FILE=${BACKUP_FILE:-/app/backup.json}

if [ "$IMPORT_ON_BOOT" = "true" ]; then
  if [ -f "$LOCK_FILE" ] && [ "$IMPORT_FORCE" != "true" ]; then
    echo "[entrypoint] Import lock present ($LOCK_FILE). Skipping import." | tee -a "$LOG_FILE"
  else
  echo "[entrypoint] Checking if import is needed..."
  set +e
  node -e "(async()=>{const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();try{const c=await p.transaccion.count();console.log('[entrypoint] transacciones:',c);process.exit(c===0?42:0)}catch(e){console.error('[entrypoint] prisma count failed:',e.message);process.exit(42)}})()"
  NEED_IMPORT=$?
  set -e
  if [ "$NEED_IMPORT" = "42" ]; then
    echo "[entrypoint] Ensuring schema is present (db push)..."
    if [ -f "/app/prisma/schema.prisma" ]; then
      prisma db push --schema=/app/prisma/schema.prisma --accept-data-loss --skip-generate || true
    fi
    echo "[entrypoint] No transacciones found. Importing backup..."
    # Descargar backup si no existe archivo local
    if [ ! -f "$BACKUP_FILE" ]; then
      echo "[entrypoint] Downloading backup from $BACKUP_URL"
      apk add --no-cache curl >/dev/null 2>&1 || true
      curl -fsSL "$BACKUP_URL" -o "$BACKUP_FILE"
    fi
    if [ -f "$BACKUP_FILE" ]; then
      echo "[entrypoint] Import started at $(date -Iseconds)" | tee -a "$LOG_FILE"
      node dist/scripts/import-backup.js "$BACKUP_FILE" --wipe-all >> "$LOG_FILE" 2>&1 || {
        echo "[entrypoint] Import failed" | tee -a "$LOG_FILE"; exit 1;
      }
      echo "[entrypoint] Import completed at $(date -Iseconds)" | tee -a "$LOG_FILE"
      # crear lock file para evitar reimportar
      echo "done $(date -Iseconds)" > "$LOCK_FILE"
    else
      echo "[entrypoint] Backup file not found. Skipping import." | tee -a "$LOG_FILE"
    fi
  else
    echo "[entrypoint] Data already present. Skipping import." | tee -a "$LOG_FILE"
  fi
  fi
fi

echo "[entrypoint] Starting NestJS..."
exec node dist/src/main.js


