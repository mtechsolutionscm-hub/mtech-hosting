import type {
  CertificateProvider,
  DeploymentIntent,
  DeploymentResult,
  DnsProvider,
  DnsRecordInput,
  HostingProvider,
} from "./types";

/**
 * Development-safe provider. It never touches Docker, DNS or certificates.
 * Real adapters are introduced behind the same contracts in later infrastructure batches.
 */
export class LocalHostingProvider implements HostingProvider {
  name = "local";

  async provision(intent: DeploymentIntent): Promise<DeploymentResult> {
    return {
      status: intent.desiredState === "RUNNING" ? "RUNNING" : "STOPPED",
      containerId: `planned-${intent.applicationId}`,
      message: "Provisioning intent accepted by local provider.",
    };
  }

  async stop(_containerId: string): Promise<void> {}
  async remove(_containerId: string): Promise<void> {}
  async health(): Promise<{ ok: boolean; message?: string }> {
    return { ok: true, message: "Local provider is available." };
  }
}

export class NoopDnsProvider implements DnsProvider {
  name = "noop";

  async ensureZone(_hostname: string) {
    return { zoneId: "planned-zone" };
  }

  async upsertRecord(_zoneId: string, _record: DnsRecordInput) {
    return { providerId: "planned-record" };
  }

  async deleteRecord(_zoneId: string, _providerId: string): Promise<void> {}

  async verify(_hostname: string) {
    return false;
  }
}

export class NoopCertificateProvider implements CertificateProvider {
  name = "noop";

  async issue(hostname: string) {
    return { certificateId: `planned-cert-${hostname}` };
  }

  async revoke(_certificateId: string): Promise<void> {}
}
