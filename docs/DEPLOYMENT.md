# Deployment Guide

## Recommended Topology

- API: containerized NestJS service behind HTTPS.
- Web admin: static build served from CDN or Nginx.
- Desktop app: built with `electron-builder` and published to an update feed.
- Database: managed PostgreSQL 16+.
- Queue: managed Redis 7+.
- Storage: private AWS S3 bucket.
- Payments: Stripe Checkout and webhooks.

## API Deployment

1. Build the image:

   ```bash
   docker build -f infra/docker/api.Dockerfile -t id-daddy-api .
   ```

2. Set production environment variables from `.env.example`.

3. Run migrations:

   ```bash
   pnpm --filter @id-daddy/api prisma:deploy
   pnpm --filter @id-daddy/api prisma:seed
   ```

4. Start the API:

   ```bash
   node apps/api/dist/main.js
   ```

## Web Admin Deployment

1. Set `VITE_API_URL` to your public API origin.

2. Build the static app:

   ```bash
   pnpm --filter @id-daddy/web-admin build
   ```

3. Serve `apps/web-admin/dist` through Nginx, S3 + CloudFront, Vercel, or Netlify.

## Desktop Release

1. Set `VITE_API_URL` to your production API origin.

2. Configure `apps/desktop/package.json` `build.publish.url` to your update feed.

3. Build the Windows installer:

   ```bash
   pnpm --filter @id-daddy/desktop build
   ```

4. Publish generated artifacts from `apps/desktop/release`.

## Stripe

1. Create Basic and Pro recurring prices.
2. Put price ids in `STRIPE_PRICE_BASIC` and `STRIPE_PRICE_PRO`.
3. Add a webhook endpoint at `/billing/webhook`.
4. Subscribe to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

## AWS S3

1. Create a private bucket.
2. Enable server-side encryption.
3. Create an IAM policy allowing `s3:GetObject` and `s3:PutObject` for that bucket.
4. Set `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_S3_BUCKET`.
