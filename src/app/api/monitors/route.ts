import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, audit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ websiteId: z.string().min(1), name: z.string().trim().min(2).max(100), url: z.string().url().max(2048), intervalSeconds: z.number().int().min(30).max(86400).optional(), timeoutMs: z.number().int().min(1000).max(60000).optional() });

export async function GET() {
  const user = await requireUser();
  const monitors = await prisma.monitor.findMany({ where: { website: { organization: { memberships: { some: { userId: user.id } } } } }, include: { website: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ monitors });
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await request.json());
    const website = await prisma.website.findFirst({ where: { id: body.websiteId, organization: { memberships: { some: { userId: user.id } } } } });
    if (!website) return NextResponse.json({ error: "Website not found" }, { status: 404 });
    const monitor = await prisma.monitor.create({ data: { websiteId: body.websiteId, name: body.name, url: body.url, intervalSeconds: body.intervalSeconds ?? 60, timeoutMs: body.timeoutMs ?? 10000 } });
    await audit("CREATE", "Monitor", monitor.id, user.id, { url: monitor.url });
    return NextResponse.json({ monitor }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid monitor", details: error.flatten() }, { status: 400 });
    if (error instanceof Error && error.message === "UNAUTHENTICATED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Unable to create monitor" }, { status: 500 });
  }
}
