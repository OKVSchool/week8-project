const express = require('express')
const cors = require('cors')

const app = express()
app.use(express.json())
app.use(cors({
  origin: [
    'https://week8-project-kp1v.vercel.app',
    'http://localhost:3000',
  ],
}))

let extractor = null

async function getExtractor() {
  if (extractor) return extractor
  // Dynamic import works for ESM-only packages in a CommonJS file
  const mod = await import('@xenova/transformers')
  mod.env.cacheDir = '/tmp/.cache/transformers'
  console.log('Loading embedding model...')
  extractor = await mod.pipeline(
    'feature-extraction',
    'Xenova/all-MiniLM-L6-v2',
    { quantized: true }
  )
  console.log('Model ready.')
  return extractor
}

// Warm the model at startup so the first search is not slow
getExtractor().catch(err => console.error('Model warm-up failed:', err.message))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', modelReady: extractor !== null })
})

app.post('/embed', async (req, res) => {
  const { text } = req.body
  if (!text) return res.status(400).json({ error: 'text is required' })

  try {
    const embed = await getExtractor()
    const output = await embed([text], { pooling: 'mean', normalize: true })
    res.json({ embedding: output.tolist()[0] })
  } catch (err) {
    console.error('Embed error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Embed server running on port ${PORT}`))
