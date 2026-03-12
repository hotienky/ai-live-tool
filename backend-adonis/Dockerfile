# ──── Backend AdonisJS ────
# Dev mode: hot reload via node --watch
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (cache layer)
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN npm install

# Copy source
COPY . .

# Build TypeScript (AdonisJS v6)
RUN node ace build --ignore-ts-errors 2>/dev/null || true

EXPOSE 3333

# Dev mode: watch for changes
CMD ["node", "--watch", "--watch-preserve-output", "bin/server.js"]
