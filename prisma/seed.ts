import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

const plans = [
  { name: "Starter", slug: "starter", description: "For personal and small business websites", monthlyPrice: 5000, annualPrice: 50000, storageGb: 10, bandwidthGb: 100, websitesLimit: 1, domainsLimit: 5, applicationsLimit: 1 },
  { name: "Business", slug: "business", description: "For growing organizations and professional sites", monthlyPrice: 15000, annualPrice: 150000, storageGb: 50, bandwidthGb: 500, websitesLimit: 5, domainsLimit: 25, applicationsLimit: 5 },
  { name: "Enterprise", slug: "enterprise", description: "For organizations requiring higher limits and managed operations", monthlyPrice: 50000, annualPrice: 500000, storageGb: 200, bandwidthGb: 2000, websitesLimit: 25, domainsLimit: 100, applicationsLimit: 25 },
];

async function main() {
  for (const plan of plans) {
    await prisma.hostingPlan.upsert({ where: { slug: plan.slug }, update: plan, create: plan });
  }

  const org = await prisma.organization.upsert({
    where: { slug: "mtech-demo" },
    update: {},
    create: { name: "MTECH Demo Tenant", slug: "mtech-demo", plan: { connect: { slug: "starter" } } },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@mtech.local" },
    update: { role: UserRole.SUPER_ADMIN },
    create: { email: "admin@mtech.local", name: "MTECH Administrator", passwordHash: "UNSET_SEED_PASSWORD", role: UserRole.SUPER_ADMIN },
  });

  await prisma.membership.upsert({
    where: { userId_organizationId: { userId: admin.id, organizationId: org.id } },
    update: {},
    create: { userId: admin.id, organizationId: org.id },
  });

  const website = await prisma.website.upsert({
    where: { organizationId_slug: { organizationId: org.id, slug: "demo-site" } },
    update: {},
    create: { organizationId: org.id, name: "Demo Website", slug: "demo-site", status: "ACTIVE" },
  });

  await prisma.domain.upsert({
    where: { hostname: "demo.mtech.local" },
    update: {},
    create: { websiteId: website.id, hostname: "demo.mtech.local", isPrimary: true },
  });

  await prisma.application.upsert({
    where: { id: "demo-application" },
    update: {},
    create: { id: "demo-application", websiteId: website.id, name: "Demo Application", image: "nginx:alpine", port: 8080, status: "RUNNING" },
  });
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
