# Dockerfile para Backend - Easypanel
FROM node:18-alpine AS builder

# Instalar herramientas necesarias
RUN apk add --no-cache libc6-compat bash postgresql-client

WORKDIR /app

# Copiar package files
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Generar Prisma Client
RUN npx prisma generate

# Build de la aplicación
RUN npm run build

# ========================================
# Imagen de producción
# ========================================
FROM node:18-alpine AS runner

# Instalar bash y postgresql-client para scripts
RUN apk add --no-cache bash postgresql-client

WORKDIR /app

# Copiar solo lo necesario
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/scripts ./scripts

# Crear directorio de backups
RUN mkdir -p /app/backups && chmod 755 /app/backups

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Exponer puerto
EXPOSE 3000

# Script de inicio con migraciones automáticas
COPY docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "dist/src/main.js"]
