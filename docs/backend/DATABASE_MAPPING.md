# 📊 Mapeo Completo de la Base de Datos - Sistema ZAIKEN

## 🗄️ Información General

- **Motor de BD**: SQLite (Desarrollo) / PostgreSQL (Producción)
- **ORM**: Prisma
- **Archivo de Esquema**: `prisma/schema.prisma`
- **Base de Datos**: `prisma/dev.db`

---

## 📋 Modelos de la Base de Datos

### 1. 🏢 **Rol** (`roles`)

**Descripción**: Define los roles o cargos dentro del sistema.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | `Int` | `@id @default(autoincrement())` | Identificador único |
| `nombreRol` | `String` | `@unique` | Nombre del rol (único) |
| `importancia` | `Int` | `@default(0)` | Nivel de importancia del rol |
| `descripcion` | `String?` | - | Descripción opcional del rol |
| `createdAt` | `DateTime` | `@default(now())` | Fecha de creación |
| `updatedAt` | `DateTime` | `@updatedAt` | Fecha de última actualización |

**Relaciones**:
- `personas` → `Persona[]` (1:N)
- `valorHoras` → `ValorHora[]` (1:N)

**Ejemplo de datos**:
```json
{
  "id": 5,
  "nombreRol": "CEO",
  "importancia": 35,
  "descripcion": "Director Ejecutivo"
}
```

---

### 2. 👤 **Persona** (`personas`)

**Descripción**: Almacena información de las personas/socios del sistema.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | `Int` | `@id @default(autoincrement())` | Identificador único |
| `nombre` | `String` | `@unique` | Nombre completo (único) |
| `rolId` | `Int` | - | ID del rol asignado |
| `horasTotales` | `Int` | `@default(0)` | Total de horas trabajadas |
| `aportesTotales` | `Float` | `@default(0)` | Dinero aportado al negocio |
| `valorHora` | `Float` | `@default(0)` | Valor por hora actual |
| `inversionHoras` | `Float` | `@default(0)` | Inversión en horas |
| `inversionTotal` | `Float` | `@default(0)` | Inversión total |
| `participacionPorc` | `Float` | `@default(0)` | Porcentaje de participación |
| `notas` | `String?` | - | Notas adicionales |
| `activo` | `Boolean` | `@default(true)` | Estado activo/inactivo |
| `createdAt` | `DateTime` | `@default(now())` | Fecha de creación |
| `updatedAt` | `DateTime` | `@updatedAt` | Fecha de última actualización |

**Relaciones**:
- `rol` → `Rol` (N:1)
- `valorHoras` → `ValorHora[]` (1:N)
- `registroHoras` → `RegistroHoras[]` (1:N)
- `transacciones` → `Transaccion[]` (1:N)
- `distribucionDetalle` → `DistribucionDetalle[]` (1:N)

**Ejemplo de datos**:
```json
{
  "id": 4,
  "nombre": "Andrés Salamanca",
  "rolId": 5,
  "horasTotales": 0,
  "aportesTotales": 4158438,
  "valorHora": 6840,
  "inversionHoras": 0,
  "inversionTotal": 4158438,
  "participacionPorc": 35,
  "activo": true
}
```

---

### 3. 💰 **ValorHora** (`valor_horas`)

**Descripción**: Historial de valores por hora de cada persona.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | `Int` | `@id @default(autoincrement())` | Identificador único |
| `personaId` | `Int` | - | ID de la persona |
| `rolId` | `Int` | - | ID del rol |
| `valor` | `Float` | - | Valor por hora |
| `notas` | `String?` | - | Notas adicionales |
| `fechaInicio` | `DateTime` | `@default(now())` | Fecha de inicio del valor |
| `fechaFin` | `DateTime?` | - | Fecha de fin del valor |
| `activo` | `Boolean` | `@default(true)` | Estado activo/inactivo |
| `createdAt` | `DateTime` | `@default(now())` | Fecha de creación |
| `updatedAt` | `DateTime` | `@updatedAt` | Fecha de última actualización |

**Relaciones**:
- `persona` → `Persona` (N:1)
- `rol` → `Rol` (N:1)

**Ejemplo de datos**:
```json
{
  "id": 4,
  "personaId": 4,
  "rolId": 5,
  "valor": 6840,
  "fechaInicio": "2025-01-01T00:00:00.000Z",
  "activo": true
}
```

---

### 4. ⏰ **RegistroHoras** (`registro_horas`)

**Descripción**: Registro de horas trabajadas por cada persona.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | `Int` | `@id @default(autoincrement())` | Identificador único |
| `personaId` | `Int` | - | ID de la persona |
| `fecha` | `DateTime` | - | Fecha del registro |
| `horas` | `Float` | - | Cantidad de horas |
| `descripcion` | `String?` | - | Descripción del trabajo |
| `aprobado` | `Boolean` | `@default(false)` | Estado de aprobación |
| `createdAt` | `DateTime` | `@default(now())` | Fecha de creación |
| `updatedAt` | `DateTime` | `@updatedAt` | Fecha de última actualización |

