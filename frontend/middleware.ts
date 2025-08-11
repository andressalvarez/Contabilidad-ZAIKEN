import { NextRequest, NextResponse } from 'next/server';

// Rutas públicas (no requieren sesión)
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/favicon.ico',
  '/_next',
  '/healthz',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Normalizar removiendo trailing slash
  const path = pathname.replace(/\/+$/, '') || '/';

  // Bypass explícito para login/register (evita cualquier edge-case en prod)
  if (path === '/login' || path === '/register') {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + '/'));
  if (isPublic) return NextResponse.next();

  const token = req.cookies.get('auth_token')?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    if (pathname !== '/login') url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Excluir explícitamente /register del alcance del middleware para evitar 307
  matcher: ['/((?!_next/static|_next/image|favicon.ico|register).*)'],
};


