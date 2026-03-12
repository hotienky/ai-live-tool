# ──── Storefront (Vite + Vue) ────
# Dev mode: Vite HMR
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN npm install

# Copy source
COPY . .

EXPOSE 5173

# Vite dev server — listen on all interfaces for Docker
CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "5173"]
