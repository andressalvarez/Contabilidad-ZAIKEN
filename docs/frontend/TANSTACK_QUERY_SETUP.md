# Configuración de TanStack Query (React Query) - Zaiken System

## Problema Resuelto

El error "No QueryClient set" se producía porque faltaba el `QueryClientProvider` en la aplicación. Los hooks de React Query (`usePersonas`, `useRoles`, etc.) no podían encontrar el contexto del QueryClient.

## Solución Implementada

### 1. Archivo de Configuración del QueryClient
**Archivo:** `src/lib/queryClient.ts`

```typescript
import { QueryClient } from '@tanstack/react-query';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,        // 5 min (igual a tu hook)
        refetchOnWindowFocus: false,
        retry: 2,
        gcTime: 10 * 60 * 1000, // 10 minutos de garbage collection
      },
      mutations: {
        retry: 1,
      },
    },
  });
}
```

**Configuración optimizada:**
- `staleTime`: 5 minutos - tiempo antes de considerar los datos obsoletos
- `refetchOnWindowFocus`: false - evita refetch automático al enfocar la ventana
- `retry`: 2 intentos para queries, 1 para mutations
- `gcTime`: 10 minutos de garbage collection para optimizar memoria

### 2. Componente QueryProvider
**Archivo:** `src/components/QueryProvider.tsx`

```typescript
'use client';

import { ReactNode, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { makeQueryClient } from '@/lib/queryClient';

interface Props {
  children: ReactNode;
}

export function QueryProvider({ children }: Props) {
  // useState para garantizar una sola instancia por montaje en el cliente
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
```

**Características importantes:**
- `'use client'` - Marca el componente como cliente para Next.js App Router
- `useState(() => makeQueryClient())` - Garantiza una sola instancia del QueryClient
- `ReactQueryDevtools` - Herramientas de desarrollo solo en modo desarrollo

### 3. Providers Centralizados
**Archivo:** `src/app/providers.tsx`

```typescript
'use client';

import { QueryProvider } from '@/components/QueryProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
```

### 4. Integración en Layout
**Archivo:** `src/app/layout.tsx`

```typescript
import type { Metadata } from 'next'
import Head from 'next/head'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Dashboard de Resúmenes - Zaiken',
  description: 'Sistema de gestión Zaiken',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <Head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" />
      </Head>
      <body className="bg-gray-50" suppressHydrationWarning>
        <script src="https://cdn.tailwindcss.com" defer></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js" defer></script>

        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

## Hooks Configurados

### usePersonas
```typescript
export function usePersonas(includeInactive = false) {
  return useQuery({
    queryKey: personasKeys.list(includeInactive ? 'all' : 'active'),
    queryFn: () => PersonasService.getAll(includeInactive),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
```

### useActiveRoles
```typescript
export function useActiveRoles() {
  return useQuery({
    queryKey: rolesKeys.list('active'),
    queryFn: RolesService.getActive,
    staleTime: 1000 * 60 * 5,
  });
}
```

## Estructura de Query Keys

### Personas
```typescript
export const personasKeys = {
  all: ['personas'] as const,
  lists: () => [...personasKeys.all, 'list'] as const,
  list: (filters: string) => [...personasKeys.lists(), { filters }] as const,
  details: () => [...personasKeys.all, 'detail'] as const,
  detail: (id: number) => [...personasKeys.details(), id] as const,
  stats: (id: number) => [...personasKeys.detail(id), 'stats'] as const,
  summary: () => [...personasKeys.all, 'summary'] as const,
};
```

### Roles
```typescript
export const rolesKeys = {
  all: ['roles'] as const,
  lists: () => [...rolesKeys.all, 'list'] as const,
  list: (filters: string) => [...rolesKeys.lists(), { filters }] as const,
  details: () => [...rolesKeys.all, 'detail'] as const,
  detail: (id: number) => [...rolesKeys.details(), id] as const,
  stats: (id: number) => [...rolesKeys.detail(id), 'stats'] as const,
};
```

## Mutations Configuradas

### Crear Persona
```typescript
export function useCreatePersona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePersonaDto) => PersonasService.create(data),
    onSuccess: (newPersona) => {
      // Invalidar y refetch las listas
      queryClient.invalidateQueries({ queryKey: personasKeys.lists() });
      queryClient.invalidateQueries({ queryKey: personasKeys.summary() });

      // Optimistamente actualizar el cache
      queryClient.setQueryData(personasKeys.detail(newPersona.id), newPersona);

      toast.success('Persona creada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear la persona');
    },
  });
}
```

## Beneficios de esta Configuración

1. **Una sola instancia de QueryClient** - Evita múltiples refetch inesperados
2. **Configuración optimizada** - Tiempos de cache y retry apropiados
3. **DevTools integradas** - Herramientas de desarrollo para debugging
4. **Invalidación inteligente** - Cache se actualiza automáticamente
5. **Manejo de errores centralizado** - Toast notifications para feedback
6. **Compatibilidad con SSR** - Preparado para hidratación futura

## Verificación de la Configuración

Para verificar que todo funciona correctamente:

1. **Abrir DevTools** - En desarrollo, deberías ver el panel de React Query DevTools
2. **Verificar Network** - Las requests deberían aparecer en la pestaña Network
3. **Cache funcionando** - Las consultas repetidas no deberían hacer nuevas requests
4. **Mutations** - Crear/editar/eliminar debería actualizar automáticamente las listas

## Troubleshooting

### Error: "No QueryClient set"
- Verificar que `Providers` esté en `layout.tsx`
- Confirmar que el componente que usa hooks sea `'use client'`

### Múltiples refetch
- Verificar que no se esté creando QueryClient en cada render
- Usar `useState(() => makeQueryClient())` como se implementó

### DevTools no aparecen
- Verificar que `NODE_ENV === 'development'`
- Confirmar que `ReactQueryDevtools` esté importado

## Próximos Pasos (Opcional)

### SSR con Prefetch
Para implementar prefetch desde el servidor:

```typescript
// En un Server Component (ej: page.tsx)
import { dehydrate, QueryClient } from '@tanstack/react-query';
import { HydrationBoundary } from '@tanstack/react-query';

export default async function Page() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ['personas', 'list', 'active'],
    queryFn: () => PersonasService.getAll(false),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PersonasPage />
    </HydrationBoundary>
  );
}
```

### Optimizaciones Adicionales
- Implementar `suspense: true` para mejor UX
- Configurar `refetchOnMount` según necesidades
- Añadir `placeholderData` para loading states optimistas

## Dependencias Requeridas

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.83.0",
    "@tanstack/react-query-devtools": "^5.83.0"
  }
}
```

---

**Nota:** Esta configuración está optimizada para Next.js App Router y sigue las mejores prácticas de TanStack Query v5.
