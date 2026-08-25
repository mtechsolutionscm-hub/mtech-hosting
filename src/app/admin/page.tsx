import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Admin() {
  const [orgs, users, websites, domains, apps, plans, audits, recentOrganizations] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count(),
    prisma.website.count(),
    prisma.domain.count(),
    prisma.application.count(),
    prisma.hostingPlan.count({ where: { active: true } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { organization: true, actor: true } }),
    prisma.organization.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { plan: true, _count: { select: { websites: true } } } }),
  ]);

  return (
    <main className="container">
      <div className="header">
        <div><h1>Admin Operations Center</h1><p className="muted">Institutional control plane for tenants and hosting resources</p></div>
        <div className="nav"><a href="/">Home</a><a href="/dashboard">Customer View</a></div>
      </div>

      <section className="grid">
        {[["Customers/Tenants", orgs], ["Users", users], ["Websites", websites], ["Domains", domains], ["Applications", apps], ["Active Plans", plans]].map(([label, value]) => (
          <div className="card" key={String(label)}><p className="muted">{label}</p><strong className="metric">{value}</strong></div>
        ))}
      </section>

      <section className="split" style={{marginTop:18}}>
        <div className="card">
          <div className="sectionTitle"><h2>Recent organizations</h2><a href="/api/organizations">API</a></div>
          {recentOrganizations.length === 0 ? <p className="muted">No organizations yet.</p> : (
            <table><thead><tr><th>Name</th><th>Plan</th><th>Websites</th><th>Status</th></tr></thead><tbody>
              {recentOrganizations.map((org) => <tr key={org.id}><td>{org.name}</td><td>{org.plan?.name ?? "Unassigned"}</td><td>{org._count.websites}</td><td><span className="status">{org.status}</span></td></tr>)}
            </tbody></table>
          )}
        </div>

        <div className="card">
          <div className="sectionTitle"><h2>Audit activity</h2><span className="muted">Latest 8</span></div>
          {audits.length === 0 ? <p className="muted">No activity recorded yet.</p> : (
            <ul className="activity">{audits.map((log) => <li key={log.id}><div><strong>{log.action}</strong> · {log.resourceType}</div><span className="muted">{log.message ?? "System event"}</span></li>)}</ul>
          )}
        </div>
      </section>

      <section className="card" style={{marginTop:18}}>
        <h2>Institutional control plane</h2>
        <p className="muted">Provisioning, infrastructure nodes, DNS, SSL, billing, support and security are isolated as future domain services. This prevents the customer portal from becoming coupled to a single EC2 host.</p>
      </section>
    </main>
  );
}
