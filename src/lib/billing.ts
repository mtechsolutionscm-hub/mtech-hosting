import { prisma } from "./prisma";

export async function getUsage(organizationId: string) {
  const [websites, domains, applications] = await Promise.all([
    prisma.website.count({ where: { organizationId } }),
    prisma.domain.count({ where: { website: { organizationId } } }),
    prisma.application.count({ where: { website: { organizationId } } }),
  ]);
  return { websites, domains, applications };
}

export async function getActiveSubscription(organizationId: string) {
  return prisma.subscription.findFirst({
    where: { organizationId, status: { in: ["TRIALING", "ACTIVE", "PAST_DUE"] } },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });
}
