# ----------- Builder Stage ------------
FROM node:22.15.0-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy app source code
COPY . .

# ----------- Production Stage ------------
FROM node:22.15.0-alpine

# Set working directory
WORKDIR /app

# Copy built app from builder
COPY --from=builder /app /app

# Set environment variables
ENV NODE_ENV=production

# Expose the port your app listens on
EXPOSE 3000

# Default command - can be overridden in docker-compose
CMD ["sh", "-c", "NODE_TLS_REJECT_UNAUTHORIZED=0 node src/index.js"]
