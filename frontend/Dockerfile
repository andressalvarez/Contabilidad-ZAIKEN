# ===========================================
# DOCKERFILE ROBUSTO - ZAIKEN SYSTEM FRONTEND
# ===========================================
# Stack: Node.js 20, Next.js 15, React
# ===========================================

# Etapa de construcción
FROM node:20-alpine AS builder

# Instalar dependencias del sistema
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias (incluye devDeps para compilar)
RUN npm ci && npm cache clean --force

# Copiar código fuente
COPY . .

# Construir aplicación
RUN npm run build

# Quitar dependencias de desarrollo
RUN npm prune --omit=dev

# Etapa de producción
FROM node:20-alpine AS production

# Args/labels para forzar rebuild (se pueden pasar desde el panel)
ARG GIT_SHA="local"
ARG CACHE_BUST="0"
LABEL org.opencontainers.image.revision=$GIT_SHA \
      zaiken.cache_bust=$CACHE_BUST

# Instalar dependencias del sistema para producción
RUN apk add --no-cache \
    curl \
    && rm -rf /var/cache/apk/*

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Establecer directorio de trabajo
WORKDIR /app

# Copiar metadata y node_modules resultantes (ya sin devDeps)
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Copiar artefactos construidos desde la etapa anterior
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Cambiar propiedad de archivos
RUN chown -R nextjs:nodejs /app

# Cambiar a usuario no-root
USER nextjs

# Exponer puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Health check (Next.js no expone /api/health por defecto).
# Validamos la raíz y salimos 0 si responde 200.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/',res=>process.exit(res.statusCode===200?0:1)).on('error',()=>process.exit(1))"

# Comando de inicio
CMD ["npm", "start"]

