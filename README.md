# ID Daddy SaaS

Multi-tenant ID card generator SaaS with a NestJS API, PostgreSQL RLS, Prisma, Redis/BullMQ, S3 storage, Stripe subscriptions, React super-admin web app, and Electron React desktop client.

## Folder Structure

```text
.
├── apps
│   ├── api
│   │   ├── prisma
│   │   │   ├── migrations/0001_init/migration.sql
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   └── src
│   │       ├── auth
│   │       ├── billing
│   │       ├── common
│   │       ├── exports
│   │       ├── files
│   │       ├── generation
│   │       ├── prisma
│   │       ├── records
│   │       ├── storage
│   │       ├── templates
│   │       ├── users
│   │       └── workspaces
│   ├── desktop
│   │   └── src
│   │       ├── main
│   │       ├── renderer
│   │       └── types
│   └── web-admin
│       └── src
│           ├── api
│           ├── components
│           ├── pages
│           └── store
├── docs
├── infra
│   ├── docker
│   └── nginx
└── packages
    └── shared
```

## Core Modules

- `apps/api`: NestJS API with JWT auth, RBAC, tenant-scoped Prisma transactions, RLS-backed PostgreSQL, Stripe, BullMQ, S3 storage, CSV/Excel uploads, and PDF generation.
- `apps/web-admin`: SaaS owner console for companies, users, billing, analytics, and workspace control.
- `apps/desktop`: Electron client for company users with Fabric.js template design, data upload, generation, and system printing.
- `packages/shared`: Shared roles, plans, limits, template design types, and API request/response contracts.

## Local Setup

1. Install Node.js 20+ and pnpm 9+.

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

4. Start local PostgreSQL, Redis, and MinIO:

   ```bash
   pnpm docker:up
   ```

5. Create the MinIO bucket:

   - Open `http://localhost:9001`
   - Sign in with `minioadmin` / `minioadmin`
   - Create bucket `id-daddy`

6. Generate Prisma client and run migrations:

   ```bash
   pnpm --filter @id-daddy/api prisma:generate
   pnpm db:migrate
   pnpm db:seed
   ```

7. Start all apps:

   ```bash
   pnpm dev
   ```

8. Open:

   - API docs: `http://localhost:4000/docs`
   - Super admin: `http://localhost:5173`
   - Electron client: launched by Electron dev script

Seed login defaults are controlled by `SEED_SUPER_ADMIN_EMAIL` and `SEED_SUPER_ADMIN_PASSWORD`.

## Environment Variables

Use `.env.example` as the source of truth. Required production groups:

- API origin and CORS: `API_PORT`, `API_PUBLIC_URL`, `WEB_ADMIN_URL`, `DESKTOP_APP_URL`
- Auth: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`
- Database: `DATABASE_URL` (local Docker uses host port `55432` to avoid common local PostgreSQL conflicts)
- Queue: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- Storage: `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_BASIC`, `STRIPE_PRICE_PRO`

## API Routes

- `POST /auth/login`
- `POST /auth/register`
- `GET /workspaces`
- `POST /workspaces`
- `PATCH /workspaces/:id`
- `GET /users`
- `POST /users`
- `PATCH /users/:id`
- `GET /templates`
- `POST /templates`
- `PATCH /templates/:id`
- `DELETE /templates/:id`
- `POST /records/upload`
- `GET /records`
- `POST /files/upload`
- `POST /generate`
- `GET /exports`
- `GET /exports/:id/download`
- `POST /billing/checkout`
- `POST /billing/webhook`

## Tenant Isolation

All tenant data uses `workspace_id`. PostgreSQL RLS is enabled and forced in `apps/api/prisma/migrations/0001_init/migration.sql`. The API sets transaction-local context through `PrismaService.runScoped()`:

```sql
workspace_id = current_setting('app.workspace_id')
```

Super-admin operations use `PrismaService.runAsPlatform()` and are explicitly reserved for platform-level routes.

## Plans

- Free: 50 IDs/month
- Basic: 500 IDs/month
- Pro: unlimited

Generation is blocked before a job is queued if the monthly usage plus requested records exceeds the plan limit.

## Deployment Guide

> [!TIP]
> For specific instructions on deploying to AWS (RDS, ElastiCache, EC2, App Runner), please see the [AWS Deployment Guide](./AWS_DEPLOYMENT.md).

## Deployment

See:

- `docs/DEPLOYMENT.md`
- `docs/SECURITY.md`

Container entrypoints are provided in:

- `infra/docker/api.Dockerfile`
- `infra/docker/web-admin.Dockerfile`
