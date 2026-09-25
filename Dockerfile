FROM node:20-alpine

# Install openssl for Prisma engine
RUN apk add --no-cache openssl libc6-compat

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@11.21.0 --activate

WORKDIR /app

# Copy package manifests and workspace configuration from ai-digital-passport
COPY ai-digital-passport/pnpm-lock.yaml ai-digital-passport/pnpm-workspace.yaml ai-digital-passport/package.json ai-digital-passport/turbo.json ai-digital-passport/.npmrc ./
COPY ai-digital-passport/packages ./packages
COPY ai-digital-passport/apps/api ./apps/api

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
