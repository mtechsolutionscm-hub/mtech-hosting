import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Dashboard() {
  const [orgs, websites, domains, apps] = await Promise.all([
    prisma.organization.count(),
    prisma.website.count(),
    prisma.domain.count(),
    prisma.application.count(),
  ]);

  return (
    <main className="container">
      <div className="header">
        <div><h1>Customer Dashboard</h1><p className="muted">Tenant-aware hosting overview</p></div>
        <a href="/">Home</a>
      </div>
      <div className="grid">
        <div className="card"><h3>Organizations</h3><strong>{orgs}</strong></div>
        <div className="card"><h3>Websites</h3><strong>{websites}</strong></div>
        <div className="card"><h3>Domains</h3><strong>{domains}</strong></div>
        <div className="card"><h3>Applications</h3><strong>{apps}</strong></div>
      </div>
    </main>
  );
}
