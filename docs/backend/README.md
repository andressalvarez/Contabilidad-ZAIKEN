# Backend Zaiken - NestJS API

## 🚀 Inicio Rápido

### URL del API
**http://localhost:3001**

### Comandos de Ejecución
```bash
# Instalar dependencias
npm install

# Configurar base de datos
npx prisma generate
npx prisma migrate dev
npx prisma db seed

# Ejecutar en desarrollo
npm run start:dev

# Ejecutar en producción
npm run start:prod
```

## 📊 APIs Disponibles

### Base URL
**http://localhost:3001/api/v1**

### Endpoints Principales

#### Health Check
- `GET /api/v1/health` - Estado del servidor
- `GET /api/v1/info` - Información del sistema

#### Personas
- `GET /api/v1/personas` - Listar todas las personas
- `POST /api/v1/personas` - Crear nueva persona
- `GET /api/v1/personas/:id` - Obtener persona por ID
- `PATCH /api/v1/personas/:id` - Actualizar persona
- `DELETE /api/v1/personas/:id` - Eliminar persona
- `GET /api/v1/personas/active` - Personas activas
- `GET /api/v1/personas/summary` - Resumen de personas
- `GET /api/v1/personas/:id/stats` - Estadísticas de persona

#### Roles
- `GET /api/v1/roles` - Listar todos los roles
- `POST /api/v1/roles` - Crear nuevo rol
- `GET /api/v1/roles/:id` - Obtener rol por ID
- `PATCH /api/v1/roles/:id` - Actualizar rol
- `DELETE /api/v1/roles/:id` - Eliminar rol
- `GET /api/v1/roles/active` - Roles activos
- `GET /api/v1/roles/:id/stats` - Estadísticas de rol

#### Transacciones
- `GET /api/v1/transacciones` - Listar todas las transacciones
- `POST /api/v1/transacciones` - Crear nueva transacción
- `GET /api/v1/transacciones/:id` - Obtener transacción por ID
- `PATCH /api/v1/transacciones/:id` - Actualizar transacción
- `DELETE /api/v1/transacciones/:id` - Eliminar transacción
- `GET /api/v1/transacciones/recent` - Transacciones recientes
- `GET /api/v1/transacciones/pending` - Transacciones pendientes
- `GET /api/v1/transacciones/stats` - Estadísticas generales
- `GET /api/v1/transacciones/resumen-categorias` - Resumen por categorías
- `GET /api/v1/transacciones/tendencias-mensuales` - Tendencias mensuales
- `PATCH /api/v1/transacciones/:id/approve` - Aprobar transacción
- `PATCH /api/v1/transacciones/:id/reject` - Rechazar transacción

#### Categorías
- `GET /api/v1/categorias` - Listar todas las categorías
- `POST /api/v1/categorias` - Crear nueva categoría
- `GET /api/v1/categorias/:id` - Obtener categoría por ID
- `PATCH /api/v1/categorias/:id` - Actualizar categoría
- `DELETE /api/v1/categorias/:id` - Eliminar categoría

## 🛠️ Configuración

### Variables de Entorno
```env
# .env
DATABASE_URL="file:./dev.db"
PORT=3001
NODE_ENV=development
```

### Base de Datos
- **Desarrollo:** SQLite (dev.db)
- **Producción:** PostgreSQL
- **ORM:** Prisma

### Prisma Schema
```prisma
model Role {
  id          Int      @id @default(autoincrement())
  nombre      String   @unique
  descripcion String?
  importancia Int      @default(1)
  activo      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  personas    Persona[]
}

model Persona {
  id          Int      @id @default(autoincrement())
  nombre      String
  email       String   @unique
  telefono    String?
  rolId       Int
  activo      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  rol         Role     @relation(fields: [rolId], references: [id])
  transacciones Transaccion[]
}

model Transaccion {
  id          Int      @id @default(autoincrement())
  descripcion String
  monto       Float
  tipo        String   // 'ingreso' | 'gasto'
  categoriaId Int
  personaId   Int?
  fecha       DateTime @default(now())
  estado      String   @default('pendiente') // 'pendiente' | 'aprobada' | 'rechazada'
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  categoria   Categoria @relation(fields: [categoriaId], references: [id])
  persona     Persona? @relation(fields: [personaId], references: [id])
}

model Categoria {
  id          Int      @id @default(autoincrement())
  nombre      String   @unique
  descripcion String?
  activo      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  transacciones Transaccion[]
}
```

## 📁 Estructura de Archivos

```
backend/
├── src/
│   ├── app.module.ts              # Módulo principal
│   ├── main.ts                    # Punto de entrada
│   ├── app.controller.ts          # Controlador principal
│   ├── app.service.ts             # Servicio principal
│   ├── personas/                  # Módulo de personas
│   │   ├── personas.controller.ts
│   │   ├── personas.service.ts
│   │   ├── personas.module.ts
│   │   └── dto/
│   ├── roles/                     # Módulo de roles
│   │   ├── roles.controller.ts
│   │   ├── roles.service.ts
│   │   ├── roles.module.ts
│   │   └── dto/
│   ├── transacciones/             # Módulo de transacciones
│   │   ├── transacciones.controller.ts
│   │   ├── transacciones.service.ts
│   │   ├── transacciones.module.ts
│   │   └── dto/
│   ├── categorias/                # Módulo de categorías
│   │   ├── categorias.controller.ts
│   │   ├── categorias.service.ts
│   │   ├── categorias.module.ts
│   │   └── dto/
│   └── prisma/                    # Configuración Prisma
│       ├── prisma.service.ts
│       └── prisma.module.ts
├── prisma/
│   ├── schema.prisma              # Esquema de base de datos
│   ├── migrations/                # Migraciones
│   ├── seed.ts                    # Datos iniciales
│   └── dev.db                     # Base de datos SQLite
├── package.json                   # Dependencias
└── README.md                      # Esta documentación
```

