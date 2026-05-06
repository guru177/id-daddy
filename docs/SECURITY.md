# Security Notes

## Tenant Isolation

Every tenant-owned table has a `workspace_id` column and PostgreSQL row-level security enabled with `FORCE ROW LEVEL SECURITY`.
The API uses `PrismaService.runScoped()` for tenant work. It opens a transaction and sets:

- `app.user_id`
- `app.workspace_id`
- `app.role`
- `app.is_super_admin`

RLS policies then require `workspace_id = app.current_workspace_id()` unless the request is a platform super-admin operation.

## Authentication And Authorization

- Passwords are hashed with bcrypt-compatible `bcryptjs`.
- Access and refresh tokens use separate secrets.
- Controllers use JWT auth by default. Public routes must explicitly use `@Public()`.
- Role-gated routes use `@Roles(...)`.

## File Handling

- Dataset imports accept only `.csv`, `.xls`, and `.xlsx`.
- Image uploads accept only PNG and JPEG.
- Files are stored in S3-compatible storage under workspace-scoped keys.
- Generated PDFs are stored privately and accessed with short-lived signed URLs.

## Production Hardening Checklist

- Use strong random JWT secrets.
- Use TLS everywhere.
- Use managed PostgreSQL and Redis with private networking.
- Rotate AWS and Stripe keys regularly.
- Configure Stripe webhook raw body forwarding.
- Add rate limiting at the edge and API layer.
- Enable S3 bucket encryption and block public access.
- Run Prisma migrations through CI/CD before API deployment.
