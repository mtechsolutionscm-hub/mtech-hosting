import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

async function main() {
  const plans = [
    { name: "Starter", slug: "starter", description: "For personal sites and small projects", monthlyPriceCents: 250000, yearlyPriceCents: 2500000, maxWebsites: 3, maxDomains: 5, maxApplications: 5, maxStorageMb: 5120, maxBandwidthGb: 50 },
    { name: "Business", slug: "business", description: "For growing businesses", monthlyPriceCents: 750000, yearlyPriceCents: 7500000, maxWebsites: 15, maxDomains: 30, maxApplications: 25, maxStorageMb: 51200, maxBandwidthGb: 500 },
    { name: "Agency", slug: "agency", description: "For agencies and teams", monthlyPriceCents: 1500000, yearlyPriceCents: 15000000, maxWebsites: 50, maxDomains: 100, maxApplications: 100, maxStorageMb: 204800, maxBandwidthGb: 2000 },
  ];
  for (const plan of plans) await prisma.plan.upsert({ where: { slug: plan.slug }, update: plan, create: plan });

  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!email || !password) {
    console.log("Plans seeded. ADMIN_EMAIL and ADMIN_PASSWORD are not set; no bootstrap admin created.");
    return;
  }
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.upsert({ where: { email }, update: { passwordHash, role: UserRole.SUPER_ADMIN, isActive: true }, create: { email, name: "MTECH Administrator", passwordHash, role: UserRole.SUPER_ADMIN } });
  console.log(`Bootstrap administrator ready: ${user.email}`);
}

main().finally(() => prisma.$disconnect());
