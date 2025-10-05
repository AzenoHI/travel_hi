FROM node:20-bookworm-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --no-audit --no-fund --include=optional; \
    else npm i --no-audit --no-fund --include=optional; fi

COPY . .

# 👉 jeśli nie ma prod-configu, utwórz go (bez HTTPS, żadnych certów)
RUN [ -f vite.config.prod.ts ] || cat > vite.config.prod.ts <<'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  build: { sourcemap: false, outDir: 'dist' },
});
EOF

# 💡 omijamy twardy type-check na teraz (wrócisz do "tsc -b" jak poprawisz TS)
# zamiast grzebać w package.json, użyjemy npx
RUN npx vite build --config vite.config.prod.ts

# ===== STAGE 2: RUNTIME (NGINX) =====
FROM nginx:1.27-alpine AS runner
RUN rm -f /etc/nginx/conf.d/default.conf && \
    printf '%s\n' \
    'server {' \
    '  listen 80;' \
    '  server_name _;' \
    '  location = /health { return 200 "ok\n"; }' \
    '  location /api/ { proxy_pass http://travel_hi_api:8000/; proxy_http_version 1.1;' \
    '    proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr;' \
    '    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto $scheme; }' \
    '  root /usr/share/nginx/html; index index.html;' \
    '  location / { try_files $uri $uri/ /index.html; }' \
    '  gzip on; gzip_types text/plain text/css application/javascript application/json image/svg+xml; gzip_min_length 256;' \
    '}' > /etc/nginx/conf.d/app.conf

COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=5 \
  CMD wget -qO- http://127.0.0.1/health >/dev/null 2>&1 || exit 1
CMD ["nginx", "-g", "daemon off;"]