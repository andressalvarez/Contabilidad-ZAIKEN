'use client';

import { useState, useEffect } from 'react';
import { getTokenFromCookies } from '@/lib/auth';

interface User {
  id: number;
  email: string;
  rol: string;
  negocioId: number;
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
    const token =
      getTokenFromCookies() ||
      (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);

    if (token) {
      const decoded = decodeJWT(token);
      if (decoded) {
        setUser({
          id: decoded.sub,
          email: decoded.email,
          rol: decoded.rol,
          negocioId: decoded.negocioId,
        });
      }
    }

    setLoading(false);
  }, []);

  return { user, loading };
}
