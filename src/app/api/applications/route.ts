import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError } from "@/lib/api";
import { applicationCreateSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const websiteId = new URL(request.url).searchParams.get("websiteId") ?? undefined;
    const applications = await prisma.application.findMany({
      where: websiteId ? { websiteId } : undefined,
      orderBy: { createdAt: "desc" },
      include: { website: { include: { organization: true } } },
    });
    return NextResponse.json({ ok: true, data: applications });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = applicationCreateSchema.parse(await request.json());
    const website = await prisma.website.findUnique({ where: { id: body.websiteId } });
    if (!website) return jsonError("Website not found", 404);

    const application = await prisma.application.create({ data: body });
    await writeAuditLog({ action: "CREATE", resourceType: "Application", resourceId: application.id, organizationId: website.organizationId, message: `Created application ${application.name}` });
    return NextResponse.json({ ok: true, data: application }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
