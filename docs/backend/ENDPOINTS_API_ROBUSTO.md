# 📚 Documentación Exhaustiva de Endpoints API Zaiken

> **Base URL:** `http://localhost:3001/api/v1`

---

## 🩺 Health & Info
| Método | Endpoint         | Descripción                  |
|--------|------------------|------------------------------|
| GET    | /health          | Estado del servidor y DB     |
| GET    | /info            | Info general y rutas         |

---

## 👤 Personas
| Método | Endpoint                        | Descripción                        |
|--------|----------------------------------|------------------------------------|
| GET    | /personas                       | Listar todas las personas          |
| POST   | /personas                       | Crear nueva persona                |
| GET    | /personas/:id                   | Obtener persona por ID             |
| PATCH  | /personas/:id                   | Actualizar persona                 |
| DELETE | /personas/:id                   | Eliminar persona                   |
| GET    | /personas/active                | Listar personas activas            |
| GET    | /personas/summary               | Resumen global de personas         |
| GET    | /personas/:id/stats             | Estadísticas de una persona        |

**Ejemplo de respuesta:**
```json
{
  "success": true,
  "message": "Personas obtenidas exitosamente",
  "data": [ { "id": 1, "nombre": "Andrés", ... } ]
}
```

---

## 🏷️ Roles
| Método | Endpoint                        | Descripción                        |
|--------|----------------------------------|------------------------------------|
| GET    | /roles                          | Listar todos los roles             |
| POST   | /roles                          | Crear nuevo rol                    |
| GET    | /roles/:id                      | Obtener rol por ID                 |
| PATCH  | /roles/:id                      | Actualizar rol                     |
| DELETE | /roles/:id                      | Eliminar rol                       |
| GET    | /roles/active                   | Listar roles activos               |
| GET    | /roles/:id/stats                | Estadísticas de un rol             |

---

## 💸 Transacciones
| Método | Endpoint                                 | Descripción                          |
|--------|-------------------------------------------|--------------------------------------|
| GET    | /transacciones                            | Listar todas las transacciones       |
| POST   | /transacciones                            | Crear nueva transacción              |
| GET    | /transacciones/:id                        | Obtener transacción por ID           |
| PATCH  | /transacciones/:id                        | Actualizar transacción               |
| DELETE | /transacciones/:id                        | Eliminar transacción                 |
| GET    | /transacciones/recent                     | Últimas transacciones                |
| GET    | /transacciones/pending                    | Transacciones pendientes             |
| GET    | /transacciones/stats                      | Estadísticas generales               |
| GET    | /transacciones/resumen-categorias         | Resumen por categorías               |
| GET    | /transacciones/tendencias-mensuales       | Tendencias mensuales                 |
| PATCH  | /transacciones/:id/approve                | Aprobar transacción                  |
| PATCH  | /transacciones/:id/reject                 | Rechazar transacción                 |

**Parámetros comunes:**
- `fechaInicio`, `fechaFin`, `tipoId`, `categoria`, `personaId`, `campanaId`, `aprobado`

---

## 🗂️ Categorías
| Método | Endpoint                        | Descripción                        |
|--------|----------------------------------|------------------------------------|
| GET    | /categorias                     | Listar todas las categorías        |
| POST   | /categorias                     | Crear nueva categoría              |
| GET    | /categorias/:id                 | Obtener categoría por ID           |
| PATCH  | /categorias/:id                 | Actualizar categoría               |
| DELETE | /categorias/:id                 | Eliminar categoría                 |

---

## 🏷️ Tipos de Transacción
| Método | Endpoint                        | Descripción                        |
|--------|----------------------------------|------------------------------------|
| GET    | /tipos-transaccion              | Listar todos los tipos             |
| POST   | /tipos-transaccion              | Crear nuevo tipo                   |
| GET    | /tipos-transaccion/:id          | Obtener tipo por ID                |
| PATCH  | /tipos-transaccion/:id          | Actualizar tipo                    |
| DELETE | /tipos-transaccion/:id          | Eliminar tipo                      |

---

## 📊 Campañas
| Método | Endpoint                        | Descripción                        |
|--------|----------------------------------|------------------------------------|
| GET    | /campanas                       | Listar todas las campañas          |
| POST   | /campanas                       | Crear nueva campaña                |
| GET    | /campanas/:id                   | Obtener campaña por ID             |
| PATCH  | /campanas/:id                   | Actualizar campaña                 |
| DELETE | /campanas/:id                   | Eliminar campaña                   |
| GET    | /campanas/stats                 | Estadísticas de campañas           |

---

