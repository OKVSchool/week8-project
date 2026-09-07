'use client'

import { useState, useEffect } from 'react'

interface Result {
  source: string
  content: string
  similarity: number
}

const RENDER_URL = 'https://week8-project.onrender.com'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [warmingUp, setWarmingUp] = useState(true)

  // Ping Render on page load so the model is warm before the user searches
  useEffect(() => {
    let cancelled = false

    async function warmUp() {
      setWarmingUp(true)
      while (!cancelled) {
        try {
          const r = await fetch(`${RENDER_URL}/health`)
          const data = await r.json()
          if (data.modelReady) break
        } catch {
          // server still waking — keep polling
        }
        await new Promise(r => setTimeout(r, 3000))
      }
      if (!cancelled) setWarmingUp(false)
    }

    warmUp()
    return () => { cancelled = true }
  }, [])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim() || warmingUp) return
    setLoading(true)
    setError('')
    setResults([])

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      const data = await res.json().catch(() => ({ error: 'invalid response from server' }))
      setLoading(false)

      if (!res.ok) {
        setError(data.error ?? 'Search failed')
        return
      }
      setResults(data.results)
    } catch (e: unknown) {
      setLoading(false)
      setError(e instanceof Error ? e.message : 'Network error')
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: '2rem auto', padding: '0 1rem', fontFamily: 'sans-serif' }}>
      <h1>Semantic Search</h1>

      {warmingUp && (
        <p style={{ color: '#888', fontSize: '0.9rem' }}>
          Waking up search engine… this takes up to 30 seconds on first load.
        </p>
      )}

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Ask a question about Trailhead Supply Co..."
          disabled={warmingUp}
          style={{ flex: 1, padding: '0.5rem', fontSize: '1rem' }}
        />
        <button type="submit" disabled={loading || warmingUp} style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}>
          {warmingUp ? 'Warming up…' : loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {results.map((r, i) => (
        <div key={i} style={{ borderTop: '1px solid #ccc', paddingTop: '1rem', marginTop: '1rem' }}>
          <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>
            {r.source} &mdash; {(r.similarity * 100).toFixed(1)}% match
          </p>
          <p style={{ margin: 0 }}>{r.content}</p>
        </div>
      ))}

      {!loading && results.length === 0 && query && !error && !warmingUp && (
        <p style={{ color: '#888' }}>No results found.</p>
      )}
    </main>
  )
}
