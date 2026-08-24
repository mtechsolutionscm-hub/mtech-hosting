import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function Admin() {
  const [orgs, users, websites, apps] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count(),
    prisma.website.count(),
    prisma.application.count(),
  ]);

  return (
    <main className="container">
      <div className="header">
        <div><h1>Admin Dashboard</h1><p className="muted">MTECH platform administration</p></div>
        <a href="/">Home</a>
      </div>
      <div className="grid">
        <div className="card"><h3>Customers/Tenants</h3><strong>{orgs}</strong></div>
        <div className="card"><h3>Users</h3><strong>{users}</strong></div>
        <div className="card"><h3>Websites</h3><strong>{websites}</strong></div>
        <div className="card"><h3>Applications</h3><strong>{apps}</strong></div>
      </div>
      <section className="card" style={{marginTop:18}}>
        <h2>Next</h2>
        <p className="muted">Provisioning, domain/DNS management, Docker lifecycle, SSL and billing will be added in subsequent batches.</p>
      </section>
    </main>
  );
}
