# ===========================================
# DOCKERFILE ROBUSTO - ZAIKEN SYSTEM BACKEND
# ===========================================
# Stack: Node.js 18, NestJS, PostgreSQL, Prisma
# ===========================================

# Etapa de construcción
FROM node:20-alpine AS builder

# Instalar dependencias del sistema
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    openssl \
    && rm -rf /var/cache/apk/*

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias (incluye devDeps para poder compilar con Nest/TS)
RUN npm ci && npm cache clean --force

# Copiar código fuente
COPY . .

# Generar Prisma client
RUN npx prisma generate

# Construir aplicación
RUN npm run build

# Quitar dependencias de desarrollo para optimizar el runtime
RUN npm prune --omit=dev

# Etapa de producción
FROM node:20-alpine AS production

# Instalar dependencias del sistema para producción
RUN apk add --no-cache \
    openssl \
    curl \
    && rm -rf /var/cache/apk/*

# Forzar rebuild de imagen cuando cambie este label (cache-bust)
LABEL zaiken.build="2025-08-11-1350"

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Establecer directorio de trabajo
WORKDIR /app

# Copiar package.json para que npm pueda ejecutar scripts en runtime
COPY --from=builder /app/package*.json ./

# Copiar node_modules resultantes (ya sin devDeps) y el build
COPY --from=builder /app/node_modules ./node_modules

# Copiar artefactos construidos desde la etapa anterior
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/healthcheck.js ./healthcheck.js
COPY --from=builder /app/package*.json ./
# IMPORTANTE: incluir el schema de Prisma para migraciones en runtime
COPY --from=builder /app/prisma ./prisma

# Copiar entrypoint para migraciones/importe único
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Verificación en build: asegurar que el directorio dist exista
RUN echo "Contenido de /app:" && ls -la /app && \
    echo "Contenido de /app/dist:" && ls -la /app/dist

# Instalar Prisma CLI globalmente para poder ejecutar migrate en runtime
RUN npm i -g prisma@6.12.0 && \
    chown -R nestjs:nodejs /app

# Cambiar a usuario no-root
USER nestjs

# Exponer puerto
EXPOSE 3004

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3004

# Health check (relaja tiempos para evitar falsos negativos en arranque)
HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
    CMD node healthcheck.js

# Comando de inicio (entrypoint aplica migraciones e importación única)
ENV IMPORT_ON_BOOT=true
ENTRYPOINT ["./docker-entrypoint.sh"]