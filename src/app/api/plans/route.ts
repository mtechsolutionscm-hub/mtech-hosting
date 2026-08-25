import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const plans = await prisma.hostingPlan.findMany({ where: { active: true }, orderBy: { monthlyPrice: "asc" } });
    return NextResponse.json({ ok: true, data: plans });
  } catch (error) {
    return handleApiError(error);
  }
}