## 🎨 Tecnologías Utilizadas

### Core
- **NestJS** - Framework de Node.js
- **TypeScript** - Lenguaje de programación
- **Prisma** - ORM para base de datos

### Base de Datos
- **SQLite** - Desarrollo local
- **PostgreSQL** - Producción
- **Prisma Migrate** - Migraciones

### Validación
- **class-validator** - Validación de DTOs
- **class-transformer** - Transformación de datos

## 🔧 Comandos de Base de Datos

### Prisma
```bash
# Generar cliente Prisma
npx prisma generate

# Crear migración
npx prisma migrate dev --name init

# Ejecutar migraciones
npx prisma migrate deploy

# Ver base de datos
npx prisma studio

# Resetear base de datos
npx prisma migrate reset

# Ejecutar seed
npx prisma db seed
```

### Seed Data
```typescript
// prisma/seed.ts
export async function seed() {
  // Crear roles
  const adminRole = await prisma.role.create({
    data: { nombre: 'Administrador', importancia: 5 }
  });

  // Crear categorías
  const categoria1 = await prisma.categoria.create({
    data: { nombre: 'Desarrollo', descripcion: 'Gastos de desarrollo' }
  });

  // Crear personas
  const persona1 = await prisma.persona.create({
    data: {
      nombre: 'Juan Pérez',
      email: 'juan@example.com',
      rolId: adminRole.id
    }
  });
}
```

## 🚨 Solución de Problemas

### Error: Database connection failed
```bash
# Verificar DATABASE_URL en .env
# Para SQLite: DATABASE_URL="file:./dev.db"
# Para PostgreSQL: DATABASE_URL="postgresql://user:pass@localhost:5432/db"

# Regenerar cliente Prisma
npx prisma generate

# Resetear base de datos
npx prisma migrate reset
```

### Error: Port 3001 is in use
```bash
# Verificar qué usa el puerto
netstat -ano | findstr :3001

# Cambiar puerto en main.ts
const port = process.env.PORT || 3002;
```

### Error: Prisma schema not found
```bash
# Verificar ubicación del schema
ls prisma/schema.prisma

# Regenerar cliente
npx prisma generate
```

## 🔍 Comandos Útiles

### Desarrollo
```bash
# Ejecutar en desarrollo
npm run start:dev

# Ejecutar en modo watch
npm run start:debug

# Construir para producción
npm run build

# Ejecutar producción
npm run start:prod
```

### Testing
```bash
# Ejecutar tests
npm run test

# Tests en modo watch
npm run test:watch

# Tests de integración
npm run test:e2e
```

### Base de Datos
```bash
# Ver estado de migraciones
npx prisma migrate status

# Crear nueva migración
npx prisma migrate dev --name nombre_migracion

# Aplicar migraciones en producción
npx prisma migrate deploy

# Ver datos en Prisma Studio
npx prisma studio
```

## 📊 Estadísticas y Métricas

### Endpoints de Estadísticas
- `GET /api/v1/transacciones/stats` - Estadísticas generales
- `GET /api/v1/transacciones/resumen-categorias` - Resumen por categorías
- `GET /api/v1/transacciones/tendencias-mensuales` - Tendencias
- `GET /api/v1/personas/summary` - Resumen de personas
- `GET /api/v1/personas/:id/stats` - Estadísticas por persona
- `GET /api/v1/roles/:id/stats` - Estadísticas por rol

### Métricas Disponibles
- **Total de transacciones** por período
- **Balance** (ingresos - gastos)
- **Distribución** por categorías
- **Tendencias** mensuales
- **Estadísticas** por persona/rol

## 🔄 Integración con Frontend

### CORS Configurado
```typescript
// main.ts
app.enableCors({
  origin: ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true,
});
```

### Headers de Respuesta
- **Content-Type:** application/json
- **Access-Control-Allow-Origin:** http://localhost:3000
- **Access-Control-Allow-Methods:** GET, POST, PATCH, DELETE

## 📈 Próximas Mejoras

### Funcionalidades Planificadas
- [ ] **Autenticación JWT** para usuarios
- [ ] **WebSockets** para tiempo real
- [ ] **Caching** con Redis
- [ ] **Logging** avanzado
- [ ] **Rate limiting** para APIs
- [ ] **Documentación Swagger** automática

### Optimizaciones Técnicas
- [ ] **Compresión** de respuestas
- [ ] **Validación** más robusta
- [ ] **Testing** automatizado completo
- [ ] **Monitoreo** de performance
- [ ] **Backup** automático de base de datos

## 📞 Soporte

### Verificación de Estado
1. **Health check:** http://localhost:3001/api/v1/health
2. **Info del sistema:** http://localhost:3001/api/v1/info
3. **Prisma Studio:** `npx prisma studio`
4. **Logs del servidor:** Consola de desarrollo

### Debugging
```bash
# Ver logs detallados
npm run start:debug

# Verificar base de datos
npx prisma studio

# Verificar migraciones
npx prisma migrate status
```

---

**Backend Zaiken** - API REST robusta y escalable
**Versión:** 1.0.0
**Última actualización:** 18 de Julio, 2025
