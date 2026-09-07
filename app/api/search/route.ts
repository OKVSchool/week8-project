import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { Client } from 'pg'
import { HfInference } from '@huggingface/inference'

const hf = new HfInference(process.env.HF_TOKEN)

async function embedQuery(query: string): Promise<number[]> {
  const result = await hf.featureExtraction({
    model: 'sentence-transformers/all-MiniLM-L6-v2',
    inputs: query,
  })

  // HF API returns [tokens, dims] for this model — mean-pool to get sentence vector
  if (Array.isArray(result[0])) {
    const matrix = result as number[][]
    const dims = matrix[0].length
    const pooled = new Array(dims).fill(0) as number[]
    for (const row of matrix) {
      for (let i = 0; i < dims; i++) pooled[i] += row[i]
    }
    return pooled.map(v => v / matrix.length)
  }

  return result as number[]
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')

  if (!query) {
    return Response.json({ error: 'q parameter is required' }, { status: 400 })
  }

  try {
    logger.info('search.start', { query })

    const embedding = await embedQuery(query)
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
    // Return the real error message so we can debug without a log dashboard
    return Response.json({ error: message }, { status: 500 })
  }
}
