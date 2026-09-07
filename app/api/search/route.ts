import { NextResponse } from 'next/server'
import { Client } from 'pg'

const EMBED_URL = process.env.EMBED_SERVER_URL ?? 'https://week8-project.onrender.com'

export async function POST(request: Request) {
  const { query } = await request.json()
  if (!query) return NextResponse.json({ error: 'query is required' }, { status: 400 })

  const embedRes = await fetch(`${EMBED_URL}/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: query }),
  })
  if (!embedRes.ok) {
    const err = await embedRes.json().catch(() => ({}))
    return NextResponse.json({ error: err.error ?? 'embed server error' }, { status: 502 })
  }
  const { embedding } = await embedRes.json()

  const db = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })
  await db.connect()

  const vec = '[' + (embedding as number[]).join(',') + ']'
  const { rows } = await db.query<{ source: string; content: string; similarity: number }>(
    `SELECT source, content, 1 - (embedding <=> $1::vector) AS similarity
     FROM chunks
     ORDER BY embedding <=> $1::vector
     LIMIT 5`,
    [vec]
  )
  await db.end()

  return NextResponse.json({ results: rows })
}
