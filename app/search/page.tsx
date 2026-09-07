'use client'

import { useState } from 'react'

interface Result {
  source: string
  content: string
  similarity: number
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setResults([])

    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Search failed')
      return
    }
    setResults(data.results)
  }

  return (
    <main style={{ maxWidth: 720, margin: '2rem auto', padding: '0 1rem', fontFamily: 'sans-serif' }}>
      <h1>Semantic Search</h1>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Ask a question about Trailhead Supply Co..."
          style={{ flex: 1, padding: '0.5rem', fontSize: '1rem' }}
        />
        <button type="submit" disabled={loading} style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}>
          {loading ? 'Searching…' : 'Search'}
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

      {!loading && results.length === 0 && query && !error && (
        <p style={{ color: '#888' }}>No results found.</p>
      )}
    </main>
  )
}
