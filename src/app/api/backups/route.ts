import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, audit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ websiteId: z.string().min(1).optional() });

export async function GET() {
  const user = await requireUser();
  const backups = await prisma.backup.findMany({ where: { organization: { memberships: { some: { userId: user.id } } } }, orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ backups });
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await request.json().catch(() => ({})));
    const organizationId = user.memberships[0]?.organizationId;
    if (!organizationId) return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    if (body.websiteId) {
      const website = await prisma.website.findFirst({ where: { id: body.websiteId, organizationId } });
      if (!website) return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }
    const backup = await prisma.backup.create({ data: { organizationId, websiteId: body.websiteId, status: "QUEUED" } });
    await audit("CREATE", "Backup", backup.id, user.id, { websiteId: body.websiteId ?? null });
    return NextResponse.json({ backup }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid backup request" }, { status: 400 });
    if (error instanceof Error && error.message === "UNAUTHENTICATED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Unable to create backup" }, { status: 500 });
  }
}
