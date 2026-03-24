# ── Stage 1: Build ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

# Install all deps (postinstall runs prisma generate)
RUN npm ci

COPY . .
RUN npx nest build

# ── Stage 2: Production ────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

# Install production deps only; skip postinstall to avoid
# prisma generate (which needs devDep prisma-class-generator)
RUN npm ci --omit=dev --ignore-scripts

# Copy pre-generated Prisma runtime from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy compiled app + generated prismaClient
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/prisma/prismaClient ./dist/src/prisma/prismaClient

EXPOSE 3000

# Migrate → start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
