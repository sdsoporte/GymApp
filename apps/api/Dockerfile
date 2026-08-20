FROM node:22-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate && pnpm install --frozen-lockfile
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared
WORKDIR /app/apps/api
EXPOSE 3000
CMD ["pnpm", "start"]