## 💰 Distribución de Utilidades
| Método | Endpoint                                 | Descripción                          |
|--------|-------------------------------------------|--------------------------------------|
| GET    | /distribucion-utilidades                  | Listar todas las distribuciones      |
| POST   | /distribucion-utilidades                  | Crear nueva distribución             |
| GET    | /distribucion-utilidades/:id              | Obtener distribución por ID          |
| PATCH  | /distribucion-utilidades/:id              | Actualizar distribución              |
| DELETE | /distribucion-utilidades/:id              | Eliminar distribución                |
| GET    | /distribucion-utilidades/stats            | Estadísticas de utilidades           |
| POST   | /distribucion-utilidades/:id/distribuir-automatico | Distribución automática     |

---

## 📦 Ejemplos de Respuesta y Estructura Real

### /transacciones/stats
**Respuesta:**
```json
{
  "success": true,
  "message": "Estadísticas obtenidas exitosamente",
  "data": {
    "total": 95,
    "ingresos": 543000,
    "gastos": 14786351,
    "utilidad": -14243351,
    "personas": [
      {
        "personaId": 4,
        "nombre": "Andrés Salamanca",
        "aportes": 543000,
        "gastos": 5088280,
        "utilidades": 6840
      },
      ...
    ],
    "campanas": [
      {
        "campanaId": 2,
        "nombre": "Interacción likes",
        "ingresos": 0,
        "gastos": 17907,
        "utilidad": -17907
      },
      ...
    ]
  }
}
```

### /transacciones/resumen-categorias
**Respuesta:**
```json
{
  "success": true,
  "message": "Resumen por categorías obtenido exitosamente",
  "data": [
    {
      "categoria": "Sin categoría",
      "totalIngresos": 0,
      "totalGastos": 14786351,
      "balance": -14786351,
      "transacciones": 92
    },
    ...
  ]
}
```

### /personas/summary
**Respuesta:**
```json
{
  "success": true,
  "message": "Resumen de personas obtenido exitosamente",
  "data": {
    "totalPersonas": 5,
    "totalParticipacion": 100,
    "participacionDisponible": 0,
    "horasTotales": 0,
    "aportesTotales": 7683438,
    "inversionTotal": 7683438,
    "valorHoraPromedio": 5472,
    "participacionPromedio": 20
  }
}
```

### /campanas/stats
**Respuesta (con filtros):**
```json
[
  {
    "id": 1,
    "nombre": "Campaña A",
    "descripcion": "Campaña de ejemplo",
    "ingresos": 100000,
    "gastos": 50000,
    "utilidad": 50000,
    "totalTransacciones": 10
  },
  ...
]
```
**Respuesta (sin filtros):**
```json
{
  "totalCampanas": 12,
  "campanasActivas": 5,
  "campanasFinalizadas": 4,
  "campanasFuturas": 3
}
```

### /personas/:id/stats
**Respuesta:**
```json
{
  "success": true,
  "message": "Estadísticas de persona obtenidas exitosamente",
  "data": {
    "persona": {
      "id": 1,
      "nombre": "Andrés",
      ...
    },
    "estadisticas": {
      "transacciones": {
        "total": 10,
        "montoTotal": 100000
      },
      "horas": {
        "registros": 5,
        "horasTotales": 40
      },
      "valorHora": 5000,
      "distribuciones": {
        "total": 2,
        "montoRecibido": 20000
      },
      "ingresosPorHora": 200000
    }
  }
}
```

### /transacciones/resumen-categorias (estructura de cada ítem)
```json
{
  "categoria": "Publicidad",
  "totalIngresos": 200000,
  "totalGastos": 150000,
  "balance": 50000,
  "transacciones": 8
}
```

### /personas
**Respuesta:**
```json
{
  "success": true,
  "message": "Personas obtenidas exitosamente",
  "data": [
    {
      "id": 1,
      "nombre": "Andrés Salamanca",
      "email": "andres@ejemplo.com",
      "rolId": 2,
      "aportesTotales": 543000,
      "utilidades": 6840,
      "horasTotales": 0,
      "valorHora": 5472,
      ...
    },
    {
      "id": 2,
      "nombre": "Salma Quimbayo",
      "email": "salma@ejemplo.com",
      "rolId": 3,
      "aportesTotales": 0,
      "utilidades": 6840,
      ...
    }
  ]
}
```

> **Nota:** Para dashboards de aportes y utilidades por persona, se recomienda consumir este endpoint y mapear los campos `nombre`, `aportesTotales` y `utilidades`.

---

**Todos los endpoints devuelven `{ success, message, data }` o un array de objetos según corresponda.**

---

