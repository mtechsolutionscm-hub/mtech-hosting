# MTECH Hosting — Development Roadmap

We develop in four batches per phase. Each batch must leave the repository in a coherent state. AWS/EC2/SSM deployment is deferred until a phase passes repository-level validation.

## Phase 1 — Control Plane Foundation
1. **Batch 1 — Institutional architecture**
   - Architecture, tenancy and infrastructure boundaries
   - Engineering conventions and deployment policy
2. **Batch 2 — Data foundation**
   - Audit/event model
   - Hosting catalog foundations
   - Seed-safe data services
3. **Batch 3 — Control-plane APIs**
   - Organization, website, domain and application APIs
   - Validation and consistent error responses
4. **Batch 4 — Operations dashboards**
   - Customer control-plane views
   - Admin operational overview
   - Resource tables and status presentation

## Phase 2 — Identity & Security
1. Authentication/session foundation
2. RBAC and tenant authorization
3. MFA/recovery/security events
4. Admin security console and audit review

## Phase 3 — Website & Application Provisioning
1. Deployment intent and operations
2. Docker/node adapter
3. Deployment history and rollback
4. Health checks and lifecycle controls

## Phase 4 — Domains, DNS & SSL
1. Domain inventory and verification
2. DNS provider abstraction
3. DNS records and propagation state
4. Automated TLS/SSL lifecycle

## Phase 5 — Billing & Commercial Platform
1. Plans and metering
2. Subscriptions and invoices
3. Payment provider abstraction
4. Customer billing portal and finance console

## Phase 6 — Global Infrastructure
1. Node/infrastructure registry
2. Regional scheduling
3. Capacity and placement engine
4. Multi-region operations

## Phase 7 — Reliability, Observability & Support
1. Metrics/logging
2. Alerts and incident management
3. Backups and recovery workflows
4. Support/ticketing and SLA reporting

## Phase 8 — Enterprise & Ecosystem
1. Reseller/agency management
2. API keys and developer platform
3. Webhooks and integrations
4. Enterprise governance and compliance reporting

## Phase 9 — Production Hardening
1. Security review
2. Load/performance testing
3. Disaster recovery validation
4. Production deployment and controlled migration
