# ---------- Base (shared locale/system config) ----------
FROM node:20-alpine AS base
# RUN apk add --no-cache \
RUN apt-get update && apt-get install -y --no-install-recommends \
        locales \
        tzdata \
    && sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen \
    && locale-gen \
    && rm -rf /var/lib/apt/lists/*

ENV LANG=en_US.UTF-8 \
    LANGUAGE=en_US:en \
    LC_ALL=en_US.UTF-8 \
    TZ=UTC \
    NEXT_TELEMETRY_DISABLED=1

# ---------- Dependencies ----------
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- Builder ----------
FROM base AS builder
WORKDIR /app
ENV NODE_OPTIONS="--max-old-space-size=4096"
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- Runner (Production) ----------
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=6003 \
    HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nextjs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static

USER nextjs
EXPOSE $PORT
CMD ["node", "server.js"]
