export const AUTH_COOKIE = 'auth_token';

export function setAuthToken(token: string) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      // Cookie accesible por middleware (no httpOnly)
      const isSecure = window.location.protocol === 'https:';
      document.cookie = `${AUTH_COOKIE}=${token}; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7};${
        isSecure ? ' Secure;' : ''
      }`;
    }
  } catch {}
}

export function clearAuthToken() {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      document.cookie = `${AUTH_COOKIE}=; Path=/; Max-Age=0;`;
    }
  } catch {}
}

export function getTokenFromCookies(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${AUTH_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}



