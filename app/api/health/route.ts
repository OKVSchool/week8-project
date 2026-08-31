import { logger } from '@/lib/logger'

export async function GET() {
  logger.debug('health.check.verbose', { env: process.env.NODE_ENV })
  logger.info('health.check', { status: 'ok' })
  return Response.json({ status: 'ok' })
}
