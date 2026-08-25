import { prisma } from "@/lib/prisma";
import { z } from "zod";

const OrganizationInput = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(2).max(63),
});

export type OrganizationInput = z.infer<typeof OrganizationInput>;

export async function createOrganization(input: OrganizationInput) {
  const data = OrganizationInput.parse(input);
  return prisma.organization.create({ data });
}

export async function getOrganizationBySlug(slug: string) {
  return prisma.organization.findUnique({
    where: { slug },
    include: {
      memberships: { include: { user: true } },
      websites: { include: { domains: true, applications: true } },
    },
  });
}

export async function listOrganizations() {
  return prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { memberships: true, websites: true } },
    },
  });
}
