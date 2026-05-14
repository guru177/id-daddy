# AWS Deployment Guide for ID Daddy SaaS

This guide provides instructions for deploying the ID Daddy SaaS platform to Amazon Web Services (AWS).

## Architecture Overview

- **Frontend**: React (Vite) served via Nginx in Docker.
- **Backend**: NestJS (Node.js) running in Docker.
- **Database**: PostgreSQL (managed via Amazon RDS or self-hosted).
- **Queue/Cache**: Redis (managed via Amazon ElastiCache or self-hosted).
- **Storage**: Amazon S3 (for image uploads and desktop app updates).
- **Desktop Updates**: GitHub Releases or S3-backed distribution.

---

## Prerequisites

1. AWS Account and IAM user with appropriate permissions.
2. [AWS CLI](https://aws.amazon.com/cli/) installed and configured.
3. [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed on the deployment target.
4. Domain name and SSL certificate (ACM recommended for ALB/CloudFront).

---

## 1. Storage Setup (Amazon S3)

The application uses S3 for storing ID card assets and potentially for distributing desktop app updates.

1. Create an S3 bucket (e.g., `id-daddy-storage`).
2. Disable "Block all public access" if you intend to serve assets publicly or via CloudFront.
3. Create an IAM User with `AmazonS3FullAccess` (or restricted to your bucket) and save the `Access Key ID` and `Secret Access Key`.

### Desktop App Updates (Required for Distribution)
To distribute the app and enable auto-updates:
1. Create a public S3 bucket (e.g., `id-daddy-app-distribution`).
2. Configure **CloudFront** in front of this bucket (highly recommended for HTTPS and global speed).
3. Ensure the bucket/CloudFront URL is reachable at `https://updates.iddaddy.in` (example).
4. Update `apps/desktop/package.json` with this URL (see Section 8).

---

## 2. Database Setup (Amazon RDS)

1. Launch a **PostgreSQL** instance in RDS (Version 16.x recommended).
2. Ensure the Security Group allows inbound traffic on port `5432` from your application server.
3. Note the endpoint (e.g., `id-daddy.xxxx.us-east-1.rds.amazonaws.com`).

---

## 3. Redis Setup

You have two options:
- **Managed**: Amazon ElastiCache for Redis (Recommended for production).
- **Self-hosted**: Run Redis in Docker on your EC2 instance (Simpler for initial launch).

---

## 4. Deployment Options

### Option A: EC2 with Docker Compose (Quickest)

This approach uses a single EC2 instance to run the API, Web Admin, and Redis.

1. **Launch an EC2 Instance**:
   - Instance Type: `t3.medium` or higher (2 vCPU, 4GB RAM recommended).
   - OS: Ubuntu 22.04 LTS or Amazon Linux 2023.
   - Use your `id_daddy_key_pair.ppk` to SSH into the instance.

2. **Install Docker & Compose**:
   ```bash
   sudo apt-get update
   sudo apt-get install docker.io docker-compose -y
   sudo usermod -aG docker $USER
   # Log out and back in
   ```

3. **Prepare Infrastructure Files**:
   Copy the `infra/docker`, `infra/nginx`, and `docker-compose.yml` to the server.

4. **Production `docker-compose.prod.yml`**:
   Create a production compose file on the server:
   ```yaml
   services:
     api:
       build:
         context: .
         dockerfile: infra/docker/api.Dockerfile
       restart: always
       env_file: .env
       ports:
         - "4000:4000"

     web-admin:
       build:
         context: .
         dockerfile: infra/docker/web-admin.Dockerfile
       restart: always
       ports:
         - "80:80"
         - "443:443"
   ```

5. **Configure Environment Variables**:
   Create a `.env` file based on `.env.example`, pointing to your RDS and S3 instances.

6. **Deploy**:
   ```bash
   docker-compose -f docker-compose.prod.yml up --build -d
   ```

### Option B: AWS App Runner (Modern & Scalable)

Ideal for the API and Web Admin as it handles scaling and SSL automatically.

1. **API**: Point App Runner to your GitHub repository, select `infra/docker/api.Dockerfile`.
2. **Web Admin**: Point App Runner to the repo, select `infra/docker/web-admin.Dockerfile`.
3. Configure environment variables in the App Runner console.

---

## 5. SSL and Domain Configuration

### Route 53 & ACM
1. Register your domain in **Route 53**.
2. Request a public certificate in **AWS Certificate Manager (ACM)** for `api.yourdomain.com` and `admin.yourdomain.com`.

### Application Load Balancer (ALB)
1. Create an ALB to route traffic to your EC2 instance or ECS tasks.
2. Add HTTPS listeners (port 443) using the ACM certificate.
3. Forward traffic to the appropriate target groups (Port 80 for Web, Port 4000 for API).

---

## 6. Continuous Deployment (GitHub Actions)

You can automate deployment by adding a workflow in `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and Push Images
        run: |
          docker build -t id-daddy-api -f infra/docker/api.Dockerfile .
          docker build -t id-daddy-web -f infra/docker/web-admin.Dockerfile .
          # Tag and push to ECR...
```

---

## 7. Post-Deployment Checklist

- [ ] **Run Database Migrations**:
  - Docker: `docker exec -it <api_container_name> npx prisma migrate deploy`
  - Manual: `pnpm --filter @id-daddy/api prisma migrate deploy`
- [ ] **Seed Initial Data** (Create Super Admin):
  - Docker: `docker exec -it <api_container_name> pnpm run prisma:seed`
  - Manual: `pnpm db:seed`
- [ ] **Verify S3 Connectivity**: Upload a test logo in the settings panel.
- [ ] **Check Redis Connection**: Ensure background PDF generation jobs (BullMQ) are processing.
- [ ] **API Prefix**: Ensure `app.setGlobalPrefix('api')` is present in `main.ts` to match Nginx `/api` routing.
- [ ] **Environment Sync**: Double-check that `API_PUBLIC_URL` and `WEB_ADMIN_URL` are set correctly for production domains.
---

## 8. Desktop App Distribution (To Clients)

Distributing the desktop app involves building a production installer and hosting it so clients can download it and receive automatic updates.

### A. Configure Production URL
In `apps/desktop/package.json`, update the `publish` section to point to your production update server (S3/CloudFront):

```json
"publish": [
  {
    "provider": "generic",
    "url": "https://updates.yourdomain.com/"
  }
]
```

### B. Production Build Environment
Before building the desktop app for clients, ensure the renderer points to the **Production API**:

1. Create/Update `apps/desktop/.env.production`:
   ```env
   VITE_API_URL=https://api.yourdomain.com
   ```

### C. Build and Package
Run the build command from the root or within the `apps/desktop` directory:
```bash
pnpm --filter @id-daddy/desktop build
```
This generates:
- `ID-Daddy-X.X.X-Setup.exe` (The installer)
- `latest.yml` (Metadata for auto-updates)
- `ID-Daddy-X.X.X-Setup.exe.blockmap` (For differential updates)

### D. Upload to AWS S3/CloudFront
Upload the contents of `apps/desktop/release` to your distribution bucket:
```bash
aws s3 sync apps/desktop/release/ s3://id-daddy-app-distribution/ --exclude "*" --include "*.exe" --include "*.yml" --include "*.blockmap" --acl public-read
```

### E. Code Signing (Crucial for Windows)
To avoid the "Windows protected your PC" warning:
1. Purchase a **Code Signing Certificate** (e.g., from DigiCert or Sectigo).
2. Configure `electron-builder` with your certificate information or use the `CSC_LINK` and `CSC_KEY_PASSWORD` environment variables during build.

### F. Distributing to Clients
Provide the direct link to the installer to your clients:
`https://updates.yourdomain.com/ID-Daddy-1.0.0-Setup.exe`

When you release a new version:
1. Increment `version` in `apps/desktop/package.json`.
2. Rebuild and re-upload all files to S3.
3. The `latest.yml` file will notify existing installations to download and apply the update automatically.

---

## 9. Troubleshooting Client Distribution

- **Update Not Detected**: Ensure the `url` in `latest.yml` on S3 matches the actual URL where the `.exe` is hosted.
- **CORS Issues**: If the app fails to download updates, check the S3 bucket CORS policy or CloudFront header settings.
- **API Connection Error**: Verify that the `VITE_API_URL` was correctly baked into the build (check the dev tools in the production app if possible).
