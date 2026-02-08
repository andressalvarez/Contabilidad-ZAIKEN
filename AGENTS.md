# Codex Working Rules (Repo Local)

## Commit Standard

- Antes de commitear, usar el hook local en `.githooks/pre-commit`.
- El hook ejecuta `scripts/precommit-dev.js`.
- El script limpia mojibake en staged, corre lint con `--fix` en staged y valida texto.
- Si falla, no se permite el commit.

## Commit Message Convention

- Formato: `<tipo>: <resumen corto>`
- Tipos: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf`, `build`, `ci`.
- Escribir mensaje claro y concreto sobre el cambio principal.

## Scope

- Este estándar aplica para desarrollo local.
- No modifica la ejecución de producción por sí misma.
