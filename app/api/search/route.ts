import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { Client } from 'pg'

// Module-level singleton so the model survives warm Lambda reuse
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let extractor: any = null

async function getExtractor() {
  if (extractor) return extractor
  // Dynamic import required — @xenova/transformers is ESM-only
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod = await import('@xenova/transformers') as any
  mod.env.cacheDir = '/tmp/.cache/transformers'
  extractor = await mod.pipeline(
    'feature-extraction',
    'Xenova/all-MiniLM-L6-v2',
    { quantized: true }
  )
  return extractor
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')

  if (!query) {
    return Response.json({ error: 'q parameter is required' }, { status: 400 })
  }

  try {
    logger.info('search.start', { query })

    const embed = await getExtractor()
    const output = await embed([query], { pooling: 'mean', normalize: true })
    const vec = '[' + output.tolist()[0].join(',') + ']'

    const db = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
    await db.connect()

    const { rows } = await db.query(
      `SELECT source,
              content,
              1 - (embedding <=> $1::vector) AS score
       FROM   chunks
       ORDER  BY embedding <=> $1::vector
       LIMIT  3`,
      [vec]
    )

    await db.end()

    logger.info('search.complete', { query, resultCount: rows.length })

    return Response.json({
      query,
      results: rows.map((r: { source: string; content: string; score: string }) => ({
        source: r.source,
        score:  parseFloat(r.score).toFixed(4),
        text:   r.content.substring(0, 300),
      })),
    })
  } catch (err) {
    logger.error('search.failed', { error: err instanceof Error ? err.message : 'unknown' })
    return Response.json({ error: 'search failed' }, { status: 500 })
  }
}
