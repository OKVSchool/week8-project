// scripts/ingest.js
// Four moves: clean → chunk → embed → load into pgvector
// Run: node --env-file=.env scripts/ingest.js

const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

const CHUNK_SIZE = 800   // characters
const OVERLAP    = 100   // characters carried into the next chunk
const EMBED_DIMS = 384   // all-MiniLM-L6-v2 output dimensions

// ── MOVE 1: CLEAN ──────────────────────────────────────────────────────────

// Windows-1252 maps bytes 0x80–0x9F to these Unicode codepoints (others are identity)
const WIN1252_TO_UNICODE = new Map([
  [0x80,0x20AC],[0x82,0x201A],[0x83,0x0192],[0x84,0x201E],[0x85,0x2026],
  [0x86,0x2020],[0x87,0x2021],[0x88,0x02C6],[0x89,0x2030],[0x8A,0x0160],
  [0x8B,0x2039],[0x8C,0x0152],[0x8E,0x017D],[0x91,0x2018],[0x92,0x2019],
  [0x93,0x201C],[0x94,0x201D],[0x95,0x2022],[0x96,0x2013],[0x97,0x2014],
  [0x98,0x02DC],[0x99,0x2122],[0x9A,0x0161],[0x9B,0x203A],[0x9C,0x0153],
  [0x9E,0x017E],[0x9F,0x0178],
])
// Reverse: Unicode codepoint → Windows-1252 byte
const UNICODE_TO_WIN1252 = new Map([...WIN1252_TO_UNICODE].map(([b,u])=>[u,b]))

// Encode a string back to Windows-1252 bytes (returns Buffer or null on failure)
function toWin1252Bytes(str) {
  const bytes = []
  for (const ch of str) {
    const code = ch.codePointAt(0)
    if (UNICODE_TO_WIN1252.has(code)) {
      bytes.push(UNICODE_TO_WIN1252.get(code))
    } else if (code <= 0xFF) {
      bytes.push(code)
    } else {
      return null // unmappable character — abort
    }
  }
  return Buffer.from(bytes)
}

// Corpus files were UTF-8 text that got read as Windows-1252 and re-encoded as UTF-8
// — twice. Two passes of the reverse operation restores the original characters.
function fixEncoding(text) {
  // Strip UTF-8 BOM (PowerShell adds it when writing UTF-8 files)
  text = text.replace(/^﻿/, '')

  for (let pass = 0; pass < 2; pass++) {
    const bytes = toWin1252Bytes(text)
    if (!bytes) break
    try {
      text = bytes.toString('utf8')
    } catch {
      break
    }
  }
  return text
}

function clean(text) {
  text = fixEncoding(text)
  return text
    // Strip page headers and footers from the returns/shipping document
    .replace(/^Trailhead Supply Co\..*Confidential\s*$/gm, '')
    .replace(/^Page \d+ of \d+\s*$/gm, '')
    // Strip markdown heading markers so headings read as plain sentences
    .replace(/^#{1,6}\s+/gm, '')
    // Collapse runs of blank lines down to one
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ── MOVE 2: CHUNK ──────────────────────────────────────────────────────────

function chunk(text, maxChars = CHUNK_SIZE, overlap = OVERLAP) {
  const paragraphs = text.split(/\n\n+/).map(p => p.trim()).filter(Boolean)
  const chunks = []
  let current = ''

  for (const para of paragraphs) {
    const withPara = current ? current + '\n\n' + para : para

    if (withPara.length > maxChars && current.length > 0) {
      chunks.push(current.trim())
      // Carry last `overlap` chars into the new chunk for context continuity
      const tail = current.slice(-overlap)
      current = tail + '\n\n' + para
    } else {
      current = withPara
    }
  }

  if (current.trim()) chunks.push(current.trim())
  return chunks
}

// ── MOVE 3: EMBED ──────────────────────────────────────────────────────────

let _extractor = null
async function getExtractor() {
  if (_extractor) return _extractor
  const { pipeline } = await import('@xenova/transformers')
  console.log('Loading embedding model (downloads ~25 MB on first run)...')
  _extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { quantized: true })
  console.log('Model ready.\n')
  return _extractor
}

async function embedBatch(texts) {
  const extractor = await getExtractor()
  const output = await extractor(texts, { pooling: 'mean', normalize: true })
  return output.tolist()
}

// ── MOVE 4: LOAD ───────────────────────────────────────────────────────────

async function ensureSchema(db) {
  await db.query(`CREATE EXTENSION IF NOT EXISTS vector`)
  // Drop and recreate so dimension changes (1536 → 384) never cause a type error
  await db.query(`DROP TABLE IF EXISTS chunks`)
  await db.query(`
    CREATE TABLE chunks (
      id         SERIAL PRIMARY KEY,
      source     TEXT NOT NULL,
      content    TEXT NOT NULL,
      embedding  vector(${EMBED_DIMS}),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
}

// ── MAIN ───────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('Missing DATABASE_URL in .env')
    process.exit(1)
  }

  const db = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })
  await db.connect()

  await ensureSchema(db)

  // Clear previous run so we get a clean count
  await db.query('DELETE FROM chunks')
  console.log('Cleared previous chunks.\n')

  const corpusDir = path.join(__dirname, '..', 'corpus')
  const files = fs.readdirSync(corpusDir).filter(f =>
    ['.md', '.txt', '.csv'].includes(path.extname(f))
  )

  let grandTotal = 0

  for (const file of files) {
    const raw = fs.readFileSync(path.join(corpusDir, file), 'utf-8')

    // MOVE 1 — clean
    const cleaned = clean(raw)

    // MOVE 2 — chunk
    const chunks = chunk(cleaned)
    console.log(`${file}: ${chunks.length} chunks`)

    // Spot-check: print first chunk of each file so you can verify it's clean
    console.log('  First chunk preview:')
    console.log('  ' + chunks[0].substring(0, 150).replace(/\n/g, ' '))
    console.log()

    // MOVE 3 & 4 — embed and load in batches of 20
    const BATCH = 20
    for (let i = 0; i < chunks.length; i += BATCH) {
      const batch = chunks.slice(i, i + BATCH)
      const embeddings = await embedBatch(batch)

      for (let j = 0; j < batch.length; j++) {
        const vec = '[' + embeddings[j].join(',') + ']'
        await db.query(
          'INSERT INTO chunks (source, content, embedding) VALUES ($1, $2, $3::vector)',
          [file, batch[j], vec]
        )
      }
      process.stdout.write(`  Inserted ${Math.min(i + BATCH, chunks.length)}/${chunks.length}\r`)
    }
    process.stdout.write('\n')

    grandTotal += chunks.length
  }

  // Final count from the store itself
  const { rows } = await db.query('SELECT COUNT(*) AS n FROM chunks')
  const storeCount = parseInt(rows[0].n)

  console.log('─'.repeat(40))
  console.log(`Chunk size : ${CHUNK_SIZE} chars`)
  console.log(`Overlap    : ${OVERLAP} chars`)
  console.log(`Files      : ${files.length}`)
  console.log(`Expected   : ${grandTotal}`)
  console.log(`Store count: ${storeCount}`)

  if (storeCount !== grandTotal) {
    console.warn('WARNING: count mismatch — check for failed inserts')
  } else {
    console.log('✓ Counts match.')
  }

  await db.end()
}

main().catch(err => {
  console.error(err.message)
  process.exit(1)
})
