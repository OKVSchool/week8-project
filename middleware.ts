import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const start = Date.now()
  const { pathname, method } = { pathname: request.nextUrl.pathname, method: request.method }

  console.log(JSON.stringify({
    level: 'info',
    event: 'request.start',
    method,
    route: pathname,
    ts: new Date().toISOString(),
  }))

  const response = NextResponse.next()

  console.log(JSON.stringify({
    level: 'info',
    event: 'request.end',
    method,
    route: pathname,
    status: response.status,
    ms: Date.now() - start,
    ts: new Date().toISOString(),
  }))

  return response
}

export const config = {
  matcher: '/api/:path*',
}
