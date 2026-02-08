-- Fix legacy mojibake text in audit descriptions.
-- Idempotent: safe to run multiple times.

UPDATE security_audit_logs
SET description = REPLACE(description, 'sesiÃ³n', 'sesion')
WHERE description LIKE '%sesiÃ³n%';

UPDATE security_audit_logs
SET description = REPLACE(description, 'sesiÃƒÂ³n', 'sesion')
WHERE description LIKE '%sesiÃƒÂ³n%';

UPDATE security_audit_logs
SET description = REPLACE(description, 'invÃ¡lidas', 'invalidas')
WHERE description LIKE '%invÃ¡lidas%';

UPDATE security_audit_logs
SET description = REPLACE(description, 'invÃƒÂ¡lidas', 'invalidas')
WHERE description LIKE '%invÃƒÂ¡lidas%';

UPDATE security_audit_logs
SET description = REPLACE(description, 'contraseÃ±a', 'contrasena')
WHERE description LIKE '%contraseÃ±a%';

UPDATE security_audit_logs
SET description = REPLACE(description, 'contraseÃƒÂ±a', 'contrasena')
WHERE description LIKE '%contraseÃƒÂ±a%';

UPDATE security_audit_logs
SET description = REPLACE(description, 'recuperaciÃ³n', 'recuperacion')
WHERE description LIKE '%recuperaciÃ³n%';

UPDATE security_audit_logs
SET description = REPLACE(description, 'recuperaciÃƒÂ³n', 'recuperacion')
WHERE description LIKE '%recuperaciÃƒÂ³n%';

UPDATE security_audit_logs
SET description = REPLACE(description, 'configuraciÃ³n', 'configuracion')
WHERE description LIKE '%configuraciÃ³n%';

UPDATE security_audit_logs
SET description = REPLACE(description, 'configuraciÃƒÂ³n', 'configuracion')
WHERE description LIKE '%configuraciÃƒÂ³n%';
