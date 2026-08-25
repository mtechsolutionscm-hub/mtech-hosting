import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CreateWebsiteForm from "./create-website-form";
import LogoutButton from "@/components/logout-button";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Dashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const memberships = user.memberships;
  const organizationIds = memberships.map(m => m.organizationId);
  const [websites, domains, apps] = await Promise.all([
    prisma.website.findMany({ where: { organizationId: { in: organizationIds } }, include: { domains: true, applications: true, organization: true }, orderBy: { createdAt: "desc" } }),
    prisma.domain.count({ where: { website: { organizationId: { in: organizationIds } } } }),
    prisma.application.count({ where: { website: { organizationId: { in: organizationIds } } } }),
  ]);
  return <main className="container"><div className="header"><div><div className="eyebrow">MTECH HOSTING</div><h1>Workspace</h1><p className="muted">Welcome back, {user.name || user.email}.</p></div><div className="nav"><a href="/">Home</a>{["SUPER_ADMIN","ADMIN","SUPPORT"].includes(user.role) && <a href="/admin">Admin</a>}<LogoutButton /></div></div><div className="grid"><div className="card"><span className="muted">Organizations</span><strong className="metric">{memberships.length}</strong></div><div className="card"><span className="muted">Websites</span><strong className="metric">{websites.length}</strong></div><div className="card"><span className="muted">Domains</span><strong className="metric">{domains}</strong></div><div className="card"><span className="muted">Applications</span><strong className="metric">{apps}</strong></div></div><div className="section-head"><div><h2>Your websites</h2><p className="muted">Resources are isolated to organizations you belong to.</p></div></div><CreateWebsiteForm organizations={memberships.map(m => ({ id: m.organization.id, name: m.organization.name }))} /><div className="stack">{websites.map(site => <article className="card" key={site.id}><div className="row"><div><h3>{site.name}</h3><p className="muted">{site.organization.name} · {site.slug}</p></div><span className="badge">{site.status}</span></div><div className="chips"><span>{site.domains.length} domains</span><span>{site.applications.length} applications</span></div></article>)}{websites.length === 0 && <div className="card"><h3>No websites yet</h3><p className="muted">Create your first website to start provisioning infrastructure.</p></div>}</div></main>;
}
