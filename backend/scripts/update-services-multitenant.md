# Script de Actualización de Servicios Multi-Tenant

## Servicios Actualizados ✅

1. **CategoriasService** ✅
   - [x] Service actualizado con negocioId
   - [x] Controller usa @NegocioId()

2. **CampanasService** ✅
   - [x] Service actualizado con negocioId
   - [x] Controller usa @NegocioId()

## Servicios Pendientes ⏳

### 3. PersonasService
- [ ] Actualizar service
- [ ] Actualizar controller

### 4. TransaccionesService (COMPLEJO)
- [ ] Actualizar service
- [ ] Actualizar controller

### 5. RegistroHorasService
- [ ] Actualizar service
- [ ] Actualizar controller

### 6. ValorHoraService
- [ ] Actualizar service
- [ ] Actualizar controller

### 7. DistribucionUtilidadesService
- [ ] Actualizar service
- [ ] Actualizar controller

### 8. DistribucionDetalleService
- [ ] Actualizar service
- [ ] Actualizar controller

### 9. UsuariosService
- [ ] Actualizar service
- [ ] Actualizar controller

### 10. VSCategoriasService
- [ ] Actualizar service
- [ ] Actualizar controller

## Patrón de Actualización

### Service:
```typescript
// ANTES
async findAll() {
  return this.prisma.modelo.findMany({
    where: { activo: true },
  });
}

async create(dto) {
  return this.prisma.modelo.create({ data: dto });
}

// DESPUÉS
async findAll(negocioId: number) {
  return this.prisma.modelo.findMany({
    where: {
      negocioId,
      activo: true,
    },
  });
}

async create(negocioId: number, dto) {
  return this.prisma.modelo.create({
    data: {
      ...dto,
      negocioId,
    },
  });
}
```

### Controller:
```typescript
// ANTES
@Get()
findAll() {
  return this.service.findAll();
}

// DESPUÉS
import { NegocioId } from '../auth/negocio-id.decorator';

@Get()
findAll(@NegocioId() negocioId: number) {
  return this.service.findAll(negocioId);
}
```

## Notas

- Siempre agregar `ForbiddenException` al import
- En `findOne`, `update`, `remove`: validar que el registro pertenezca al negocio
- En métodos con filtros complejos: agregar `negocioId` primero en el where
- En includes/joins: también filtrar por `negocioId`
