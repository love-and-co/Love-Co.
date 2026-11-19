import { NextResponse } from 'next/server';

const REQUIRED_ADMIN_EMAIL = 'loveandcoadmin@gmail.com';

/**
 * Next.js Edge Middleware for Strict Love & Co. Flagship RBAC.
 * Strictly permits ONLY role === 'admin' with email === 'loveandcoadmin@gmail.com'.
 * Anyone else is redirected immediately to '/'.
 */
export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('love_co_token')?.value;

    // No session token -> redirect to / immediately
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);

        // Expired session -> redirect to / and clear cookie
        if (payload.exp && Date.now() >= payload.exp * 1000) {
          const res = NextResponse.redirect(new URL('/', request.url));
          res.cookies.delete('love_co_token');
          return res;
        }

        // Strictly enforce role === 'admin' && email === 'loveandcoadmin@gmail.com'
        const isStrictAdmin =
          payload.role === 'admin' &&
          (payload.email || '').toLowerCase().trim() === REQUIRED_ADMIN_EMAIL;

        if (!isStrictAdmin) {
          return NextResponse.redirect(new URL('/', request.url));
        }
      }
    } catch (err) {
      const res = NextResponse.redirect(new URL('/', request.url));
      res.cookies.delete('love_co_token');
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
