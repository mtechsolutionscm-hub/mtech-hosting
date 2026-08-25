import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, audit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ websiteId: z.string().min(1), hostname: z.string().trim().toLowerCase().min(3).max(253).regex(/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/), isPrimary: z.boolean().optional() });

async function ownsWebsite(userId: string, websiteId: string) {
  return Boolean(await prisma.website.findFirst({ where: { id: websiteId, organization: { memberships: { some: { userId } } } } }));
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const domains = await prisma.domain.findMany({ where: { website: { organization: { memberships: { some: { userId: user.id } } } } }, include: { website: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ domains });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
  if (!(await ownsWebsite(user.id, parsed.data.websiteId))) return NextResponse.json({ error: "Website access denied" }, { status: 403 });
  if (await prisma.domain.findUnique({ where: { hostname: parsed.data.hostname } })) return NextResponse.json({ error: "Domain already exists" }, { status: 409 });

  const domain = await prisma.$transaction(async tx => {
    if (parsed.data.isPrimary) await tx.domain.updateMany({ where: { websiteId: parsed.data.websiteId }, data: { isPrimary: false } });
    return tx.domain.create({ data: { websiteId: parsed.data.websiteId, hostname: parsed.data.hostname, isPrimary: parsed.data.isPrimary ?? false } });
  });
  await audit("CREATE", "Domain", domain.id, user.id, { hostname: domain.hostname });
  return NextResponse.json({ domain }, { status: 201 });
}
