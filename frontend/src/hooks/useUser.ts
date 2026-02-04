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
 * Decodifica un JWT (sin verificar firma - solo para extraer datos)
 * NOTA: Nunca confiar en estos datos para seguridad. La validación real está en el backend.
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
    console.error('Error decodificando JWT:', error);
    return null;
  }
}

/**
 * Hook para obtener información del usuario actual desde el JWT
 *
 * @example
 * const { user, loading } = useUser();
 *
 * if (loading) return <div>Cargando...</div>;
 * if (!user) return <div>No autenticado</div>;
 *
 * return <div>Hola {user.email}</div>;
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
