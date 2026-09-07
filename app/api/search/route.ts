import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { Client } from 'pg'

async function embedQuery(query: string): Promise<number[]> {
  // Use the old HuggingFace Serverless Inference endpoint (free, no Inference Providers required)
  const res = await fetch(
    'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: query, options: { wait_for_model: true } }),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HF API ${res.status}: ${text}`)
  }

  const data = await res.json() as number[] | number[][]

  // API returns [tokens, dims] — mean-pool to a single sentence vector
  if (Array.isArray(data[0])) {
    const matrix = data as number[][]
    const dims = matrix[0].length
    const pooled = new Array(dims).fill(0) as number[]
    for (const row of matrix) {
      for (let i = 0; i < dims; i++) pooled[i] += row[i]
    }
    return pooled.map(v => v / matrix.length)
  }

  return data as number[]
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
    return Response.json({ error: message }, { status: 500 })
  }
}
