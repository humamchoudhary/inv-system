# ---------- Base (shared locale/system config) ----------
FROM node:20-alpine AS base
RUN apk add --no-cache \
        musl-locales \
        musl-locales-lang \
        icu-data-full \
        tzdata \
        libc6-compat && \
    echo 'export LC_ALL=es_US.UTF-8' >> /etc/profile.d/locale.sh && \
    sed -i 's|LANG=C.UTF-8|LANG=es_US.UTF-8|' /etc/profile.d/locale.sh

ENV LANG=es_ES.UTF-8 \
    LANGUAGE=es_ES:es \
    LC_ALL=es_ES.UTF-8 \
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
