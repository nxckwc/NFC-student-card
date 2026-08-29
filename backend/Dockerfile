# syntax=docker/dockerfile:1

# stg1 - build & compile
FROM node:20-slim AS builder

# Install openssl needed for Prisma engine
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency configs
COPY package*.json tsconfig.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for tsc)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code and compile TypeScript to dist/
COPY src ./src/
COPY index.ts ./
RUN npm run build

# stg2 - production runner
FROM node:20-slim AS runner

# Install openssl for Prisma runtime
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3100

# Copy package config and prisma schema for migrations
COPY package*.json ./
COPY prisma ./prisma/

# Copy compiled JavaScript from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3100

# Run pending migrations on startup and start production server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
