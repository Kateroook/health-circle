# Build stage
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Copy package files first for better caching
COPY package.json package-lock.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy configuration files
COPY tsconfig*.json nest-cli.json ./

# Copy source files
COPY src ./src
COPY assets ./assets
COPY config.ts ./

# Build the application
RUN npm run build

# Production stage
FROM node:22-alpine AS production

# Create non-root user and group
RUN addgroup -S appgroup && \
    adduser -S -G appgroup appuser && \
    apk add --no-cache su-exec

# Set working directory
WORKDIR /usr/src/app

# Change ownership
RUN chown -R appuser:appgroup /usr/src/app

# Install only production dependencies
COPY --chown=appuser:appgroup package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force


# Copy built application from builder
COPY --chown=appuser:appgroup --from=builder /usr/src/app/dist ./dist
COPY --chown=appuser:appgroup --from=builder /usr/src/app/assets ./assets

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Expose application port
EXPOSE 3001

# Start application
ENTRYPOINT ["/usr/src/app/docker-entrypoint.sh"]
CMD ["node", "--max-old-space-size=4096", "dist/src/main.js"]