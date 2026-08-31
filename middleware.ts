import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export function middleware(request: NextRequest) {
  const start = Date.now()
  const method = request.method
  const route = request.nextUrl.pathname

  logger.info('request.start', { method, route })

  const response = NextResponse.next()

  logger.info('request.end', { method, route, status: response.status, ms: Date.now() - start })

  return response
}

export const config = {
  matcher: '/api/:path*',
}
