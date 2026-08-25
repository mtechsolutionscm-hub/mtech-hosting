import { NextResponse } from "next/server";
import { z } from "zod";
import { audit, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWebsiteForUser } from "@/lib/tenant";

const createSchema = z.object({
  applicationId: z.string().min(1),
  image: z.string().min(1).max(500).regex(/^[a-zA-Z0-9][a-zA-Z0-9._\-/:@]+$/),
});

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const websiteId = url.searchParams.get("websiteId");
    if (!websiteId) return NextResponse.json({ error: "websiteId is required" }, { status: 400 });
    const website = await getWebsiteForUser(user, websiteId);
    if (!website) return NextResponse.json({ error: "Website not found" }, { status: 404 });
    const deployments = await prisma.deployment.findMany({ where: { websiteId }, orderBy: { createdAt: "desc" }, take: 50, include: { application: true } });
    return NextResponse.json({ deployments });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Unable to load deployments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = createSchema.parse(await request.json());
    const application = await prisma.application.findUnique({ where: { id: body.applicationId }, include: { website: true } });
    if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });
    if (!(await getWebsiteForUser(user, application.websiteId))) return NextResponse.json({ error: "Application not found" }, { status: 404 });
    const deployment = await prisma.$transaction(async (tx) => {
      await tx.application.update({ where: { id: application.id }, data: { image: body.image, status: "DEPLOYING" } });
      return tx.deployment.create({ data: { applicationId: application.id, websiteId: application.websiteId, image: body.image, status: "QUEUED" } });
    });
    await audit("deployment.created", "Deployment", deployment.id, user.id, { applicationId: application.id, image: body.image });
    return NextResponse.json({ deployment }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid deployment payload", details: error.flatten() }, { status: 400 });
    if (error instanceof Error && error.message === "UNAUTHENTICATED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Unable to create deployment" }, { status: 500 });
  }
}