**Relaciones**:
- `persona` → `Persona` (N:1)

**Ejemplo de datos**:
```json
{
  "id": 1,
  "personaId": 4,
  "fecha": "2025-01-15T00:00:00.000Z",
  "horas": 8.5,
  "descripcion": "Desarrollo de funcionalidades",
  "aprobado": true
}
```

---

### 5. 📂 **Categoria** (`categorias`)

**Descripción**: Categorías para clasificar transacciones.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | `Int` | `@id @default(autoincrement())` | Identificador único |
| `nombre` | `String` | `@unique` | Nombre de la categoría (único) |
| `descripcion` | `String?` | - | Descripción opcional |
| `color` | `String?` | - | Color para UI |
| `activo` | `Boolean` | `@default(true)` | Estado activo/inactivo |
| `createdAt` | `DateTime` | `@default(now())` | Fecha de creación |
| `updatedAt` | `DateTime` | `@updatedAt` | Fecha de última actualización |

**Relaciones**:
- `transacciones` → `Transaccion[]` (1:N)

**Ejemplo de datos**:
```json
{
  "id": 1,
  "nombre": "Publicidad (TikTok)",
  "descripcion": "Gastos en publicidad de TikTok",
  "color": "#3B82F6",
  "activo": true
}
```

---

### 6. 📢 **Campana** (`campanas`)

**Descripción**: Campañas o proyectos del sistema.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | `Int` | `@id @default(autoincrement())` | Identificador único |
| `nombre` | `String` | - | Nombre de la campaña |
| `descripcion` | `String?` | - | Descripción opcional |
| `fechaInicio` | `DateTime` | - | Fecha de inicio |
| `fechaFin` | `DateTime?` | - | Fecha de fin |
| `presupuesto` | `Float?` | - | Presupuesto asignado |
| `ingresoTotal` | `Float` | `@default(0)` | Ingresos totales |
| `gastoTotal` | `Float` | `@default(0)` | Gastos totales |
| `utilidad` | `Float` | `@default(0)` | Utilidad calculada |
| `activo` | `Boolean` | `@default(true)` | Estado activo/inactivo |
| `createdAt` | `DateTime` | `@default(now())` | Fecha de creación |
| `updatedAt` | `DateTime` | `@updatedAt` | Fecha de última actualización |

**Relaciones**:
- `transacciones` → `Transaccion[]` (1:N)
- `distribucionUtilidades` → `DistribucionUtilidades[]` (1:N)

**Ejemplo de datos**:
```json
{
  "id": 2,
  "nombre": "Interacción likes",
  "fechaInicio": "2025-01-30T00:00:00.000Z",
  "fechaFin": "2025-01-30T00:00:00.000Z",
  "presupuesto": 17907,
  "ingresoTotal": 0,
  "gastoTotal": 17907,
  "utilidad": -17907,
  "activo": true
}
```

---

### 7. 💳 **Transaccion** (`transacciones`)

**Descripción**: Registro de ingresos y gastos del sistema.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | `Int` | `@id @default(autoincrement())` | Identificador único |
| `tipo` | `TipoTransaccion` | - | Tipo: INGRESO o GASTO |
| `monto` | `Float` | - | Cantidad de dinero |
| `descripcion` | `String` | - | Descripción de la transacción |
| `fecha` | `DateTime` | - | Fecha de la transacción |
| `categoriaId` | `Int?` | - | ID de la categoría |
| `personaId` | `Int?` | - | ID de la persona |
| `campanaId` | `Int?` | - | ID de la campaña |
| `comprobante` | `String?` | - | Archivo de comprobante |
| `aprobado` | `Boolean` | `@default(false)` | Estado de aprobación |
| `createdAt` | `DateTime` | `@default(now())` | Fecha de creación |
| `updatedAt` | `DateTime` | `@updatedAt` | Fecha de última actualización |

**Relaciones**:
- `categoria` → `Categoria?` (N:1)
- `persona` → `Persona?` (N:1)
- `campana` → `Campana?` (N:1)

**Enums**:
```typescript
enum TipoTransaccion {
  INGRESO
  GASTO
}
```

**Ejemplo de datos**:
```json
{
  "id": 1,
  "tipo": "GASTO",
  "monto": 150000,
  "descripcion": "Pago de publicidad en Facebook",
  "fecha": "2025-01-15T00:00:00.000Z",
  "categoriaId": 2,
  "personaId": 4,
  "aprobado": true
}
```

---

### 8. 📊 **DistribucionUtilidades** (`distribucion_utilidades`)

