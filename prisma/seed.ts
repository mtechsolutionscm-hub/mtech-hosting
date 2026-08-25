import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!email || !password) {
    console.log("ADMIN_EMAIL and ADMIN_PASSWORD are not set; no bootstrap admin created.");
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: UserRole.SUPER_ADMIN, isActive: true },
    create: { email, name: "MTECH Administrator", passwordHash, role: UserRole.SUPER_ADMIN },
  });
  console.log(`Bootstrap administrator ready: ${user.email}`);
}

main().finally(() => prisma.$disconnect());
