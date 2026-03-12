# ──── Backend AdonisJS v6 ────
# Dev mode with TypeScript
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (cache layer)
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN npm install

# Copy source
COPY . .

EXPOSE 3333

# Use tsx to run TypeScript directly (AdonisJS v6)
CMD ["npx", "tsx", "bin/server.ts"]
