# MTECH Hosting — Institutional Architecture

## 1. Mission
MTECH Hosting is designed as a multi-tenant global web and domain hosting control plane. It separates customer tenancy, infrastructure orchestration, domain/DNS services, security, billing, support and observability so the platform can scale without coupling business operations to one server.

## 2. Institutional layers

### Governance
- Executive governance and product ownership
- Technology and security governance
- Finance, billing and commercial operations
- Customer success and support
- Compliance, risk and audit

### Control plane
- Identity and access management
- Tenant/organization management
- Website and application lifecycle
- Domain inventory and DNS orchestration
- Plans, subscriptions and invoices
- Support and operational workflows
- Audit and activity records

### Infrastructure plane
- Compute nodes / Docker hosts
- Reverse proxy and edge routing
- TLS/SSL certificate automation
- DNS providers and authoritative zones
- Object/file storage
- PostgreSQL and backups
- Metrics, logs and health monitoring

### Experience layer
- Public marketing website
- Customer portal
- Administrator portal
- Support portal
- API and automation clients
- Future mobile/PWA experience

## 3. Tenancy model

Every customer-owned resource belongs to an Organization. Users receive access through Membership records. Organization ownership is therefore independent from a physical server and can later be migrated between infrastructure nodes without changing the customer identity.

The platform must enforce organization scoping in every application service and API route. No customer-facing endpoint should accept an organization identifier as trusted authorization input without deriving the effective organization from the authenticated session and membership.

## 4. Resource hierarchy

`User -> Membership -> Organization -> Website -> Domain/Application`

Future hierarchy:

`Organization -> Project -> Environment -> Service -> Deployment`

This supports agencies, enterprises and managed hosting partners that operate multiple websites and environments.

## 5. Infrastructure abstraction

The application database is the source of truth for desired state. Infrastructure workers reconcile desired state with actual state. The web application should request actions such as `DEPLOY`, `STOP`, `RESTART`, `ISSUE_CERTIFICATE`, or `SYNC_DNS`; it should not embed provider-specific shell commands in page components.

Provider adapters will later support:
- Docker / container hosts
- AWS EC2
- AWS Route 53
- Cloudflare DNS
- Other VPS/cloud nodes

## 6. Security architecture

- Role-based access control (RBAC)
- Tenant isolation
- Secure password hashing and session management
- Server-side validation with Zod
- Audit logs for privileged actions
- Secrets only through environment/secret management
- No credentials committed to Git
- Rate limiting on authentication and sensitive APIs
- TLS everywhere in production
- Backups and recovery procedures

## 7. Reliability model

The control plane should remain operational even when an infrastructure node is unavailable. Long-running infrastructure actions therefore belong in asynchronous jobs/workers. API requests should create an operation and return an operation identifier rather than blocking on provisioning.

## 8. Commercial architecture

Billing is a first-class domain, not a field on a website. Plans define limits and features; subscriptions bind an organization to a plan; invoices and payment records provide the financial ledger. This permits monthly, annual, prepaid, reseller and enterprise contracts.

## 9. Regional/global scale

The initial deployment may run on one AWS EC2/SSM-managed host, but the architecture deliberately avoids making that server the platform itself. Later regions can introduce additional infrastructure pools while the control plane remains centralized or region-aware.

## 10. Development rule

All feature development is completed and validated in GitHub first. AWS EC2/SSM is treated as a deployment target, not the primary development environment. Production deployment happens only after the GitHub branch is buildable and reviewed.
