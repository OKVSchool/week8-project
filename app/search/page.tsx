'use client'

import { useState } from 'react'

type Result = {
  source: string
  score: string
  text: string
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Search failed')
        setResults([])
      } else {
        setResults(data.results || [])
      }

      setSearched(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reach the search endpoint')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px' }}>
      <h1>Corpus Search</h1>
      <p style={{ color: '#555', marginTop: '0.5rem' }}>
        Ask a question about Trailhead Supply Co.
      </p>

      <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="e.g. how many days to return boots?"
          style={{
            flex: 1,
            padding: '0.5rem',
            fontSize: '1rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ padding: '0.5rem 1rem', fontSize: '1rem', cursor: 'pointer' }}
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {error && (
        <p style={{ marginTop: '1rem', color: '#c00' }}>{error}</p>
      )}

      {searched && !error && results.length === 0 && (
        <p style={{ marginTop: '1rem', color: '#666' }}>No results found.</p>
      )}

      {results.map((r, i) => (
        <div
          key={i}
          style={{
            marginTop: '1rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '1rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 'bold', color: '#333' }}>{r.source}</span>
            <span style={{ color: '#888', fontSize: '0.875rem' }}>score: {r.score}</span>
          </div>
          <p style={{ margin: 0, color: '#444', lineHeight: '1.6' }}>{r.text}</p>
        </div>
      ))}
    </main>
  )
}
