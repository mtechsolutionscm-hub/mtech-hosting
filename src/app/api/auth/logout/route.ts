import { NextResponse } from "next/server";
import { audit, destroySession, getCurrentUser } from "@/lib/auth";

export async function POST() {
  const user = await getCurrentUser();
  await destroySession();
  if (user) await audit("LOGOUT", "User", user.id, user.id);
  return NextResponse.json({ ok: true });
}
