import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Admin() {
  const [orgs, users, websites, apps, nodes, deployments, domains, certificates] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count(),
    prisma.website.count(),
    prisma.application.count(),
    prisma.hostingNode.count(),
    prisma.deployment.count(),
    prisma.domain.count(),
    prisma.certificate.count(),
  ]);

  return (
    <main className="container">
      <div className="header">
        <div>
          <h1>MTECH Hosting Control Plane</h1>
          <p className="muted">Institutional administration and infrastructure overview</p>
        </div>
        <a href="/">Home</a>
      </div>

      <section className="grid">
        <div className="card"><h3>Customers / Tenants</h3><strong>{orgs}</strong></div>
        <div className="card"><h3>Users</h3><strong>{users}</strong></div>
        <div className="card"><h3>Websites</h3><strong>{websites}</strong></div>
        <div className="card"><h3>Applications</h3><strong>{apps}</strong></div>
        <div className="card"><h3>Hosting Nodes</h3><strong>{nodes}</strong></div>
        <div className="card"><h3>Deployments</h3><strong>{deployments}</strong></div>
        <div className="card"><h3>Domains</h3><strong>{domains}</strong></div>
        <div className="card"><h3>Certificates</h3><strong>{certificates}</strong></div>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <h2>Institutional control plane</h2>
        <p className="muted">
          Tenant management, deployment orchestration, hosting-node capacity, DNS provider abstraction,
          certificate lifecycle and audit-ready deployment events are now represented as first-class platform domains.
        </p>
        <div className="grid" style={{ marginTop: 12 }}>
          <div><strong>Control plane</strong><p className="muted">Intent, tenancy and lifecycle state</p></div>
          <div><strong>Infrastructure plane</strong><p className="muted">Provider adapters and hosting nodes</p></div>
          <div><strong>Domain plane</strong><p className="muted">DNS verification and certificates</p></div>
          <div><strong>Observability</strong><p className="muted">Deployment events and health state</p></div>
        </div>
      </section>
    </main>
  );
}
