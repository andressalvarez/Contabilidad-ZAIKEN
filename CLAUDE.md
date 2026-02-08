# Claude Guidelines

- Nunca usar `window.alert`, `window.confirm` ni `window.prompt` en frontend.
- Usar siempre los popups/modales de la app (`showConfirm`, `showAlert`, `showPrompt`) y notificaciones `toast` para feedback.

## Commit Standard (Dev Local)

- Todos los commits locales pasan por hook `pre-commit` (ruta `.githooks/pre-commit`).
- El hook ejecuta `scripts/precommit-dev.js` para:
- Limpiar texto sospechoso de mojibake en archivos staged.
- Ejecutar lint con auto-fix solo sobre archivos staged:
- Frontend: `next lint --fix --file ...`
- Backend: `eslint --fix ...`
- Ejecutar verificación final de mojibake (`frontend/scripts/check-mojibake.js`).
- Re-stagea cambios auto-fix y bloquea el commit si algo falla.

## Mensaje de Commit

- Formato recomendado: `<tipo>: <resumen corto en infinitivo>`
- Tipos permitidos: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf`, `build`, `ci`.
- Ejemplos:
- `fix: corregir permisos en roles de seguridad`
- `chore: limpiar textos con mojibake en frontend`
