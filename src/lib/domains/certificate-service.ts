import { CertificateStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CertificateProvider } from "@/lib/hosting/types";

export async function requestCertificate(
  websiteId: string,
  hostname: string,
  provider: CertificateProvider,
) {
  const existing = await prisma.certificate.findUnique({
    where: { websiteId_hostname: { websiteId, hostname } },
  });

  const certificate = existing
    ? await prisma.certificate.update({
        where: { id: existing.id },
        data: { status: CertificateStatus.ISSUING, lastError: null },
      })
    : await prisma.certificate.create({
        data: {
          websiteId,
          hostname,
          provider: provider.name,
          status: CertificateStatus.ISSUING,
        },
      });

  try {
    const result = await provider.issue(hostname);
    return prisma.certificate.update({
      where: { id: certificate.id },
      data: {
        status: CertificateStatus.ACTIVE,
        issuedAt: new Date(),
        expiresAt: result.expiresAt,
        lastError: null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Certificate issuance failed";
    return prisma.certificate.update({
      where: { id: certificate.id },
      data: { status: CertificateStatus.FAILED, lastError: message },
    });
  }
}

export async function findCertificatesDueForRenewal(days = 30) {
  const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return prisma.certificate.findMany({
    where: {
      expiresAt: { lte: cutoff },
      status: { in: [CertificateStatus.ACTIVE, CertificateStatus.EXPIRING] },
    },
    orderBy: { expiresAt: "asc" },
  });
}
