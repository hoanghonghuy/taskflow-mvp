# Multi-stage build for Taskflow frontend (Next.js 16, standalone output)

# =====================
# Dependencies stage
# =====================
FROM node:22-alpine AS deps
WORKDIR /app

# Install dependencies based on the lockfile for reproducible builds
COPY package.json package-lock.json ./
RUN npm ci

# =====================
# Build stage
# =====================
FROM node:22-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# BACKEND_URL is only needed at runtime (server-side proxy), not at build time.
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# =====================
# Runtime stage
# =====================
FROM node:22-alpine AS final
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as a non-root user
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nextjs -u 1001

# Copy the standalone server output and static assets
COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
