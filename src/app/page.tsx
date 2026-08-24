export default function Home() {
  return (
    <main className="container">
      <div className="header">
        <div>
          <h1>MTECH Hosting</h1>
          <p className="muted">Multi-tenant hosting control plane</p>
        </div>
        <span className="badge">MVP ONLINE</span>
      </div>
      <div className="grid">
        <a className="card" href="/dashboard">
          <h2>Customer Dashboard</h2>
          <p className="muted">Websites, applications, domains and usage.</p>
        </a>
        <a className="card" href="/admin">
          <h2>Admin Dashboard</h2>
          <p className="muted">Tenants, websites, applications and infrastructure.</p>
        </a>
      </div>
    </main>
  );
}