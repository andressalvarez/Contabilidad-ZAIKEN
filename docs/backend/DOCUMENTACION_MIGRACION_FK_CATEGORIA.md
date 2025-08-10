# Migración de relación de Categoría en Transacciones: de String a FK

## Resumen
Se migró la relación de categoría en el modelo `Transaccion` de un campo de texto (`categoria: string`) a una clave foránea (`categoriaId: Int?`) apuntando al modelo `Categoria`. Esto mejora la integridad referencial, evita errores de escritura y permite consultas más robustas y eficientes.

---

## 1. Cambios en el modelo de datos (Prisma)
- Se eliminó el campo `categoria: String?` de `Transaccion`.
- Se agregó `categoriaId: Int?` y la relación:
  ```prisma
  categoria   Categoria? @relation(fields: [categoriaId], references: [id])
  ```
- Se agregó la relación inversa en `Categoria`:
  ```prisma
  transacciones Transaccion[]
  ```
- Se aplicaron las migraciones correspondientes.

---

## 2. Migración de datos existentes
- Se creó un script `migrar-categorias.js` para:
  - Buscar transacciones antiguas con el campo `categoria` (string).
  - Crear o asociar la categoría correspondiente y asignar el `categoriaId`.
  - Asignar la categoría "Sin categoría" a las transacciones sin categoría.
- El campo `categoria` fue eliminado tras la migración.

---

## 3. Cambios en el backend (NestJS)
- DTOs de creación y actualización de transacciones usan ahora `categoriaId` (número).
- Servicios y controladores usan y retornan el objeto `categoria` completo.
- Los resúmenes y agrupaciones por categoría usan el FK y muestran el nombre correctamente.

---

## 4. Cambios en el frontend (Next.js/React)
- Formularios y filtros usan `categoriaId` (número) en vez de nombre.
- Los selects de categoría muestran y envían el id.
- Las tablas y vistas muestran el nombre usando `transaccion.categoria?.nombre`.
- Los filtros y búsquedas funcionan por id y nombre de la categoría relacionada.

---

## 5. Pruebas y validación
- Se verificó en Prisma Studio que los datos están correctos y las relaciones FK funcionan.
- Se probó la creación, edición, filtrado y visualización de transacciones y resúmenes por categoría.

---

## 6. Buenas prácticas implementadas
- **Nunca usar strings como FK.**
- **Siempre usar claves foráneas (`Int` + `@relation`) para relaciones entre entidades.**
- **Mantener enums solo para casos simples y estáticos.**
- **Validar integridad referencial en backend y frontend.**

---

## 7. Checklist para futuras migraciones
- [x] Identificar relaciones tipo string y migrar a FK.
- [x] Migrar datos existentes antes de eliminar campos antiguos.
- [x] Actualizar DTOs, servicios y controladores.
- [x] Refactorizar frontend para usar ids y objetos relacionados.
- [x] Probar exhaustivamente la funcionalidad y la integridad de los datos.

---

**¡El sistema ahora es más robusto, seguro y mantenible!**
