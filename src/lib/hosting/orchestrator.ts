import { DeploymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { HostingProvider } from "./types";

export async function queueDeployment(
  applicationId: string,
  provider: HostingProvider,
) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { deployments: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (!application) {
    throw new Error("Application not found");
  }

  const latest = application.deployments[0];
  if (latest && [DeploymentStatus.QUEUED, DeploymentStatus.PROVISIONING, DeploymentStatus.DEPLOYING].includes(latest.status)) {
    return latest;
  }

  return prisma.deployment.create({
    data: {
      applicationId,
      image: application.image,
      desiredState: "RUNNING",
      status: DeploymentStatus.QUEUED,
      events: {
        create: {
          type: "QUEUED",
          message: `Deployment queued for provider ${provider.name}.`,
        },
      },
    },
  });
}

export async function executeDeployment(deploymentId: string, provider: HostingProvider) {
  const deployment = await prisma.deployment.findUnique({
    where: { id: deploymentId },
    include: { application: true },
  });

  if (!deployment) throw new Error("Deployment not found");

  await prisma.deployment.update({
    where: { id: deploymentId },
    data: {
      status: DeploymentStatus.PROVISIONING,
      events: {
        create: {
          type: "PROVISIONING",
          message: `Provisioning started on ${provider.name}.`,
        },
      },
    },
  });

  try {
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: { status: DeploymentStatus.DEPLOYING },
    });

    const result = await provider.provision({
      applicationId: deployment.applicationId,
      image: deployment.image,
      port: deployment.application.port,
      desiredState: deployment.desiredState === "STOPPED" ? "STOPPED" : "RUNNING",
      nodeId: deployment.nodeId ?? undefined,
    });

    const finalStatus = result.status === "RUNNING"
      ? DeploymentStatus.RUNNING
      : result.status === "STOPPED"
        ? DeploymentStatus.STOPPED
        : DeploymentStatus.FAILED;

    return prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status: finalStatus,
        containerId: result.containerId,
        errorMessage: result.status === "FAILED" ? result.message : null,
        startedAt: finalStatus === DeploymentStatus.RUNNING ? new Date() : null,
        finishedAt: finalStatus === DeploymentStatus.FAILED ? new Date() : null,
        events: {
          create: {
            type: finalStatus,
            message: result.message ?? `Provider returned ${result.status}.`,
          },
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown deployment failure";
    return prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status: DeploymentStatus.FAILED,
        errorMessage: message,
        finishedAt: new Date(),
        events: {
          create: {
            type: "FAILED",
            message,
            metadata: { error: String(error) } as Prisma.InputJsonValue,
          },
        },
      },
    });
  }
}
