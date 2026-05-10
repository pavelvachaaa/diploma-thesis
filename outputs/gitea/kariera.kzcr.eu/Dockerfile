# ---- deps ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --force

# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app

ARG NEXT_PUBLIC_BASE_API_URL_PROD
ARG NEXT_PUBLIC_BASE_PATH
ARG NEXT_PUBLIC_UMAMI_ENABLED
ARG NEXT_PUBLIC_UMAMI_WEBSITE_ID
ARG NEXT_PUBLIC_UMAMI_DOMAINS
ARG UMAMI_PROXY_TARGET

ENV NEXT_PUBLIC_BASE_API_URL_PROD=$NEXT_PUBLIC_BASE_API_URL_PROD
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH
ENV NEXT_PUBLIC_UMAMI_ENABLED=$NEXT_PUBLIC_UMAMI_ENABLED
ENV NEXT_PUBLIC_UMAMI_WEBSITE_ID=$NEXT_PUBLIC_UMAMI_WEBSITE_ID
ENV NEXT_PUBLIC_UMAMI_DOMAINS=$NEXT_PUBLIC_UMAMI_DOMAINS
ENV UMAMI_PROXY_TARGET=$UMAMI_PROXY_TARGET
ENV NEXT_OUTPUT=standalone

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- runtime ----
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
