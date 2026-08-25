import { NextResponse } from "next/server";
import { z } from "zod";
import { audit, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({ name: z.string().trim().min(2).max(120), organizationId: z.string().min(1) });

function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "website";
}

async function canAccess(userId: string, organizationId: string) {
  return Boolean(await prisma.membership.findUnique({ where: { userId_organizationId: { userId, organizationId } } }));
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationIds = user.memberships.map(m => m.organizationId);
  const websites = await prisma.website.findMany({ where: { organizationId: { in: organizationIds } }, include: { domains: true, applications: true, organization: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ websites });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid website data" }, { status: 400 });
  if (!(await canAccess(user.id, parsed.data.organizationId))) return NextResponse.json({ error: "Organization access denied" }, { status: 403 });

  const baseSlug = slugify(parsed.data.name);
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.website.findUnique({ where: { organizationId_slug: { organizationId: parsed.data.organizationId, slug } } })) slug = `${baseSlug}-${suffix++}`;

  const website = await prisma.website.create({ data: { name: parsed.data.name, slug, organizationId: parsed.data.organizationId } });
  await audit("CREATE", "Website", website.id, user.id, { organizationId: parsed.data.organizationId });
  return NextResponse.json({ website }, { status: 201 });
}
