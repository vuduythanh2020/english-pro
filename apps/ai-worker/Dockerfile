# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable pnpm

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/ai-worker/package.json ./apps/ai-worker/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/shared-types/ ./packages/shared-types/
COPY apps/ai-worker/ ./apps/ai-worker/

# Build shared-types first, then AI Worker
RUN pnpm --filter @english-pro/shared-types build
RUN pnpm --filter english-pro-ai-worker build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app
RUN corepack enable pnpm

# Copy workspace config for pnpm workspace resolution
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages/shared-types/package.json ./packages/shared-types/
COPY --from=builder /app/apps/ai-worker/package.json ./apps/ai-worker/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts
COPY --from=builder /app/packages/shared-types/dist/ ./packages/shared-types/dist/
COPY --from=builder /app/apps/ai-worker/dist/ ./apps/ai-worker/dist/

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001
USER nestjs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "apps/ai-worker/dist/main.js"]
