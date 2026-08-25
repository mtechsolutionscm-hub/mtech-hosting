import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError } from "@/lib/api";
import { organizationCreateSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const organizations = await prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      include: { plan: true, _count: { select: { websites: true, memberships: true } } },
    });
    return NextResponse.json({ ok: true, data: organizations });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = organizationCreateSchema.parse(await request.json());
    const existing = await prisma.organization.findUnique({ where: { slug: body.slug } });
    if (existing) return jsonError("Organization slug already exists", 409);

    const organization = await prisma.organization.create({ data: body });
    await writeAuditLog({ action: "CREATE", resourceType: "Organization", resourceId: organization.id, organizationId: organization.id, message: `Created organization ${organization.name}` });
    return NextResponse.json({ ok: true, data: organization }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
