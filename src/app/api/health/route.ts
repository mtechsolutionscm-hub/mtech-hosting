import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "mtech-hosting",
    timestamp: new Date().toISOString()
  });
}