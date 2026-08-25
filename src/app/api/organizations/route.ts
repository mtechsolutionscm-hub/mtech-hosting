import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, audit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ name: z.string().trim().min(2).max(120) });
function slugify(value: string) { return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "workspace"; }

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ organizations: user.memberships.map(m => m.organization) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["SUPER_ADMIN", "ADMIN", "CUSTOMER_OWNER"].includes(user.role)) return NextResponse.json({ error: "Organization creation denied" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid organization name" }, { status: 400 });
  const baseSlug = slugify(parsed.data.name);
  let slug = baseSlug; let suffix = 1;
  while (await prisma.organization.findUnique({ where: { slug } })) slug = `${baseSlug}-${suffix++}`;
  const organization = await prisma.$transaction(async tx => {
    const created = await tx.organization.create({ data: { name: parsed.data.name, slug } });
    await tx.membership.create({ data: { userId: user.id, organizationId: created.id } });
    return created;
  });
  await audit("CREATE", "Organization", organization.id, user.id);
  return NextResponse.json({ organization }, { status: 201 });
}