## 🛡️ Seguridad y Buenas Prácticas
- Todas las respuestas siguen el formato `{ success, message, data }`.
- Usa HTTPS en producción.
- Aplica validaciones y sanitización de datos en todos los endpoints.
- Usa paginación y filtros para endpoints de listados grandes.
- Protege endpoints sensibles con autenticación (planificado).
- Todos los endpoints aceptan y devuelven JSON.

---

## 📌 Notas
- **CORS**: Configurado para permitir peticiones desde el frontend.
- **Versionado**: Todos los endpoints están bajo `/api/v1`.
- **Base de datos**: SQLite en desarrollo, PostgreSQL en producción.
- **ORM**: Prisma.

---

**Actualizado: Julio 2025**

---

### `/roles`
**Respuesta:**
```json
{
  "success": true,
  "message": "Roles obtenidos exitosamente",
  "data": [
    {
      "id": 1,
      "nombreRol": "Administrador",
      "importancia": 10,
      "descripcion": "Rol con todos los permisos",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "_count": { "personas": 3 }
    },
    {
      "id": 2,
      "nombreRol": "Colaborador",
      "importancia": 5,
      "descripcion": "Rol operativo",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "_count": { "personas": 7 }
    }
  ]
}
```

---

### `/gastos` (vía `/transacciones?tipo=gasto`)
**Respuesta:**
```json
{
  "success": true,
  "message": "Transacciones obtenidas exitosamente",
  "data": [
    {
      "id": 101,
      "fecha": "2024-07-01",
      "monto": 120000,
      "tipo": "gasto",
      "categoriaId": 2,
      "categoria": { "id": 2, "nombre": "Publicidad" },
      "personaId": 4,
      "persona": { "id": 4, "nombre": "Andrés Salamanca" },
      "descripcion": "Pago Facebook Ads",
      "createdAt": "2024-07-01T12:00:00.000Z",
      "updatedAt": "2024-07-01T12:00:00.000Z"
    },
    ...
  ]
}
```

---

### `/tipos-transaccion`
**Respuesta:**
```json
{
  "success": true,
  "message": "Tipos de transacción obtenidos exitosamente",
  "data": [
    {
      "id": 1,
      "nombre": "Ingreso",
      "descripcion": "Entradas de dinero",
      "activo": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "nombre": "Gasto",
      "descripcion": "Salidas de dinero",
      "activo": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### `/categorias`
**Respuesta:**
```json
{
  "success": true,
  "message": "Categorías obtenidas exitosamente",
  "data": [
    {
      "id": 1,
      "nombre": "Publicidad",
      "descripcion": "Gastos en marketing",
      "tipoTransaccionId": 2,
      "activo": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    ...
  ]
}
```

---

### `/transacciones`
**Respuesta:**
```json
{
  "success": true,
  "message": "Transacciones obtenidas exitosamente",
  "data": [
    {
      "id": 201,
      "fecha": "2024-07-01",
      "monto": 543000,
      "tipo": "ingreso",
      "categoriaId": 1,
      "categoria": { "id": 1, "nombre": "Ventas" },
      "personaId": 4,
      "persona": { "id": 4, "nombre": "Andrés Salamanca" },
      "descripcion": "Venta producto A",
      "createdAt": "2024-07-01T12:00:00.000Z",
      "updatedAt": "2024-07-01T12:00:00.000Z"
    },
    ...
  ]
}
```

---

### `/distribucion-utilidades`
**Respuesta:**
```json
{
  "success": true,
  "message": "Distribución de utilidades obtenida exitosamente",
  "data": [
    {
      "id": 1,
      "periodo": "2024-Q2",
      "totalUtilidad": 1000000,
      "fechaDistribucion": "2024-07-10",
      "detalle": [
        { "personaId": 4, "nombre": "Andrés Salamanca", "utilidad": 6840 },
        { "personaId": 5, "nombre": "Salma Quimbayo", "utilidad": 6840 }
      ],
      "createdAt": "2024-07-10T12:00:00.000Z",
      "updatedAt": "2024-07-10T12:00:00.000Z"
    },
    ...
  ]
}
```

---

### `/distribucion-detalle`
**Respuesta:**
```json
{
  "success": true,
  "message": "Detalle de distribución obtenido exitosamente",
  "data": [
    {
      "id": 1,
      "distribucionId": 1,
      "personaId": 4,
      "nombre": "Andrés Salamanca",
      "utilidad": 6840,
      "createdAt": "2024-07-10T12:00:00.000Z",
      "updatedAt": "2024-07-10T12:00:00.000Z"
    },
    ...
  ]
}
```
