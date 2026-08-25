export type DeploymentIntent = {
  applicationId: string;
  image: string;
  port: number;
  desiredState: "RUNNING" | "STOPPED";
  nodeId?: string;
};

export type DeploymentResult = {
  containerId?: string;
  status: "RUNNING" | "STOPPED" | "FAILED";
  message?: string;
};

export interface HostingProvider {
  name: string;
  provision(intent: DeploymentIntent): Promise<DeploymentResult>;
  stop(containerId: string): Promise<void>;
  remove(containerId: string): Promise<void>;
  health(): Promise<{ ok: boolean; message?: string }>;
}

export type DnsRecordInput = {
  type: "A" | "AAAA" | "CNAME" | "TXT" | "MX" | "NS";
  name: string;
  value: string;
  ttl: number;
  priority?: number;
};

export interface DnsProvider {
  name: string;
  ensureZone(hostname: string): Promise<{ zoneId: string }>;
  upsertRecord(zoneId: string, record: DnsRecordInput): Promise<{ providerId: string }>;
  deleteRecord(zoneId: string, providerId: string): Promise<void>;
  verify(hostname: string): Promise<boolean>;
}

export interface CertificateProvider {
  name: string;
  issue(hostname: string): Promise<{ certificateId: string; expiresAt?: Date }>;
  revoke(certificateId: string): Promise<void>;
}
