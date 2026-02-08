'use client';

import { QueryProvider } from '@/components/QueryProvider';
import { AbilityProvider, createAbilityFromPermissions } from '@/contexts/AbilityContext';
import { useUser } from '@/hooks/useUser';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import SecurityService from '@/services/security.service';

function AbilityWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const { data: myPermissions = [] } = useQuery({
    queryKey: ['my-permissions'],
    queryFn: SecurityService.getMyPermissions,
    enabled: !!user?.id,
  });

  const ability = useMemo(() => {
    const hasPermissions = Array.isArray(myPermissions) && myPermissions.length > 0;
    if (hasPermissions) {
      return createAbilityFromPermissions(myPermissions);
    }

    // Fallback de seguridad para evitar lockout visual de administradores
    const roleName = user?.securityRoleName?.toLowerCase() || '';
    const isAdminRole = roleName.includes('admin');
    if (isAdminRole) {
      return createAbilityFromPermissions([{ action: 'manage', subject: 'all' }]);
    }

    return createAbilityFromPermissions([]);
  }, [myPermissions, user?.securityRoleName]);

  return (
    <AbilityProvider ability={ability}>
      {children}
    </AbilityProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AbilityWrapper>
        {children}
      </AbilityWrapper>
    </QueryProvider>
  );
}
