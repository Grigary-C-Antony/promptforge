import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from './lib/session'

const protectedRoutes = ['/workspace', '/onboarding']
const adminRoutes = ['/admin']

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
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
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