**Descripción**: Distribución de utilidades por campaña.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | `Int` | `@id @default(autoincrement())` | Identificador único |
| `campanaId` | `Int` | - | ID de la campaña |
| `utilidadTotal` | `Float` | - | Utilidad total a distribuir |
| `fecha` | `DateTime` | `@default(now())` | Fecha de distribución |
| `descripcion` | `String?` | - | Descripción opcional |
| `aprobado` | `Boolean` | `@default(false)` | Estado de aprobación |
| `createdAt` | `DateTime` | `@default(now())` | Fecha de creación |
| `updatedAt` | `DateTime` | `@updatedAt` | Fecha de última actualización |

**Relaciones**:
- `campana` → `Campana` (N:1)
- `detalles` → `DistribucionDetalle[]` (1:N)

**Ejemplo de datos**:
```json
{
  "id": 1,
  "campanaId": 2,
  "utilidadTotal": 500000,
  "fecha": "2025-02-01T00:00:00.000Z",
  "descripcion": "Distribución de utilidades Q1 2025",
  "aprobado": true
}
```

---

### 9. 📋 **DistribucionDetalle** (`distribucion_detalles`)

**Descripción**: Detalle de distribución de utilidades por persona.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | `Int` | `@id @default(autoincrement())` | Identificador único |
| `distribucionId` | `Int` | - | ID de la distribución |
| `personaId` | `Int` | - | ID de la persona |
| `porcentajeParticipacion` | `Float` | - | Porcentaje de participación |
| `montoDistribuido` | `Float` | - | Monto distribuido |
| `createdAt` | `DateTime` | `@default(now())` | Fecha de creación |
| `updatedAt` | `DateTime` | `@updatedAt` | Fecha de última actualización |

**Relaciones**:
- `distribucion` → `DistribucionUtilidades` (N:1)
- `persona` → `Persona` (N:1)

**Ejemplo de datos**:
```json
{
  "id": 1,
  "distribucionId": 1,
  "personaId": 4,
  "porcentajeParticipacion": 35,
  "montoDistribuido": 175000
}
```

---

### 10. 👤 **Usuario** (`usuarios`)

**Descripción**: Usuarios del sistema para autenticación.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | `Int` | `@id @default(autoincrement())` | Identificador único |
| `email` | `String` | `@unique` | Email (único) |
| `password` | `String` | - | Contraseña encriptada |
| `nombre` | `String` | - | Nombre del usuario |
| `rol` | `RolUsuario` | `@default(USER)` | Rol del usuario |

**Enums**:
```typescript
enum RolUsuario {
  ADMIN
  USER
}
```

---

## 🔗 Diagrama de Relaciones

```
Rol (1) ←→ (N) Persona (1) ←→ (N) ValorHora
  ↑                                    ↑
  └────────── (1) ←→ (N) ──────────────┘

Persona (1) ←→ (N) RegistroHoras
Persona (1) ←→ (N) Transaccion
Persona (1) ←→ (N) DistribucionDetalle

Categoria (1) ←→ (N) Transaccion

Campana (1) ←→ (N) Transaccion
Campana (1) ←→ (N) DistribucionUtilidades (1) ←→ (N) DistribucionDetalle
```

---

## 📈 Estadísticas Actuales

### **Datos Reales del Sistema:**

- **Total Personas**: 5
- **Total Roles**: 5
- **Total Categorías**: 7
- **Total Transacciones**: 93
- **Total Aportes**: $7,683,438
- **Total Gastos**: $14,836,456
- **Total Ingresos**: $0

### **Distribución de Participación:**
- **CEO**: 35% (Andrés Salamanca)
- **Coordinadora**: 30% (Salma Quimbayo)
- **Diseñador J**: 20% (Juan Varón)
- **Diseñador A**: 15% (Anthony Sierra)
- **Negocio**: 0% (Caja de Negocio)

---

## 🛠️ Comandos Útiles

### **Prisma CLI:**
```bash
# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev

# Abrir Prisma Studio
npx prisma studio

# Ejecutar seed
npx prisma db seed

# Resetear base de datos
npx prisma migrate reset
```

### **Consultas Útiles:**
```sql
-- Ver todas las personas activas
SELECT * FROM personas WHERE activo = 1;

-- Ver transacciones por tipo
SELECT tipo, COUNT(*) as cantidad, SUM(monto) as total
FROM transacciones
GROUP BY tipo;

-- Ver distribución de participación
SELECT p.nombre, p.participacionPorc, r.nombreRol
FROM personas p
JOIN roles r ON p.rolId = r.id
WHERE p.activo = 1;
```

---

## 📝 Notas Importantes

1. **Soft Delete**: Las personas se marcan como inactivas en lugar de eliminarse
2. **Auditoría**: Todos los modelos tienen timestamps de creación y actualización
3. **Relaciones**: Las relaciones están bien definidas con claves foráneas
4. **Enums**: Se usan enums para tipos de transacción y roles de usuario
5. **Valores por defecto**: La mayoría de campos numéricos tienen valor 0 por defecto
6. **Unicidad**: Los nombres de personas, roles y categorías son únicos

---

*Última actualización: 19 de Julio, 2025*
