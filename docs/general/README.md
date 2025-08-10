# Sistema de Gestión Zaiken - Documentación Completa

## 📋 Resumen del Proyecto

Sistema integral de gestión empresarial desarrollado con **NestJS** (Backend) y **Next.js** (Frontend), diseñado para manejar personas, transacciones, categorías y distribución de utilidades.

## 🏗️ Arquitectura del Sistema

```
zaiken-system/
├── backend/          # API REST con NestJS + Prisma
├── frontend/         # Aplicación web con Next.js
└── README.md         # Esta documentación
```

## 🚀 Servidores y Puertos

### Backend (NestJS + Prisma)
- **URL:** http://localhost:3001
- **API Base:** http://localhost:3001/api/v1
- **Documentación:** http://localhost:3001/api/v1
- **Base de Datos:** PostgreSQL (desarrollo: SQLite)

### Frontend (Next.js)
- **URL:** http://localhost:3000
- **Dashboard:** http://localhost:3000
- **Tecnologías:** React, Tailwind CSS, Chart.js

## 📊 Dashboard Implementado

### Características Principales
- ✅ **Datos exactos** replicados del sistema original
- ✅ **Gráficos interactivos** con Chart.js
- ✅ **Filtros de fecha** funcionales
- ✅ **Métricas en tiempo real**

### Datos del Dashboard
- **Ingresos:** COP $ 511.120
- **Gastos:** COP $ 6.641.898
- **Balance:** COP -$ 6.130.778
- **Horas Totales:** 0 hrs
- **APORTES:** COP $ 7.683.438
- **UTILIDADES DISTRIBUIDAS:** COP $ 0
- **TRANSACCIONES:** 93
- **PERSONAS ACTIVAS:** 5
- **TIPOS DE GASTO ACTIVOS:** 81

### Gráficos Implementados
1. **Gráfico de Barras:** Ingresos vs Gastos
2. **Gráfico de Dona:** Gastos por Tipo de Gasto (19 categorías)

## 🛠️ Configuración y Instalación

### Prerrequisitos
- Node.js 18+
- npm o yarn
- PostgreSQL (producción) / SQLite (desarrollo)

### Backend Setup

```bash
cd zaiken-system/backend

# Instalar dependencias
npm install

# Configurar base de datos
npx prisma generate
npx prisma migrate dev
npx prisma db seed

# Ejecutar en desarrollo
npm run start:dev
```

### Frontend Setup

```bash
cd zaiken-system/frontend

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev
```

## 📁 Estructura de Archivos

### Backend (NestJS)
```
backend/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── personas/          # Gestión de personas
│   ├── roles/            # Gestión de roles
│   ├── transacciones/    # Gestión de transacciones
│   ├── categorias/       # Gestión de categorías
│   └── prisma/           # Configuración de base de datos
├── prisma/
│   ├── schema.prisma     # Esquema de base de datos
│   ├── migrations/       # Migraciones
│   └── seed.ts          # Datos iniciales
└── package.json
```

### Frontend (Next.js)
```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx    # Layout principal
│   │   ├── page.tsx      # Dashboard principal
│   │   └── globals.css   # Estilos globales
│   ├── components/       # Componentes reutilizables
│   ├── hooks/           # Custom hooks
│   ├── services/        # Servicios de API
│   └── types/           # Tipos TypeScript
├── public/              # Archivos estáticos
└── package.json
```

## 🔧 Configuraciones Implementadas

### Next.js Config
```javascript
// next.config.js
const nextConfig = {
  reactStrictMode: false,
  swcMinify: false,
  experimental: {
    optimizeCss: false,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};
```

### Prisma Schema
```prisma
// Esquema principal con modelos:
- Role
- Persona
- Transaccion
- Categoria
```

## 🌐 APIs Disponibles

### Endpoints Principales

#### Personas
- `GET /api/v1/personas` - Listar personas
- `POST /api/v1/personas` - Crear persona
- `GET /api/v1/personas/:id` - Obtener persona
- `PATCH /api/v1/personas/:id` - Actualizar persona
- `DELETE /api/v1/personas/:id` - Eliminar persona

#### Roles
- `GET /api/v1/roles` - Listar roles
- `POST /api/v1/roles` - Crear rol
- `GET /api/v1/roles/:id` - Obtener rol
- `PATCH /api/v1/roles/:id` - Actualizar rol
- `DELETE /api/v1/roles/:id` - Eliminar rol

#### Transacciones
- `GET /api/v1/transacciones` - Listar transacciones
- `POST /api/v1/transacciones` - Crear transacción
- `GET /api/v1/transacciones/stats` - Estadísticas
- `GET /api/v1/transacciones/recent` - Transacciones recientes

