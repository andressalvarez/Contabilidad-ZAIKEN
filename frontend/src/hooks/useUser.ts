'use client';

import { useState, useEffect } from 'react';
import { getTokenFromCookies } from '@/lib/auth';
import { AuthService } from '@/services/auth.service';

interface User {
  id: number;
  email: string;
  negocioId: number;
  securityRoleId: number;
  securityRoleName?: string;
  negocioRoleName?: string;
  rolNegocio?: {
    id: number;
    nombreRol: string;
  };
}

/**
 * Decodes a JWT (without verifying signature - only for extracting data)
 * NOTE: Never trust this data for security. Real validation is on the backend.
 */
function decodeJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Hook to get current user information from JWT
 *
 * @example
 * const { user, loading } = useUser();
 *
 * if (loading) return <div>Loading...</div>;
 * if (!user) return <div>Not authenticated</div>;
 *
 * return <div>Hello {user.email}</div>;
 */
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const hydrateUser = async () => {
      const token =
        getTokenFromCookies() ||
        (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);

      if (!token) {
        if (!cancelled) setLoading(false);
        return;
      }

      const decoded = decodeJWT(token);
      if (decoded && !cancelled) {
        setUser({
          id: decoded.sub,
          email: decoded.email,
          negocioId: decoded.negocioId,
          securityRoleId: decoded.securityRoleId,
          securityRoleName: decoded.securityRoleName,
          negocioRoleName: decoded.negocioRoleName,
        });
      }

      try {
        const me = await AuthService.getMe();
        if (!cancelled) {
          setUser({
            id: me.id,
            email: me.email,
            negocioId: me.negocioId,
            securityRoleId: me.securityRoleId,
            securityRoleName: me.securityRole?.name || me.securityRoleName,
            negocioRoleName: me.rolNegocio?.nombreRol || me.negocioRoleName,
            rolNegocio: me.rolNegocio,
          });
        }
      } catch {
        // Keep JWT fallback if /auth/me is temporarily unavailable.
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    hydrateUser();

    return () => {
      cancelled = true;
    };
  }, []);

  return { user, loading };
}
