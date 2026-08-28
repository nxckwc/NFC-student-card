# syntax=docker/dockerfile:1
FROM node:20-slim AS base

# Install openssl and curl (useful for Prisma and container health checks)
RUN apt-get update -y && apt-get install -y openssl curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency definitions and prisma schema
COPY package*.json tsconfig.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies needed for build and prisma CLI)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY src ./src/
COPY index.ts ./

# Compile TypeScript
RUN npm run build

# Default environment variables
ENV NODE_ENV=production
ENV PORT=3100

EXPOSE 3100

# Run pending migrations and start the Node application
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
