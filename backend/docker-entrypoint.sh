#!/bin/sh
set -e

echo "[entrypoint] Applying Prisma migrations..."
# Si existe el schema en /app/prisma/schema.prisma lo usamos explícitamente
if [ -f "/app/prisma/schema.prisma" ]; then
  prisma migrate deploy --schema=/app/prisma/schema.prisma || true
else
  prisma migrate deploy || true
fi

# Control flag (default true)
IMPORT_ON_BOOT=${IMPORT_ON_BOOT:-true}
BACKUP_URL_DEFAULT="https://raw.githubusercontent.com/andressalvarez/Contabilidad-ZAIKEN/main/backup_2025-07-15.json"
BACKUP_URL=${BACKUP_URL:-$BACKUP_URL_DEFAULT}
BACKUP_FILE=${BACKUP_FILE:-/app/backup.json}

if [ "$IMPORT_ON_BOOT" = "true" ]; then
  echo "[entrypoint] Checking if import is needed..."
  set +e
  node -e "(async()=>{const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();try{const c=await p.transaccion.count();console.log('[entrypoint] transacciones:',c);process.exit(c===0?42:0)}catch(e){console.error('[entrypoint] prisma count failed:',e.message);process.exit(42)}})()"
  NEED_IMPORT=$?
  set -e
  if [ "$NEED_IMPORT" = "42" ]; then
    echo "[entrypoint] No transacciones found. Importing backup..."
    # Descargar backup si no existe archivo local
    if [ ! -f "$BACKUP_FILE" ]; then
      echo "[entrypoint] Downloading backup from $BACKUP_URL"
      apk add --no-cache curl >/dev/null 2>&1 || true
      curl -fsSL "$BACKUP_URL" -o "$BACKUP_FILE"
    fi
    if [ -f "$BACKUP_FILE" ]; then
      node dist/scripts/import-backup.js "$BACKUP_FILE" --wipe-all || {
        echo "[entrypoint] Import failed"; exit 1;
      }
      echo "[entrypoint] Import completed"
    else
      echo "[entrypoint] Backup file not found. Skipping import."
    fi
  else
    echo "[entrypoint] Data already present. Skipping import."
  fi
fi

echo "[entrypoint] Starting NestJS..."
exec node dist/src/main.js


