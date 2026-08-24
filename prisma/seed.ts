import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.upsert({
    where: { slug: "mtech-demo" },
    update: {},
    create: { name: "MTECH Demo Tenant", slug: "mtech-demo" }
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@mtech.local" },
    update: {},
    create: {
      email: "admin@mtech.local",
      name: "MTECH Administrator",
      passwordHash: "CHANGE_ME",
      role: UserRole.SUPER_ADMIN
    }
  });

  await prisma.membership.upsert({
    where: { userId_organizationId: { userId: admin.id, organizationId: org.id } },
    update: {},
    create: { userId: admin.id, organizationId: org.id }
  });

  const website = await prisma.website.upsert({
    where: { organizationId_slug: { organizationId: org.id, slug: "demo-site" } },
    update: {},
    create: {
      organizationId: org.id,
      name: "Demo Website",
      slug: "demo-site",
      status: "ACTIVE"
    }
  });

  await prisma.domain.upsert({
    where: { hostname: "demo.mtech.local" },
    update: {},
    create: { websiteId: website.id, hostname: "demo.mtech.local", isPrimary: true }
  });

  await prisma.application.upsert({
    where: { id: "demo-application" },
    update: {},
    create: {
      id: "demo-application",
      websiteId: website.id,
      name: "Demo Application",
      image: "nginx:alpine",
      port: 8080,
      status: "RUNNING"
    }
  });
}

main().finally(() => prisma.$disconnect());