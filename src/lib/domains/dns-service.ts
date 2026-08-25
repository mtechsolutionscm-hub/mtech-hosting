import { DnsRecordStatus, DnsRecordType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { DnsProvider, DnsRecordInput } from "@/lib/hosting/types";

export async function ensureDomainZone(domainId: string, provider: DnsProvider) {
  const domain = await prisma.domain.findUnique({ where: { id: domainId } });
  if (!domain) throw new Error("Domain not found");

  const zone = await provider.ensureZone(domain.hostname);
  return prisma.domain.update({
    where: { id: domainId },
    data: {
      dnsProvider: provider.name,
      dnsZoneId: zone.zoneId,
    },
  });
}

export async function upsertDnsRecord(
  domainId: string,
  input: DnsRecordInput,
  provider: DnsProvider,
) {
  const domain = await prisma.domain.findUnique({ where: { id: domainId } });
  if (!domain) throw new Error("Domain not found");
  if (!domain.dnsZoneId) await ensureDomainZone(domainId, provider);

  const refreshed = await prisma.domain.findUnique({ where: { id: domainId } });
  if (!refreshed?.dnsZoneId) throw new Error("DNS zone is unavailable");

  const providerRecord = await provider.upsertRecord(refreshed.dnsZoneId, input);

  return prisma.dnsRecord.create({
    data: {
      domainId,
      type: input.type as DnsRecordType,
      name: input.name,
      value: input.value,
      ttl: input.ttl,
      priority: input.priority,
      providerId: providerRecord.providerId,
      status: DnsRecordStatus.ACTIVE,
    },
  });
}

export async function verifyDomain(domainId: string, provider: DnsProvider) {
  const domain = await prisma.domain.findUnique({ where: { id: domainId } });
  if (!domain) throw new Error("Domain not found");

  const verified = await provider.verify(domain.hostname);
  return prisma.domain.update({
    where: { id: domainId },
    data: verified ? { verifiedAt: new Date() } : { verifiedAt: null },
  });
}
