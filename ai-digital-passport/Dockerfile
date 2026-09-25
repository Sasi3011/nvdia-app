FROM node:20-alpine

# Install openssl for Prisma engine
RUN apk add --no-cache openssl libc6-compat

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@11.21.0 --activate

WORKDIR /app

# Copy package manifests and workspace configuration
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json .npmrc ./
COPY packages ./packages
COPY apps/api ./apps/api

# Install dependencies (hoisted via .npmrc)
RUN pnpm install --frozen-lockfile

# Build shared types, database schema (Prisma generate), and API
RUN pnpm turbo run build --filter=@ai-digital-passport/api

ENV PORT=1002
ENV NODE_ENV=production
ENV NODE_PATH=/app/node_modules:/app/apps/api/node_modules

EXPOSE 1002

# Run directly from /app so Node finds all hoisted node_modules
CMD ["node", "apps/api/dist/main.js"]
