import { NextResponse } from "next/server";
import { z } from "zod";
import { audit, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ domainId: z.string().min(1), type: z.enum(["A", "AAAA", "CNAME", "TXT", "MX", "NS"]), name: z.string().min(1).max(253), value: z.string().min(1).max(2048), ttl: z.number().int().min(60).max(86400).optional(), priority: z.number().int().min(0).max(65535).nullable().optional() });

async function ownsDomain(userId: string, domainId: string) {
  return Boolean(await prisma.domain.findFirst({ where: { id: domainId, website: { organization: { memberships: { some: { userId } } } } } }));
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const domainId = new URL(request.url).searchParams.get("domainId");
  if (!domainId || !(await ownsDomain(user.id, domainId))) return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  const records = await prisma.dNSRecord.findMany({ where: { domainId }, orderBy: [{ type: "asc" }, { name: "asc" }] });
  return NextResponse.json({ records });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid DNS record" }, { status: 400 });
  if (!(await ownsDomain(user.id, parsed.data.domainId))) return NextResponse.json({ error: "Domain access denied" }, { status: 403 });
  if ((parsed.data.type === "MX" || parsed.data.type === "NS") && parsed.data.priority == null && parsed.data.type === "MX") return NextResponse.json({ error: "MX priority is required" }, { status: 400 });
  const record = await prisma.dNSRecord.create({ data: { ...parsed.data, ttl: parsed.data.ttl ?? 3600 } });
  await audit("CREATE", "DNSRecord", record.id, user.id, { domainId: record.domainId, type: record.type });
  return NextResponse.json({ record }, { status: 201 });
}
