import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from './lib/session'

const protectedRoutes = ['/workspace', '/onboarding']
const adminRoutes = ['/admin']

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (rateLimitMap.size > 10000) rateLimitMap.clear(); // Basic memory management

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) return false;

  record.count++;
  return true;
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';

  // Rate Limiting (10 requests per minute for sensitive endpoints)
  const isRateLimitedPath = path === '/api/generate' || path === '/api/seed' || path === '/admin/login';
  if (req.method === 'POST' && isRateLimitedPath) {
    if (!checkRateLimit(ip, 10, 60000)) {
      return new NextResponse(JSON.stringify({ error: 'Too Many Requests' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))
  const isAdminRoute = adminRoutes.some(route => path.startsWith(route))

  if (isProtectedRoute || isAdminRoute) {
    const sessionCookie = req.cookies.get('session')?.value
    if (!sessionCookie) {
      if (isAdminRoute && path !== '/admin/login') {
         return NextResponse.redirect(new URL('/admin/login', req.nextUrl))
      }
      if (!isAdminRoute) return NextResponse.redirect(new URL('/', req.nextUrl))
    }

    if (sessionCookie) {
      const session = await decrypt(sessionCookie)
      if (!session) {
        if (isAdminRoute && path !== '/admin/login') {
           return NextResponse.redirect(new URL('/admin/login', req.nextUrl))
        }
        if (!isAdminRoute) return NextResponse.redirect(new URL('/', req.nextUrl))
      }

      // Check admin permissions
      if (isAdminRoute && path !== '/admin/login' && session.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/workspace', req.nextUrl))
      }

      // If user goes to /admin/login but is already admin, redirect to /admin
      if (path === '/admin/login' && session?.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', req.nextUrl))
      }

      // For workspace/onboarding, ensure they have licenseId or are admin
      if (isProtectedRoute && session?.role !== 'ADMIN' && !session?.licenseId) {
        return NextResponse.redirect(new URL('/', req.nextUrl))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.png$).*)'],
}
