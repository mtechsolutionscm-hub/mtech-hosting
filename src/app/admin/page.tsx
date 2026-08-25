import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Admin() {
  const user = await requireRole(["SUPER_ADMIN", "ADMIN", "SUPPORT"]);
  const [orgs, users, websites, domains, apps, recentLogs] = await Promise.all([
    prisma.organization.count(), prisma.user.count(), prisma.website.count(), prisma.domain.count(), prisma.application.count(),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { user: { select: { email: true } } } }),
  ]);

  return <main className="container"><div className="header"><div><div className="eyebrow">MTECH CONTROL PLANE</div><h1>Administration</h1><p className="muted">Signed in as {user.email} · {user.role}</p></div><div className="nav"><a href="/">Home</a><a href="/dashboard">Customer view</a></div></div><div className="grid"><div className="card"><span className="muted">Tenants</span><strong className="metric">{orgs}</strong></div><div className="card"><span className="muted">Users</span><strong className="metric">{users}</strong></div><div className="card"><span className="muted">Websites</span><strong className="metric">{websites}</strong></div><div className="card"><span className="muted">Domains</span><strong className="metric">{domains}</strong></div><div className="card"><span className="muted">Applications</span><strong className="metric">{apps}</strong></div></div><section className="section-head"><div><h2>Recent activity</h2><p className="muted">Security and operational events.</p></div></section><div className="stack">{recentLogs.map(log => <article className="card" key={log.id}><div className="row"><div><strong>{log.action}</strong><p className="muted">{log.resource}{log.resourceId ? ` · ${log.resourceId}` : ""}</p></div><span className="muted small">{log.user?.email ?? "system"}</span></div></article>)}{recentLogs.length === 0 && <div className="card"><p className="muted">No activity recorded yet.</p></div>}</div></main>;
}
