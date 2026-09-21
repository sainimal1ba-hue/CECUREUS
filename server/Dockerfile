# ============================================================
# CECUREUS API SERVER — PRODUCTION DOCKERFILE
# ============================================================
# Multi-stage production container for Railway, Render, Fly.io, or VPS
# ============================================================

FROM node:20-slim AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Install required system packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy application source
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose API port
EXPOSE 3000

# Healthcheck probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Auto-run database migrations before booting the Express server
CMD ["sh", "-c", "npm run migrate && npm start"]
