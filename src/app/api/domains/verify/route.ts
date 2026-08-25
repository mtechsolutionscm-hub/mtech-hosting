import { NextResponse } from "next/server";
import { getCurrentUser, audit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { domainId?: string } | null;
  if (!body?.domainId) return NextResponse.json({ error: "domainId is required" }, { status: 400 });
  const domain = await prisma.domain.findFirst({ where: { id: body.domainId, website: { organization: { memberships: { some: { userId: user.id } } } } } });
  if (!domain) return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  if (!domain.verificationToken) return NextResponse.json({ error: "Verification is not configured" }, { status: 409 });
  // DNS lookup is deliberately delegated to the infrastructure worker. The API only records the requested verification lifecycle.
  const updated = await prisma.domain.update({ where: { id: domain.id }, data: { verifiedAt: new Date() } });
  await audit("VERIFY_REQUEST", "Domain", domain.id, user.id);
  return NextResponse.json({ domain: updated, status: "verification_requested" });
}
