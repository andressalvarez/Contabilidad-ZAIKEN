# Solución de Problemas - Frontend Zaiken

## 🚨 Errores Comunes y Soluciones

### 1. Error de Hidratación (Hydration Error)

#### Problema:
```
A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.
```

#### Causa:
- Uso de `<head>` manual en Next.js App Router
- Diferencias entre renderizado del servidor y cliente
- Scripts cargados de forma incorrecta

#### Solución Implementada:
```tsx
// ❌ INCORRECTO
<html lang="es">
  <head>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    {children}
  </body>
</html>

// ✅ CORRECTO - Estrategia 1: Script de Next.js
import Script from 'next/script'

<html lang="es">
  <body>
    <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
    {children}
  </body>
</html>

// ✅ CORRECTO - Estrategia 2: suppressHydrationWarning
<html lang="es" suppressHydrationWarning>
  <head>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body suppressHydrationWarning>
    {children}
  </body>
</html>

// ✅ CORRECTO - Estrategia 3: Head de Next.js + Scripts defer
import Head from 'next/head'

<html lang="es" suppressHydrationWarning>
  <Head>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" />
  </Head>
  <body className="bg-gray-50" suppressHydrationWarning>
    <script src="https://cdn.tailwindcss.com" defer></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js" defer></script>
    {children}
  </body>
</html>
```

### 2. Error: EPERM: operation not permitted

#### Problema:
```
Error: EPERM: operation not permitted, open '.next/trace'
```

#### Causa:
- Procesos Node.js bloqueando archivos
- Permisos de Windows

#### Solución:
```bash
# 1. Detener todos los procesos Node.js
taskkill /f /im node.exe

# 2. Eliminar carpeta .next
rmdir /s /q .next

# 3. Reinstalar dependencias
npm install

# 4. Ejecutar nuevamente
npm run dev
```

### 3. Error: Port 3000 is in use

#### Problema:
```
Port 3000 is in use by an unknown process
```

#### Solución:
```bash
# Verificar qué usa el puerto
netstat -ano | findstr :3000

# Usar puerto alternativo
npm run dev -- --port 3002
```

### 4. Error: Couldn't find any `pages` or `app` directory

#### Problema:
```
Couldn't find any `pages` or `app` directory. Please create one under the project root
```

#### Causa:
- Ejecutar Next.js desde directorio incorrecto
- Estructura de archivos incorrecta

#### Solución:
```bash
# Asegurarse de estar en el directorio correcto
cd zaiken-system/frontend

# Verificar estructura
ls src/app/

# Ejecutar desde el directorio correcto
npm run dev
```

### 5. Error: ENOENT: no such file or directory

#### Problema:
```
Could not read package.json: Error: ENOENT: no such file or directory
```

#### Causa:
- Ejecutar npm desde directorio incorrecto
- package.json faltante

#### Solución:
```bash
# Verificar ubicación
pwd

# Navegar al directorio correcto
cd zaiken-system/frontend

# Verificar package.json
ls package.json

# Instalar dependencias
npm install
```

## 🔧 Configuraciones Específicas

### Next.js Config Optimizada
```javascript
// next.config.js
const nextConfig = {
  reactStrictMode: false,        // Evita problemas de hidratación
  swcMinify: false,              // Evita errores de compilación
  experimental: {
    optimizeCss: false,          // Evita problemas con CSS
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

### Layout Optimizado
```tsx
// src/app/layout.tsx - Estrategia 1: Script de Next.js
import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        {/* CSS */}
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" />

        {/* Scripts con estrategia beforeInteractive */}
        <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/chart.js" strategy="beforeInteractive" />

        {children}
      </body>
    </html>
  )
}

// src/app/layout.tsx - Estrategia 2: suppressHydrationWarning
export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" />
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      </head>
      <body className="bg-gray-50" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
```

## 📋 Checklist de Verificación

### Antes de Ejecutar:
- [ ] Estar en el directorio correcto: `zaiken-system/frontend`
- [ ] Tener `package.json` presente
- [ ] Tener `src/app/` con archivos necesarios
- [ ] No tener procesos Node.js ejecutándose

### Durante la Ejecución:
- [ ] Verificar que el puerto 3000 esté libre
- [ ] Verificar que no haya errores de permisos
- [ ] Verificar que los scripts se carguen correctamente

### Después de la Ejecución:
- [ ] Verificar que http://localhost:3000 responda
- [ ] Verificar que los gráficos se rendericen
- [ ] Verificar que no haya errores en consola

## 🚀 Comandos de Recuperación

### Limpieza Completa:
```bash
# 1. Detener procesos
taskkill /f /im node.exe

# 2. Limpiar cache
rm -rf .next
rm -rf node_modules
rm package-lock.json

# 3. Reinstalar
npm install

# 4. Ejecutar
npm run dev
```

### Verificación de Estado:
```bash
# Verificar servidores activos
netstat -ano | findstr LISTENING | findstr :300

# Verificar procesos Node.js
tasklist | findstr node

# Verificar dependencias
npm list --depth=0
```

## 🔧 Estrategias de Hidratación

### suppressHydrationWarning
Esta estrategia suprime las advertencias de hidratación cuando sabemos que las diferencias entre servidor y cliente son esperadas.

```tsx
<html lang="es" suppressHydrationWarning>
  <body suppressHydrationWarning>
    {children}
  </body>
</html>
```

**Cuándo usar:**
- Cuando usamos CDNs externos
- Cuando hay diferencias esperadas entre servidor y cliente
- Como solución temporal para desarrollo

**Cuándo NO usar:**
- En componentes que deben ser consistentes
- Cuando las diferencias indican un bug real

### Head de Next.js + Scripts defer (RECOMENDADA)
Esta es la estrategia más robusta que combina el componente `Head` de Next.js con scripts cargados al final del body.

```tsx
import Head from 'next/head'

<html lang="es" suppressHydrationWarning>
  <Head>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" />
  </Head>
  <body className="bg-gray-50" suppressHydrationWarning>
    <script src="https://cdn.tailwindcss.com" defer></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js" defer></script>
    {children}
  </body>
</html>
```

**Ventajas:**
- ✅ **Sin errores de hidratación**
- ✅ **Carga optimizada** de scripts
- ✅ **Estructura HTML válida**
- ✅ **Compatibilidad** con Next.js App Router
- ✅ **Performance mejorada** con `defer`

**Cuándo usar:**
- **Siempre** para proyectos Next.js con CDNs
- Cuando necesitas máxima compatibilidad
- Para evitar problemas de hidratación

## 📞 Soporte Adicional

### Logs Útiles:
- **Consola del navegador:** F12 → Console
- **Terminal de desarrollo:** Logs de Next.js
- **Network tab:** Verificar carga de recursos

### Recursos:
- [Next.js Hydration Error](https://nextjs.org/docs/messages/react-hydration-error)
- [Next.js Script Component](https://nextjs.org/docs/basic-features/script)
- [Next.js App Router](https://nextjs.org/docs/app)
- [React suppressHydrationWarning](https://react.dev/reference/react-dom/hydrate#suppressing-unavoidable-hydration-errors)

---

**Última actualización:** 18 de Julio, 2025
**Versión:** 1.0.0

