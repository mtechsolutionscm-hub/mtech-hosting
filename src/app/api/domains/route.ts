import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError } from "@/lib/api";
import { domainCreateSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const websiteId = new URL(request.url).searchParams.get("websiteId") ?? undefined;
    const domains = await prisma.domain.findMany({
      where: websiteId ? { websiteId } : undefined,
      orderBy: { createdAt: "desc" },
      include: { website: { include: { organization: true } } },
    });
    return NextResponse.json({ ok: true, data: domains });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = domainCreateSchema.parse(await request.json());
    const website = await prisma.website.findUnique({ where: { id: body.websiteId } });
    if (!website) return jsonError("Website not found", 404);

    const existing = await prisma.domain.findUnique({ where: { hostname: body.hostname } });
    if (existing) return jsonError("Domain is already registered", 409);

    if (body.isPrimary) {
      await prisma.domain.updateMany({ where: { websiteId: body.websiteId }, data: { isPrimary: false } });
    }

    const domain = await prisma.domain.create({ data: body });
    await writeAuditLog({ action: "CREATE", resourceType: "Domain", resourceId: domain.id, organizationId: website.organizationId, message: `Registered domain ${domain.hostname}` });
    return NextResponse.json({ ok: true, data: domain }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
