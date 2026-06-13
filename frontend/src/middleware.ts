import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const TOKEN_COOKIE = 'taskflow_token'
const REFRESH_COOKIE = 'taskflow_refresh'

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

function hasAuthCookie(request: NextRequest): boolean {
  return Boolean(
    request.cookies.get(TOKEN_COOKIE)?.value ||
      request.cookies.get(REFRESH_COOKIE)?.value,
  )
}

function isAppRoute(pathname: string): boolean {
  return APP_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasAuth = hasAuthCookie(request)

  if (pathname === '/') {
    const target = hasAuth ? '/dashboard' : '/login'
    return NextResponse.redirect(new URL(target, request.url))
  }

  if (isAppRoute(pathname) && !hasAuth) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (AUTH_PAGES.has(pathname) && hasAuth) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
