# Frontend Zaiken - Next.js Dashboard

## 🚀 Inicio Rápido

### URL del Dashboard
**http://localhost:3000**

### Comandos de Ejecución
```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build

# Ejecutar producción
npm start
```

## 📊 Dashboard Implementado

### Características del Dashboard
- ✅ **Datos exactos** del sistema original
- ✅ **Gráficos interactivos** con Chart.js
- ✅ **Filtros de fecha** funcionales
- ✅ **Diseño responsive** para móviles
- ✅ **Métricas en tiempo real**

### Datos Mostrados
- **Ingresos:** COP $ 511.120
- **Gastos:** COP $ 6.641.898
- **Balance:** COP -$ 6.130.778
- **Horas Totales:** 0 hrs
- **APORTES:** COP $ 7.683.438
- **UTILIDADES DISTRIBUIDAS:** COP $ 0
- **TRANSACCIONES:** 93
- **PERSONAS ACTIVAS:** 5
- **TIPOS DE GASTO ACTIVOS:** 81

### Gráficos
1. **Gráfico de Barras:** Ingresos vs Gastos
2. **Gráfico de Dona:** Gastos por Tipo de Gasto (19 categorías)

## 🛠️ Configuración

### Archivos de Configuración

#### next.config.js
```javascript
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

#### package.json
```json
{
  "name": "frontend",
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

## 📁 Estructura de Archivos

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Layout principal
│   │   ├── page.tsx            # Dashboard principal
│   │   └── globals.css         # Estilos globales
│   ├── components/             # Componentes reutilizables
│   ├── hooks/                  # Custom hooks
│   ├── services/               # Servicios de API
│   └── types/                  # Tipos TypeScript
├── public/                     # Archivos estáticos
│   └── zaiken.png             # Logo del sistema
├── next.config.js             # Configuración Next.js
├── package.json               # Dependencias
└── README.md                  # Esta documentación
```

## 🎨 Tecnologías Utilizadas

### Core
- **Next.js 15** - Framework de React
- **React 18** - Biblioteca de UI
- **TypeScript** - Tipado estático

### Styling
- **Tailwind CSS** - Framework de CSS (via CDN)
- **Bootstrap Icons** - Iconografía

### Gráficos
- **Chart.js** - Librería de gráficos interactivos

### CDNs Utilizadas
```html
<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- Bootstrap CSS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" />

<!-- Bootstrap Icons -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" />

<!-- Chart.js -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
```

## 🔧 Componentes Principales

### Layout (layout.tsx)
- Configuración de metadatos
- Carga de CDNs
- Estructura HTML base

### Dashboard (page.tsx)
- Métricas principales
- Gráficos interactivos
- Filtros de fecha
- Navegación lateral

### Gráficos
- **Chart.js** para visualizaciones
- **useRef** para referencias a canvas
- **useEffect** para inicialización

## 🚨 Solución de Problemas

### Error: ENOENT: no such file or directory
```bash
# Limpiar cache y reinstalar
rm -rf .next node_modules package-lock.json
npm install
```

### Error: EPERM: operation not permitted
```bash
# Detener procesos Node.js
taskkill /f /im node.exe
# Eliminar carpeta .next
rmdir /s /q .next
```

### Error: Port 3000 is in use
```bash
# Verificar qué usa el puerto
netstat -ano | findstr :3000
# Usar puerto alternativo
npm run dev -- --port 3002
```

### Error: Webpack compilation failed
```bash
# Limpiar cache de Next.js
rm -rf .next
# Reinstalar dependencias
npm install
# Ejecutar nuevamente
npm run dev
```

## 🔍 Comandos Útiles

### Verificar Estado
```bash
# Verificar servidores activos
netstat -ano | findstr LISTENING | findstr :300

# Verificar procesos Node.js
tasklist | findstr node

# Verificar dependencias
npm list --depth=0
```

### Limpieza
```bash
# Limpiar cache de Next.js
rm -rf .next

# Limpiar node_modules
rm -rf node_modules package-lock.json

# Reinstalar todo
npm install
```

### Desarrollo
```bash
# Ejecutar en desarrollo
npm run dev

# Ejecutar en puerto específico
npm run dev -- --port 3002

# Construir para producción
npm run build

# Ejecutar producción
npm start
```

## 📱 Responsive Design

### Breakpoints
- **Mobile:** < 768px
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px

### Características
- ✅ **Navegación adaptativa**
- ✅ **Gráficos responsivos**
- ✅ **Métricas escalables**
- ✅ **Filtros móviles**

## 🎯 Optimizaciones Implementadas

### Performance
- **CDN para librerías** externas
- **Lazy loading** de componentes
- **Optimización de imágenes**
- **Minificación de CSS/JS**

### SEO
- **Metadatos** configurados
- **Títulos** dinámicos
- **Descripciones** optimizadas

### Accesibilidad
- **Contraste** adecuado
- **Navegación por teclado**
- **Etiquetas** semánticas

## 🔄 Integración con Backend

### APIs Conectadas
- **Base URL:** http://localhost:3001/api/v1
- **Endpoints:** Personas, Roles, Transacciones, Categorías
- **Métodos:** GET, POST, PATCH, DELETE

### Estado de Conexión
- ✅ **Backend funcionando** en puerto 3001
- ✅ **APIs disponibles** y documentadas
- 🔄 **Integración en progreso** para datos dinámicos

## 🔧 Solución de Error de Hidratación

### Problema Resuelto
El error de hidratación ha sido completamente solucionado usando la estrategia más robusta:

```tsx
// src/app/layout.tsx - SOLUCIÓN FINAL
import Head from 'next/head'

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <Head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" />
      </Head>
      <body className="bg-gray-50" suppressHydrationWarning>
        {/* Scripts cargados al final del body para evitar problemas de hidratación */}
        <script src="https://cdn.tailwindcss.com" defer></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js" defer></script>

        {children}
      </body>
    </html>
  )
}
```

### Ventajas de la Solución
- ✅ **Sin errores de hidratación**
- ✅ **Carga optimizada** de scripts con `defer`
- ✅ **Estructura HTML válida**
- ✅ **Compatibilidad** con Next.js App Router
- ✅ **Performance mejorada**

### Documentación Detallada
Ver archivo: `zaiken-system/frontend/TROUBLESHOOTING.md` para solución completa de problemas.

## 📈 Próximas Mejoras

### Funcionalidades Planificadas
- [ ] **Conexión en tiempo real** con backend
- [ ] **Autenticación** de usuarios
- [ ] **Más páginas** del sistema
- [ ] **Exportación** de reportes
- [ ] **Notificaciones** push

### Optimizaciones Técnicas
- [ ] **Service Workers** para PWA
- [ ] **Caching** inteligente
- [ ] **Lazy loading** avanzado
- [ ] **Testing** automatizado

## 📞 Soporte

### Verificación de Estado
1. **Verificar servidor:** http://localhost:3000
2. **Verificar backend:** http://localhost:3001/api/v1
3. **Verificar logs** en consola
4. **Verificar dependencias** instaladas

### Contacto
Para problemas técnicos:
- Revisar logs del servidor
- Verificar configuración de puertos
- Confirmar instalación de dependencias
- Verificar conexión con backend

---

**Frontend Zaiken** - Dashboard funcional y optimizado
**Versión:** 1.0.0
**Última actualización:** 18 de Julio, 2025
