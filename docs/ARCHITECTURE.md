# MTECH Hosting — Institutional Architecture

## 1. Platform mission
MTECH Hosting is designed as a multi-tenant control plane for professional web, application and domain hosting. The platform separates customer control-plane operations from infrastructure-plane execution so that the same product can operate on a single EC2 node during pilot deployment and scale to multiple regions and providers later.

## 2. Institutional layers

```text
CUSTOMER EXPERIENCE
  ├─ Customer Portal
  ├─ Organization / Team Management
  ├─ Websites & Applications
  ├─ Domains / DNS / SSL
  └─ Billing / Usage / Support

CONTROL PLANE
  ├─ Identity & RBAC
  ├─ Tenant / Organization Service
  ├─ Website & Domain Service
  ├─ Deployment Orchestrator
  ├─ DNS Provider Abstraction
  ├─ Certificate Manager
  ├─ Billing / Entitlement Engine
  ├─ Audit / Event Service
  └─ Observability API

INFRASTRUCTURE PLANE
  ├─ Hosting Nodes
  ├─ Container Runtime
  ├─ Reverse Proxy / Edge
  ├─ DNS Providers
  ├─ Certificate Authorities
  ├─ Object / Backup Storage
  └─ Monitoring Agents

DATA PLANE
  ├─ PostgreSQL — authoritative control-plane state
  ├─ Redis / Queue — asynchronous work (future)
  ├─ Object Storage — backups / artifacts (future)
  └─ Metrics / Logs — observability (future)
```

## 3. Institutional boundaries
- **Control plane owns intent and state.** It records what should exist and the desired lifecycle state.
- **Infrastructure plane owns execution.** Workers perform container, network, certificate and DNS operations.
- **Provider adapters prevent vendor lock-in.** AWS, Cloudflare, Route53, Hetzner and other providers can be integrated behind stable interfaces.
- **Tenancy is enforced at the organization boundary.** Customer data must never be queried without an organization scope once authentication is enabled.
- **Auditability is a first-class requirement.** Mutating operations should emit an auditable event with actor, organization, resource and outcome.

## 4. Core resource hierarchy

```text
User
  └─ Membership
      └─ Organization
          ├─ Website
          │   ├─ Domain
          │   ├─ Application
          │   │   └─ Deployment
          │   └─ Certificate
          └─ Subscription / Plan (future billing layer)
```

## 5. Deployment lifecycle

```text
CREATED
  → QUEUED
  → PROVISIONING
  → DEPLOYING
  → RUNNING

Failure path:
  QUEUED / PROVISIONING / DEPLOYING → FAILED

Operational path:
  RUNNING → STOPPED → QUEUED
```

The control plane must be idempotent: repeating the same desired-state request must converge on the same infrastructure state rather than creating duplicate resources.

## 6. Domain lifecycle

```text
PENDING → VERIFYING → ACTIVE
                 ↘ FAILED
ACTIVE → SUSPENDED
```

DNS changes are performed through provider adapters. Certificates are requested only after domain ownership and routing prerequisites are satisfied.

## 7. Production topology target

```text
Internet
   │
   ▼
DNS / CDN / WAF
   │
   ▼
Edge / Reverse Proxy
   │
   ├──────────────┐
   ▼              ▼
Web/App Nodes   Control Plane
   │              │
Containers        PostgreSQL
                  │
                  ├─ Queue / Redis
                  ├─ Object Storage
                  └─ Audit / Metrics
```

The initial AWS deployment may run the control plane and one hosting node on the same EC2 environment. The architecture deliberately keeps those concerns separable so that later horizontal scaling does not require rewriting the product.

## 8. Engineering standards
- TypeScript strict mode.
- Prisma 6.19.3 is pinned until a deliberate Prisma 7 migration is planned.
- No production secrets in GitHub.
- No direct infrastructure mutations from customer-facing UI code.
- All asynchronous infrastructure work should be represented as a durable deployment/job state.
- Provider-specific code belongs in adapters, not in domain/business logic.
- AWS deployment happens only after GitHub build/CI validation.
