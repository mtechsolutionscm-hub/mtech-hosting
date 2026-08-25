import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, audit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ name: z.string().trim().min(2).max(100), provider: z.string().trim().min(2).max(50), region: z.string().trim().min(2).max(100), endpoint: z.string().url().optional(), capacityCpu: z.number().int().min(0).max(100000).optional(), capacityMemoryMb: z.number().int().min(0).optional(), capacityStorageGb: z.number().int().min(0).optional() });

export async function GET() {
  try {
    await requireRole(["SUPER_ADMIN", "ADMIN", "SUPPORT"]);
    const nodes = await prisma.node.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ nodes });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Unable to load nodes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(["SUPER_ADMIN", "ADMIN"]);
    const body = schema.parse(await request.json());
    const node = await prisma.node.create({ data: body });
    await audit("CREATE", "Node", node.id, user.id, { provider: node.provider, region: node.region });
    return NextResponse.json({ node }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid node payload", details: error.flatten() }, { status: 400 });
    if (error instanceof Error && error.message === "UNAUTHENTICATED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Unable to create node" }, { status: 500 });
  }
}
