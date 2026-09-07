// scripts/search.js
// Semantic search against the chunk store — logs results in structured JSON
// Run: node --env-file=.env scripts/search.js "your query here"

const { Client } = require('pg')

async function getExtractor() {
  const { pipeline } = await import('@xenova/transformers')
  return pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { quantized: true })
}

async function search(query, limit = 3) {
  const extractor = await getExtractor()
  const db = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })
  await db.connect()

  // Embed the query with the same model used during ingestion
  const output = await extractor([query], { pooling: 'mean', normalize: true })
  const vec = '[' + output.tolist()[0].join(',') + ']'

  // Cosine similarity: 1 − cosine_distance. Score of 1.0 = identical.
  const { rows } = await db.query(
    `SELECT source,
            content,
            1 - (embedding <=> $1::vector) AS score
     FROM   chunks
     ORDER  BY embedding <=> $1::vector
     LIMIT  $2`,
    [vec, limit]
  )

  const result = {
    level: 'info',
    event: 'search.result',
    query,
    results: rows.map(r => ({
      source: r.source,
      score:  parseFloat(r.score).toFixed(4),
      text:   r.content.substring(0, 300),
    })),
    ts: new Date().toISOString(),
  }

  // Structured log line — same format as the rest of the app
  console.log(JSON.stringify(result, null, 2))

  await db.end()
}

const query = process.argv[2]
if (!query) {
  console.error('Usage: node --env-file=.env scripts/search.js "your query here"')
  process.exit(1)
}

search(query).catch(err => {
  console.error(err.message)
  process.exit(1)
})
