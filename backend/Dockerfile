# ──────────────────────────────────────────────────────────────────────────────
# Stage 1 — Builder
# Installs all dependencies (including devDependencies for tsc) and compiles
# TypeScript to dist/
# ──────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests first for layer-cache efficiency
COPY package.json package-lock.json ./

# Install all deps (including devDeps — we need typescript/ts-node to compile)
RUN npm ci --registry https://registry.npmjs.org

# Copy the rest of the source
COPY tsconfig.json ./
COPY src ./src

# Compile TypeScript → dist/
RUN npx tsc

# ──────────────────────────────────────────────────────────────────────────────
# Stage 2 — Production image
# Copies only the compiled output and production dependencies; runs as a
# non-root user on port 5001
# ──────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Copy package manifests
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev --registry https://registry.npmjs.org

# Copy compiled output from the builder stage
COPY --from=builder /app/dist ./dist

# Create an uploads directory (used for local file storage fallback)
RUN mkdir -p uploads

# Create a non-root user and transfer ownership
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app

USER appuser

# Expose the backend port
EXPOSE 5001

# Start the compiled server
CMD ["node", "dist/index.js"]
