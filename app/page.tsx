export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Field Service Manager</h1>
      <p style={{ marginTop: '0.5rem', color: '#555' }}>
        Mobile forklift technician service tracking app.
      </p>
      <nav style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <a href="/customers">Customers</a>
        <a href="/work-orders">Work Orders</a>
        <a href="/dashboard">Dashboard</a>
      </nav>
    </main>
  )
}
