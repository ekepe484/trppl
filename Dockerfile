# ── Stage 1: Dependencies ─────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json* ./

# Install production dependencies only
RUN npm ci --omit=dev

# ── Stage 2: Production image ─────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Install ffmpeg for video frame extraction (used by face verification)
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S trppl && \
    adduser  -u 1001 -S trppl -G trppl

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY backend/  ./backend/
COPY frontend/ ./frontend/
COPY package.json ./

# Create uploads directory and set permissions
RUN mkdir -p /app/uploads/photos /app/uploads/verification && \
    chown -R trppl:trppl /app

# Switch to non-root user
USER trppl

# Expose the port
EXPOSE 3000

# Health check — uses the /api/health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

# Set upload dir to the persistent volume mount point
ENV UPLOAD_DIR=/app/uploads
ENV NODE_ENV=production

CMD ["node", "backend/server.js"]
