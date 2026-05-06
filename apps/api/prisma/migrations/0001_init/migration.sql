CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE "role" AS ENUM ('SUPER_ADMIN', 'COMPANY_ADMIN', 'STAFF', 'VIEWER');
CREATE TYPE "plan" AS ENUM ('FREE', 'BASIC', 'PRO');
CREATE TYPE "workspace_status" AS ENUM ('ACTIVE', 'BLOCKED', 'PAST_DUE', 'CANCELED');
CREATE TYPE "export_status" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

CREATE TABLE "workspaces" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "plan" "plan" NOT NULL DEFAULT 'FREE',
  "status" "workspace_status" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "users" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "workspace_id" UUID,
  "email" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "role" "role" NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "templates" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "workspace_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "design" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "records" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "workspace_id" UUID NOT NULL,
  "data" JSONB NOT NULL,
  "image_url" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "exports" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "workspace_id" UUID NOT NULL,
  "file_url" TEXT,
  "status" "export_status" NOT NULL DEFAULT 'PENDING',
  "error" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "exports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subscriptions" (
  "workspace_id" UUID NOT NULL,
  "plan" "plan" NOT NULL,
  "start_date" TIMESTAMP(3) NOT NULL,
  "end_date" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("workspace_id")
);

CREATE TABLE "usage_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "workspace_id" UUID NOT NULL,
  "action" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "usage_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "workspaces_status_idx" ON "workspaces"("status");
CREATE INDEX "users_workspace_id_idx" ON "users"("workspace_id");
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "templates_workspace_id_idx" ON "templates"("workspace_id");
CREATE INDEX "records_workspace_id_idx" ON "records"("workspace_id");
CREATE INDEX "exports_workspace_id_idx" ON "exports"("workspace_id");
CREATE INDEX "exports_status_idx" ON "exports"("status");
CREATE INDEX "usage_logs_workspace_id_action_created_at_idx" ON "usage_logs"("workspace_id", "action", "created_at");

ALTER TABLE "users" ADD CONSTRAINT "users_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "templates" ADD CONSTRAINT "templates_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "records" ADD CONSTRAINT "records_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exports" ADD CONSTRAINT "exports_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "usage_logs" ADD CONSTRAINT "usage_logs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE SCHEMA IF NOT EXISTS app;

CREATE OR REPLACE FUNCTION app.current_workspace_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.workspace_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION app.current_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION app.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT current_setting('app.is_super_admin', true) = 'true'
$$;

ALTER TABLE "workspaces" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "exports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "usage_logs" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "workspaces" FORCE ROW LEVEL SECURITY;
ALTER TABLE "users" FORCE ROW LEVEL SECURITY;
ALTER TABLE "templates" FORCE ROW LEVEL SECURITY;
ALTER TABLE "records" FORCE ROW LEVEL SECURITY;
ALTER TABLE "exports" FORCE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions" FORCE ROW LEVEL SECURITY;
ALTER TABLE "usage_logs" FORCE ROW LEVEL SECURITY;

CREATE POLICY "workspaces_select" ON "workspaces"
  FOR SELECT USING (app.is_super_admin() OR "id" = app.current_workspace_id());
CREATE POLICY "workspaces_insert" ON "workspaces"
  FOR INSERT WITH CHECK (app.is_super_admin());
CREATE POLICY "workspaces_update" ON "workspaces"
  FOR UPDATE USING (app.is_super_admin() OR "id" = app.current_workspace_id())
  WITH CHECK (app.is_super_admin() OR "id" = app.current_workspace_id());
CREATE POLICY "workspaces_delete" ON "workspaces"
  FOR DELETE USING (app.is_super_admin());

CREATE POLICY "users_select" ON "users"
  FOR SELECT USING (
    app.is_super_admin()
    OR "workspace_id" = app.current_workspace_id()
    OR "id" = app.current_user_id()
  );
CREATE POLICY "users_insert" ON "users"
  FOR INSERT WITH CHECK (
    app.is_super_admin()
    OR ("workspace_id" IS NOT NULL AND "workspace_id" = app.current_workspace_id())
  );
CREATE POLICY "users_update" ON "users"
  FOR UPDATE USING (
    app.is_super_admin()
    OR ("workspace_id" IS NOT NULL AND "workspace_id" = app.current_workspace_id())
  )
  WITH CHECK (
    app.is_super_admin()
    OR ("workspace_id" IS NOT NULL AND "workspace_id" = app.current_workspace_id())
  );
CREATE POLICY "users_delete" ON "users"
  FOR DELETE USING (
    app.is_super_admin()
    OR ("workspace_id" IS NOT NULL AND "workspace_id" = app.current_workspace_id())
  );

CREATE POLICY "templates_tenant" ON "templates"
  USING (app.is_super_admin() OR "workspace_id" = app.current_workspace_id())
  WITH CHECK (app.is_super_admin() OR "workspace_id" = app.current_workspace_id());

CREATE POLICY "records_tenant" ON "records"
  USING (app.is_super_admin() OR "workspace_id" = app.current_workspace_id())
  WITH CHECK (app.is_super_admin() OR "workspace_id" = app.current_workspace_id());

CREATE POLICY "exports_tenant" ON "exports"
  USING (app.is_super_admin() OR "workspace_id" = app.current_workspace_id())
  WITH CHECK (app.is_super_admin() OR "workspace_id" = app.current_workspace_id());

CREATE POLICY "subscriptions_tenant" ON "subscriptions"
  USING (app.is_super_admin() OR "workspace_id" = app.current_workspace_id())
  WITH CHECK (app.is_super_admin() OR "workspace_id" = app.current_workspace_id());

CREATE POLICY "usage_logs_tenant" ON "usage_logs"
  USING (app.is_super_admin() OR "workspace_id" = app.current_workspace_id())
  WITH CHECK (app.is_super_admin() OR "workspace_id" = app.current_workspace_id());
