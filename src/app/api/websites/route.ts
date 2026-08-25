import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError } from "@/lib/api";
import { websiteCreateSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const organizationId = new URL(request.url).searchParams.get("organizationId") ?? undefined;
    const websites = await prisma.website.findMany({
      where: organizationId ? { organizationId } : undefined,
      orderBy: { createdAt: "desc" },
      include: { organization: true, domains: true, applications: true },
    });
    return NextResponse.json({ ok: true, data: websites });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = websiteCreateSchema.parse(await request.json());
    const organization = await prisma.organization.findUnique({ where: { id: body.organizationId } });
    if (!organization) return jsonError("Organization not found", 404);

    const existing = await prisma.website.findFirst({ where: { organizationId: body.organizationId, slug: body.slug } });
    if (existing) return jsonError("Website slug already exists in this organization", 409);

    const website = await prisma.website.create({ data: body });
    await writeAuditLog({ action: "CREATE", resourceType: "Website", resourceId: website.id, organizationId: website.organizationId, message: `Created website ${website.name}` });
    return NextResponse.json({ ok: true, data: website }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
