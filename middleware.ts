import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  // Rotas públicas
  if (
    path.startsWith('/auth') ||
    path === '/' ||
    path.startsWith('/barbershops') ||
    path.startsWith('/api/auth') ||
    path.startsWith('/api/barbershops') ||
    path.startsWith('/_next') ||
    path.startsWith('/manifest.json') ||
    path.startsWith('/sw.js')
  ) {
    return NextResponse.next()
  }

  // Rotas protegidas requerem autenticação
  if (!token) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  // Proteger rotas de admin
  if (path.startsWith('/admin')) {
    if (token.role !== 'ADMIN_GLOBAL') {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }
  }

  // Proteger rotas de barbeiro
  if (path.startsWith('/app/barbershop')) {
    if (token.role !== 'BARBEIRO') {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }
  }

  // Proteger rotas de cliente
  if (path.startsWith('/app/customer')) {
    if (token.role !== 'CLIENTE') {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/app/:path*',
    '/api/:path*',
  ],
}
