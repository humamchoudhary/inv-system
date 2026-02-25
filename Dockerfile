# Dockerfile for Next.js Application (with configurable port)

# ---------- Dependencies ----------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ---------- Builder ----------
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
RUN apk add --no-cache icu-data-full tzdata
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=4096"


ENV LANG=en_US.UTF-8
ENV LC_ALL=en_US.UTF-8
# Build the application
RUN npm run build

# ---------- Runner (Production) ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# RUN apk add --no-cache icu-data-full tzdata libc6-compat

RUN apt-get update && apt-get install -y locales && rm -rf /var/lib/apt/lists/* \
    && locale-gen "es_US.UTF-8"

# Set the environment variables for Spanish (Spain)
ENV LANG es_US.UTF-8
ENV LANGUAGE es_US:us
ENV LC_ALL es_US.UTF-8


# ARG GEMINI_API_KEY
# ENV GEMINI_API_KEY=$GEMINI_API_KEY
# Default port (can be overridden at runtime)
ENV PORT=6003
ENV HOSTNAME="0.0.0.0"
# ENV LANG=en_US.UTF-8
# ENV LC_ALL=en_US.UTF-8


# Create non-root user for security
RUN addgroup --system --gid 1001 nextjs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder (standalone mode)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static

USER nextjs

# Expose port (actual port controlled by ENV PORT)
EXPOSE $PORT

# Start the application
CMD ["node", "server.js"]