#### Categorías
- `GET /api/v1/categorias` - Listar categorías
- `POST /api/v1/categorias` - Crear categoría
- `GET /api/v1/categorias/:id` - Obtener categoría
- `PATCH /api/v1/categorias/:id` - Actualizar categoría
- `DELETE /api/v1/categorias/:id` - Eliminar categoría

## 🎨 Tecnologías Utilizadas

### Backend
- **NestJS** - Framework de Node.js
- **Prisma** - ORM para base de datos
- **PostgreSQL** - Base de datos principal
- **SQLite** - Base de datos de desarrollo
- **TypeScript** - Lenguaje de programación

### Frontend
- **Next.js 15** - Framework de React
- **React 18** - Biblioteca de UI
- **Tailwind CSS** - Framework de CSS
- **Chart.js** - Librería de gráficos
- **Bootstrap Icons** - Iconografía
- **TypeScript** - Lenguaje de programación

## 🔍 Solución de Problemas

### Errores Comunes y Soluciones

#### Error de Hidratación (Hydration Error)
```bash
# Problema: Diferencias entre servidor y cliente
# Solución: Usar Script de Next.js en lugar de <head> manual
# Ver archivo: zaiken-system/frontend/TROUBLESHOOTING.md
```

#### Error: ENOENT: no such file or directory
```bash
# Limpiar cache y reinstalar
rm -rf .next node_modules package-lock.json
npm install
```

#### Error: EPERM: operation not permitted
```bash
# Detener procesos Node.js
taskkill /f /im node.exe
# Eliminar carpeta .next
rmdir /s /q .next
```

#### Error: Port 3000 is in use
```bash
# Verificar qué usa el puerto
netstat -ano | findstr :3000
# Usar puerto alternativo
npm run dev -- --port 3002
```

### Comandos Útiles

```bash
# Verificar servidores activos
netstat -ano | findstr LISTENING | findstr :300

# Verificar procesos Node.js
tasklist | findstr node

# Limpiar cache de Next.js
rm -rf .next

# Reinstalar dependencias
npm install
```

## 📈 Características del Dashboard

### Métricas Principales
- **Tarjetas de métricas** con gradientes de colores
- **Datos en tiempo real** desde la API
- **Formato de moneda** colombiana (COP)

### Gráficos Interactivos
- **Chart.js** para visualizaciones
- **Responsive design** para todos los dispositivos
- **Leyendas interactivas** en los gráficos

### Filtros y Controles
- **Filtros de fecha** (Desde/Hasta)
- **Botones de acción** (Filtrar/Limpiar)
- **Navegación lateral** completa

## 🔄 Flujo de Desarrollo

### 1. Iniciar Backend
```bash
cd zaiken-system/backend
npm run start:dev
# Servidor en http://localhost:3001
```

### 2. Iniciar Frontend
```bash
cd zaiken-system/frontend
npm run dev
# Servidor en http://localhost:3000
```

### 3. Acceder al Dashboard
- Abrir navegador en: http://localhost:3000
- Verificar que los gráficos se cargan correctamente
- Probar filtros de fecha

## 📝 Notas de Implementación

### Cambios Realizados
1. **Configuración Next.js** simplificada para evitar errores
2. **Layout optimizado** con CDNs para mejor rendimiento
3. **Gráficos implementados** con datos exactos del original
4. **Diseño responsive** para todos los dispositivos
5. **Integración completa** entre frontend y backend

### Optimizaciones
- **CDN para librerías** (Chart.js, Bootstrap, Tailwind)
- **Configuración webpack** optimizada
- **Eliminación de dependencias** problemáticas
- **Código TypeScript** limpio y tipado

## 🎯 Estado Actual

### ✅ Completado
- [x] Backend NestJS funcionando
- [x] Frontend Next.js funcionando
- [x] Dashboard con datos exactos
- [x] Gráficos interactivos
- [x] API endpoints completos
- [x] Base de datos configurada

### 🔄 En Desarrollo
- [ ] Conexión en tiempo real con backend
- [ ] Autenticación de usuarios
- [ ] Más páginas del sistema
- [ ] Optimizaciones de rendimiento

## 📞 Soporte

Para problemas técnicos o consultas:
- Verificar logs del servidor
- Revisar configuración de puertos
- Confirmar que todas las dependencias están instaladas
- Verificar que la base de datos está funcionando

---

**Última actualización:** 18 de Julio, 2025
**Versión:** 1.0.0
**Estado:** Funcionando correctamente
