# ── Stage 1: Dependencies ────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /workspace
COPY package.json ./
COPY package-lock.json ./
COPY apps/web/package.json ./apps/web/package.json
RUN npm ci --omit=dev --ignore-scripts

# ── Stage 2: Build ──────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /workspace
COPY package.json ./
COPY package-lock.json ./
COPY apps/web/package.json ./apps/web/package.json
RUN npm ci --ignore-scripts
COPY apps/web ./apps/web
WORKDIR /workspace/apps/web
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_API_BASE_PATH
ARG NEXT_PUBLIC_BASE_PATH
ARG NEXT_PUBLIC_PUBLIC_BASE_PATH
ARG NEXT_PUBLIC_ASSET_PREFIX
ARG SERVER_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_API_BASE_PATH=${NEXT_PUBLIC_API_BASE_PATH}
ENV NEXT_PUBLIC_BASE_PATH=${NEXT_PUBLIC_BASE_PATH}
ENV NEXT_PUBLIC_PUBLIC_BASE_PATH=${NEXT_PUBLIC_PUBLIC_BASE_PATH}
ENV NEXT_PUBLIC_ASSET_PREFIX=${NEXT_PUBLIC_ASSET_PREFIX}
ENV SERVER_API_BASE_URL=${SERVER_API_BASE_URL}
RUN npm run build

# ── Stage 3: Production ─────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /workspace/apps/web
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /workspace/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/web/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
