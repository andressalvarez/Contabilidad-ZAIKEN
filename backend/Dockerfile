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
    && rm -rf /var/cache/apk/*

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Establecer directorio de trabajo
WORKDIR /app

# Copiar package.json para que npm pueda ejecutar scripts en runtime
COPY --from=builder /app/package*.json ./

# Copiar node_modules resultantes (ya sin devDeps) y el build
COPY --from=builder /app/node_modules ./node_modules

# Copiar archivos construidos desde la etapa anterior
COPY --from=builder /app/dist ./dist
# Healthcheck script
COPY --from=builder /app/healthcheck.js ./healthcheck.js

# Cambiar propiedad de archivos
RUN chown -R nestjs:nodejs /app

# Cambiar a usuario no-root
USER nestjs

# Exponer puerto
EXPOSE 3004

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3004

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js

# Comando de inicio
CMD ["npm", "run", "start:prod"]
