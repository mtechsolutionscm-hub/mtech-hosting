import type { User } from "@prisma/client";
import { prisma } from "./prisma";

export async function canAccessOrganization(user: User, organizationId: string) {
  if (user.role === "SUPER_ADMIN" || user.role === "ADMIN" || user.role === "SUPPORT") return true;
  const membership = await prisma.membership.findUnique({ where: { userId_organizationId: { userId: user.id, organizationId } } });
  return Boolean(membership);
}

export async function getWebsiteForUser(user: User, websiteId: string) {
  const website = await prisma.website.findUnique({ where: { id: websiteId }, include: { organization: true } });
  if (!website) return null;
  if (!(await canAccessOrganization(user, website.organizationId))) return null;
  return website;
}

export function normalizeHostname(input: string) {
  return input.trim().toLowerCase().replace(/\.$/, "");
}

export function isValidHostname(hostname: string) {
  if (hostname.length > 253 || hostname.includes("..")) return false;
  const labels = hostname.split(".");
  return labels.length >= 2 && labels.every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label));
}
