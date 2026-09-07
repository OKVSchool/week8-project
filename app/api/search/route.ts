import { NextResponse } from 'next/server'
import { Client } from 'pg'

const EMBED_URL = process.env.EMBED_SERVER_URL ?? 'https://week8-project.onrender.com'

export async function POST(request: Request) {
  const { query } = await request.json()
  if (!query) return NextResponse.json({ error: 'query is required' }, { status: 400 })

  // Step 1 — get embedding from Render
  let embedding: number[]
  try {
    const embedRes = await fetch(`${EMBED_URL}/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: query }),
    })
    if (!embedRes.ok) {
      const err = await embedRes.json().catch(() => ({}))
      return NextResponse.json({ error: `embed server error: ${err.error ?? embedRes.status}` }, { status: 502 })
    }
    const body = await embedRes.json()
    embedding = body.embedding
    console.log('[search] embedding dims:', embedding?.length)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[search] embed fetch failed:', msg)
    return NextResponse.json({ error: `embed server unreachable: ${msg}` }, { status: 502 })
  }

  // Step 2 — query pgvector
  const db = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })
  try {
    await db.connect()
    const vec = '[' + embedding.join(',') + ']'
    const { rows } = await db.query<{ source: string; content: string; similarity: number }>(
      `SELECT source, content, 1 - (embedding <=> $1::vector) AS similarity
       FROM chunks
       ORDER BY embedding <=> $1::vector
       LIMIT 5`,
      [vec]
    )
    console.log('[search] rows returned:', rows.length)
    return NextResponse.json({ results: rows })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[search] db error:', msg)
    return NextResponse.json({ error: `database error: ${msg}` }, { status: 500 })
  } finally {
    await db.end().catch(() => {})
  }
}
