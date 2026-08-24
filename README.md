# MTECH Hosting

Multi-tenant hosting control plane MVP for MTECHsolutions.

## Batch 1
- Next.js 15 + TypeScript
- Prisma + PostgreSQL
- Tenant-aware data model
- Admin and customer roles
- Customer dashboard
- Admin dashboard
- Health endpoint
- Docker-ready production layout

## Planned
- Website/domain provisioning
- Nginx management
- Docker application lifecycle
- DNS management
- SSL automation
- GitHub deployments
- Billing and domain reseller integration

## Local development

```bash
cp .env.example .env
npm install
npx prisma generate
npm run db:push
npm run dev
```
