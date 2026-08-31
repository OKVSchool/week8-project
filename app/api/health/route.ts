import { logger } from '@/lib/logger'

export async function GET() {
  try {
    logger.debug('health.check.verbose', { env: process.env.NODE_ENV })
    logger.info('health.check', { status: 'ok' })
    return Response.json({ status: 'ok' })
  } catch (err) {
    logger.error('health.check.failed', { error: err instanceof Error ? err.message : 'unknown' })
    return Response.json({ status: 'error' }, { status: 500 })
  }
}
