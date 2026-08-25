import { NextResponse } from "next/server";
import { z } from "zod";
import { audit, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ action: z.enum(["start", "stop", "restart"]) });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  const deployment = await prisma.deployment.findFirst({ where: { id, website: { organization: { memberships: { some: { userId: user.id } } } } } });
  if (!deployment) return NextResponse.json({ error: "Deployment not found" }, { status: 404 });

  const status = parsed.data.action === "stop" ? "STOPPED" : "QUEUED";
  const updated = await prisma.deployment.update({ where: { id }, data: { status, errorMessage: null, ...(parsed.data.action !== "stop" ? { startedAt: new Date() } : {}) } });
  await prisma.application.update({ where: { id: deployment.applicationId }, data: { status: parsed.data.action === "stop" ? "STOPPED" : "DEPLOYING" } });
  await audit(`deployment.${parsed.data.action}`, "Deployment", id, user.id);
  return NextResponse.json({ deployment: updated, workerAction: parsed.data.action });
}
