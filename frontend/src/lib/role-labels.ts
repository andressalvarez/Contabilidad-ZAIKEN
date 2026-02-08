export function formatSystemRoleName(roleName?: string | null): string {
  if (!roleName) return 'Sin rol de sistema';
  if (roleName.trim().toLowerCase() === 'empleado') return 'Colaborador';
  return roleName;
}
