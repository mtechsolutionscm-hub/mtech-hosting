import { NextResponse } from "next/server";
import { z } from "zod";
import { audit, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ websiteId: z.string().min(1), domainId: z.string().min(1) });

async function ownsDomain(userId: string, domainId: string, websiteId: string) {
  return Boolean(await prisma.domain.findFirst({ where: { id: domainId, websiteId, website: { organization: { memberships: { some: { userId } } } } } }));
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const websiteId = new URL(request.url).searchParams.get("websiteId");
  if (!websiteId) return NextResponse.json({ error: "websiteId is required" }, { status: 400 });
  const certificates = await prisma.certificate.findMany({ where: { websiteId, website: { organization: { memberships: { some: { userId: user.id } } } } }, include: { domain: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ certificates });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid certificate request" }, { status: 400 });
  if (!(await ownsDomain(user.id, parsed.data.domainId, parsed.data.websiteId))) return NextResponse.json({ error: "Domain access denied" }, { status: 403 });
  const existing = await prisma.certificate.findFirst({ where: { domainId: parsed.data.domainId, status: { in: ["PENDING", "ISSUED", "RENEWING"] } } });
  if (existing) return NextResponse.json({ certificate: existing }, { status: 200 });
  const certificate = await prisma.certificate.create({ data: { websiteId: parsed.data.websiteId, domainId: parsed.data.domainId, status: "PENDING", provider: "letsencrypt" } });
  await audit("REQUEST", "Certificate", certificate.id, user.id, { domainId: certificate.domainId, provider: certificate.provider });
  return NextResponse.json({ certificate, next: "A certificate worker must perform ACME HTTP-01 or DNS-01 validation and update this record." }, { status: 202 });
}
