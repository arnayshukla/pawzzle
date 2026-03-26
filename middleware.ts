import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from './lib/session';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isProtectedRoute = path.startsWith('/admin') || path.startsWith('/api/admin');
  const isLoginRoute = path === '/admin/login' || path === '/api/admin/login';

  if (!isProtectedRoute || isLoginRoute) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('admin_session')?.value;
  const session = await verifySession(sessionCookie);

  if (!session) {
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized request. Admin access required.' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
