import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { Client } from 'pg'

export async function POST(request: NextRequest) {
  let body: { query?: string; embedding?: number[] }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  const { query, embedding } = body
  if (!query || !embedding || !Array.isArray(embedding)) {
    return Response.json({ error: 'body must include query string and embedding array' }, { status: 400 })
  }

  try {
    logger.info('search.start', { query })

    const vec = '[' + embedding.join(',') + ']'

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
    const message = err instanceof Error ? err.message : String(err)
    logger.error('search.failed', { error: message })
    return Response.json({ error: message }, { status: 500 })
  }
}
