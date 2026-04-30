# syntax=docker/dockerfile:1.6
# ─────────────────────────────────────────────────────────────
# Hyrd · Next.js 15 · multi-stage Dockerfile
# Targets:
#   dev    -> hot-reloading dev server (volume-mounted)
#   runner -> production standalone server
# ─────────────────────────────────────────────────────────────

# ============== deps =====================================================
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# ============== dev =====================================================
FROM node:20-alpine AS dev
WORKDIR /app
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ============== build ===================================================
FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# Build-time placeholders so `next build` can run without real keys.
ENV NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ============== runner ==================================================
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Copy public if present (the standalone server expects ./public to exist)
RUN mkdir -p public

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
