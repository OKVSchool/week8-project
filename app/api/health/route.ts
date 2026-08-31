import { logger } from '@/lib/logger'

export async function GET() {
  logger.info('health.check', { status: 'ok' })
  return Response.json({ status: 'ok' })
}
