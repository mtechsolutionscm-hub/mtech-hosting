import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit, createSession } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email().max(254),
  password: z.string().min(12).max(200),
  organization: z.string().trim().min(2).max(120),
});

function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "organization";
}

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid registration data", details: parsed.error.flatten() }, { status: 400 });

  const email = parsed.data.email.trim().toLowerCase();
  if (await prisma.user.findUnique({ where: { email } })) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const baseSlug = slugify(parsed.data.organization);
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.organization.findUnique({ where: { slug } })) slug = `${baseSlug}-${suffix++}`;

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        email,
        name: parsed.data.name,
        passwordHash: await hashPassword(parsed.data.password),
        role: "CUSTOMER_OWNER",
      },
    });
    const organization = await tx.organization.create({ data: { name: parsed.data.organization, slug } });
    await tx.membership.create({ data: { userId: createdUser.id, organizationId: organization.id } });
    return createdUser;
  });

  await createSession(user.id);
  await audit("REGISTER", "User", user.id, user.id, { organization: parsed.data.organization });
  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } }, { status: 201 });
}
