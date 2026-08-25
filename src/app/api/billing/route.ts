import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUsage, getActiveSubscription } from "@/lib/billing";

export async function GET() {
  try {
    const user = await requireUser();
    const organizationId = user.memberships[0]?.organizationId;
    if (!organizationId) return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    const [subscription, usage, invoices] = await Promise.all([
      getActiveSubscription(organizationId),
      getUsage(organizationId),
      prisma.invoice.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 20 }),
    ]);
    return NextResponse.json({ subscription, usage, invoices });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Unable to load billing" }, { status: 500 });
  }
}
