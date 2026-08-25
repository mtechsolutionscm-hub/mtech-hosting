import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Dashboard() {
  const [orgs, websites, domains, apps, recentWebsites] = await Promise.all([
    prisma.organization.count(),
    prisma.website.count(),
    prisma.domain.count(),
    prisma.application.count(),
    prisma.website.findMany({ orderBy: { updatedAt: "desc" }, take: 10, include: { organization: true, domains: true, applications: true } }),
  ]);

  return (
    <main className="container">
      <div className="header">
        <div><h1>Customer Hosting Portal</h1><p className="muted">Websites, domains and application lifecycle overview</p></div>
        <div className="nav"><a href="/">Home</a><a href="/admin">Admin</a></div>
      </div>

      <section className="grid">
        <div className="card"><p className="muted">Organizations</p><strong className="metric">{orgs}</strong></div>
        <div className="card"><p className="muted">Websites</p><strong className="metric">{websites}</strong></div>
        <div className="card"><p className="muted">Domains</p><strong className="metric">{domains}</strong></div>
        <div className="card"><p className="muted">Applications</p><strong className="metric">{apps}</strong></div>
      </section>

      <section className="card" style={{marginTop:18}}>
        <div className="sectionTitle"><h2>Website portfolio</h2><span className="muted">Latest 10</span></div>
        {recentWebsites.length === 0 ? <p className="muted">No websites have been created yet.</p> : (
          <table><thead><tr><th>Website</th><th>Organization</th><th>Domains</th><th>Apps</th><th>Status</th></tr></thead><tbody>
            {recentWebsites.map((site) => <tr key={site.id}><td>{site.name}</td><td>{site.organization.name}</td><td>{site.domains.length}</td><td>{site.applications.length}</td><td><span className="status">{site.status}</span></td></tr>)}
          </tbody></table>
        )}
      </section>

      <section className="grid" style={{marginTop:18}}>
        <div className="card"><h3>Domains & DNS</h3><p className="muted">Domain inventory is ready for provider-backed verification and DNS automation.</p></div>
        <div className="card"><h3>Applications</h3><p className="muted">Applications are modeled independently so deployments can move between infrastructure nodes.</p></div>
        <div className="card"><h3>Billing</h3><p className="muted">Hosting plans are now part of the control-plane data model; subscriptions and invoicing follow in the commercial phase.</p></div>
      </section>
    </main>
  );
}
