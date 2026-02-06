'use client';

import { QueryProvider } from '@/components/QueryProvider';
import { AbilityProvider, createAbilityForUser } from '@/contexts/AbilityContext';
import { useUser } from '@/hooks/useUser';
import { useMemo } from 'react';

function AbilityWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useUser();

  const ability = useMemo(() => {
    if (user?.rol) {
      return createAbilityForUser(user.rol);
    }
    // Default: no permissions until user loads
    return createAbilityForUser('');
  }, [user?.rol]);

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
