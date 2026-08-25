import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, audit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ websiteId: z.string().min(1), name: z.string().trim().min(2).max(120), image: z.string().trim().min(1).max(255), port: z.number().int().min(1).max(65535).default(3000) });

async function ownsWebsite(userId: string, websiteId: string) {
  return Boolean(await prisma.website.findFirst({ where: { id: websiteId, organization: { memberships: { some: { userId } } } } }));
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const applications = await prisma.application.findMany({ where: { website: { organization: { memberships: { some: { userId: user.id } } } } }, include: { website: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ applications });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid application data" }, { status: 400 });
  if (!(await ownsWebsite(user.id, parsed.data.websiteId))) return NextResponse.json({ error: "Website access denied" }, { status: 403 });
  const application = await prisma.application.create({ data: parsed.data });
  await audit("CREATE", "Application", application.id, user.id, { websiteId: application.websiteId });
  return NextResponse.json({ application }, { status: 201 });
}
