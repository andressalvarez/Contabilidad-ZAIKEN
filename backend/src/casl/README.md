# 🛡️ Sistema de Permisos CASL

Este módulo implementa autorización granular basada en CASL (Code Access Security Layer).

## 📚 Componentes

### 1. Action Enum
Define las acciones disponibles en el sistema.

```typescript
export enum Action {
  Manage = 'manage',  // Todos los permisos
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
  Approve = 'approve',  // Para aprobación de horas
  Reject = 'reject',    // Para rechazo de horas
}
```

### 2. Subjects Type
Define las entidades del sistema sobre las que se pueden aplicar permisos.

### 3. CaslAbilityFactory
Genera las capacidades (abilities) para cada usuario según su rol.

#### Roles y Permisos:

**SUPER_ADMIN**
- ✅ Acceso total a todo el sistema

**ADMIN_NEGOCIO**
- ✅ Acceso total a su negocio
- ⚠️ Restricción por `negocioId` a nivel de servicio

**ADMIN**
- ✅ Gestión completa de usuarios, personas, campañas, categorías
- ✅ Gestión de transacciones y horas
- ✅ Aprobar/rechazar horas
- ✅ Gestión de distribuciones y VS

**MANAGER**
- ✅ Lectura de usuarios
- ✅ Gestión de personas (lectura/actualización)
- ✅ Creación y edición de campañas
- ✅ Gestión de transacciones
- ✅ Aprobar/rechazar horas
- ❌ No puede eliminar campañas ni categorías

**EMPLEADO**
- ✅ Lectura de campañas y categorías
- ✅ Creación de registro de horas
- ✅ Editar/eliminar sus propias horas NO aprobadas
- ✅ Ver y editar su perfil
- ❌ No puede aprobar horas

**USER**
- ✅ Lectura básica de campañas, categorías y transacciones
- ✅ Ver y editar su perfil
- ❌ Permisos muy limitados

### 4. PoliciesGuard
Guard que valida los permisos en los endpoints.

### 5. @CheckPolicies Decorator
Decorator para aplicar políticas de permisos en los controllers.

## 🚀 Uso

### Instalar dependencias

```bash
npm install @casl/ability @casl/prisma
```

### En Controllers

```typescript
import { CheckPolicies } from '../casl/check-policies.decorator';
import { PoliciesGuard } from '../casl/policies.guard';
import { Action } from '../casl/action.enum';
import { UseGuards } from '@nestjs/common';

@Controller('campanas')
@UseGuards(PoliciesGuard)
export class CampanasController {

  @Post()
  @CheckPolicies((ability) => ability.can(Action.Create, 'Campana'))
  async create(@Body() dto: CreateCampanaDto) {
    // Solo usuarios con permiso para crear campañas pueden acceder
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'Campana'))
  async remove(@Param('id') id: number) {
    // Solo usuarios con permiso para eliminar pueden acceder
  }

  @Patch(':id/aprobar')
  @CheckPolicies((ability) => ability.can(Action.Approve, 'RegistroHoras'))
  async aprobar(@Param('id') id: number) {
    // Solo ADMIN, ADMIN_NEGOCIO, MANAGER pueden aprobar
  }
}
```

### Verificación programática

```typescript
import { CaslAbilityFactory } from '../casl/casl-ability.factory';

constructor(private caslAbilityFactory: CaslAbilityFactory) {}

async someMethod(user: User) {
  const ability = this.caslAbilityFactory.createForUser(user);

  if (ability.can(Action.Delete, 'Campana')) {
    // Usuario puede eliminar campañas
  }

  if (ability.can(Action.Approve, 'RegistroHoras')) {
    // Usuario puede aprobar horas
  }
}
```

## 🔐 Matriz de Permisos

| Acción | SUPER_ADMIN | ADMIN_NEGOCIO | ADMIN | MANAGER | EMPLEADO | USER |
|--------|-------------|---------------|-------|---------|----------|------|
| Gestionar usuarios | ✅ | ✅ | ✅ (R/U/C) | ❌ | ❌ | ❌ |
| Crear campañas | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Eliminar campañas | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Aprobar horas | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Registrar horas | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Editar horas propias | ✅ | ✅ | ✅ | ✅ | ✅ (no aprobadas) | ❌ |
| Ver distribuciones | ✅ | ✅ | ✅ | ✅ (solo lectura) | ❌ | ❌ |

## 📝 Notas

- Los permisos se evalúan en el backend, NO en el frontend
- El frontend puede usar CASL para mostrar/ocultar elementos UI, pero la seguridad real está en el backend
- La restricción por `negocioId` se maneja a nivel de servicio (multi-tenant)
- CASL solo valida permisos de acción sobre entidades
