import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { resolveMiddlewareAuth } from '@/lib/auth/middleware-auth'

const AUTH_PAGES = new Set(['/login', '/register', '/forgot-password'])

const APP_ROUTE_PREFIXES = [
  '/dashboard',
  '/list',
  '/board',
  '/calendar',
  '/matrix',
  '/habits',
  '/pomodoro',
  '/countdown',
  '/profile',
  '/settings',
  '/achievements',
  '/admin',
]

function isAppRoute(pathname: string): boolean {
  return APP_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

function isAdminRoute(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const auth = await resolveMiddlewareAuth(request)

  if (pathname === '/') {
    const target = auth.authenticated ? '/dashboard' : '/login'
    return NextResponse.redirect(new URL(target, request.url))
  }

  if (isAppRoute(pathname) && !auth.authenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAdminRoute(pathname) && auth.authenticated && auth.role && auth.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (AUTH_PAGES.has(pathname) && auth.authenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
