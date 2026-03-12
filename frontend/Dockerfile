# ──── Frontend CMS (Tenant Admin) ────
# Dev mode: hot reload via Vite
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN npm install

COPY . .

EXPOSE 5175

CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "5175"]
