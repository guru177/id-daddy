FROM node:20-alpine AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/web-admin/package.json apps/web-admin/package.json
RUN pnpm install --filter @id-daddy/web-admin... --frozen-lockfile
COPY packages packages
COPY apps/web-admin apps/web-admin
RUN pnpm --filter @id-daddy/web-admin build

FROM nginx:1.27-alpine
COPY --from=build /app/apps/web-admin/dist /usr/share/nginx/html
COPY infra/nginx/web-admin.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
