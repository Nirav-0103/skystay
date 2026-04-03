# ── Stage 1: Builder ──────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ── Stage 2: Production ───────────────────────────────────────
FROM node:20-alpine AS production
RUN addgroup -g 1001 -S nodejs && adduser -S skystay -u 1001
WORKDIR /app

# Copy node_modules from builder (no dev deps)
COPY --from=builder /app/node_modules ./node_modules
COPY --chown=skystay:nodejs . .

# Remove .env from image — use Kubernetes Secrets instead
RUN rm -f .env

USER skystay
EXPOSE 5000

# Health check (matches /api/health endpoint in server.js)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]
