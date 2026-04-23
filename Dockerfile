# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=20.18.1
ARG NGINX_VERSION=1.27-alpine
ARG ALPINE_VERSION=3.20

FROM node:${NODE_VERSION}-alpine AS web-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM web-deps AS web-build
WORKDIR /app
COPY . .
ARG VITE_POCKETBASE_URL=
ENV VITE_POCKETBASE_URL=${VITE_POCKETBASE_URL}
RUN npm run build

FROM nginx:${NGINX_VERSION} AS web
ARG WEB_PROXY_POCKETBASE=1
COPY --from=web-build /app/dist /usr/share/nginx/html
RUN <<EOF
set -eu
rm -f /etc/nginx/conf.d/default.conf
cat > /etc/nginx/conf.d/default.conf <<'NGINX_HEAD'
map $http_x_forwarded_proto $forwarded_proto {
  default $http_x_forwarded_proto;
  '' $scheme;
}

server {
  listen 80 default_server;
  server_name _;
  server_tokens off;
  root /usr/share/nginx/html;
  index index.html;

  add_header X-Frame-Options "DENY" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
  add_header Cross-Origin-Opener-Policy "same-origin" always;
  add_header Cross-Origin-Resource-Policy "same-origin" always;

  location = /healthz {
    access_log off;
    return 200 "ok\n";
  }
NGINX_HEAD

if [ "$WEB_PROXY_POCKETBASE" = "0" ]; then
cat >> /etc/nginx/conf.d/default.conf <<'NGINX_BODY'
  location ^~ /api/ {
    return 404;
  }

  location ^~ /_/ {
    return 404;
  }
NGINX_BODY
else
cat >> /etc/nginx/conf.d/default.conf <<'NGINX_BODY'
  location /api/ {
    proxy_pass http://pocketbase:8090;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $forwarded_proto;
  }

  location /_/ {
    proxy_pass http://pocketbase:8090;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $forwarded_proto;
  }
NGINX_BODY
fi

cat >> /etc/nginx/conf.d/default.conf <<'NGINX_TAIL'

  location / {
    try_files $uri $uri/ /index.html;
  }

  location ~ /\. {
    deny all;
  }
}
NGINX_TAIL
EOF
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1/healthz >/dev/null 2>&1 || exit 1
CMD ["nginx", "-g", "daemon off;"]

FROM node:${NODE_VERSION}-alpine AS pocketbase-downloader
WORKDIR /repo
RUN apk add --no-cache ca-certificates unzip
COPY scripts/pocketbase-bootstrap.mjs ./scripts/pocketbase-bootstrap.mjs
ARG PB_VERSION=latest
ENV PB_VERSION=${PB_VERSION}
RUN node --input-type=module <<'EOF'
import { ensurePocketBaseBinary } from './scripts/pocketbase-bootstrap.mjs';
await ensurePocketBaseBinary({
  repoRoot: '/repo',
  pbBin: '/usr/local/bin/pocketbase',
  version: process.env.PB_VERSION,
});
EOF

FROM alpine:${ALPINE_VERSION} AS pocketbase
RUN apk add --no-cache ca-certificates su-exec
RUN addgroup -S pocketbase && adduser -S -G pocketbase pocketbase
WORKDIR /pb
COPY --from=pocketbase-downloader /usr/local/bin/pocketbase /usr/local/bin/pocketbase
COPY pb_migrations /pb_migrations
RUN mkdir -p /pb/data \
  && chown -R pocketbase:pocketbase /pb /pb_migrations
RUN cat > /usr/local/bin/pocketbase-entrypoint.sh <<'EOF'
#!/bin/sh
set -eu

: "${PB_ADMIN_EMAIL:?PB_ADMIN_EMAIL is required}"
: "${PB_ADMIN_PASSWORD:?PB_ADMIN_PASSWORD is required}"

POCKETBASE_BIND="${POCKETBASE_BIND:-0.0.0.0:8090}"
POCKETBASE_DATA_DIR="${POCKETBASE_DATA_DIR:-/pb/data}"

if [ "$(id -u)" = "0" ]; then
  mkdir -p "$POCKETBASE_DATA_DIR"
  chown -R pocketbase:pocketbase "$POCKETBASE_DATA_DIR"
  exec su-exec pocketbase /usr/local/bin/pocketbase-entrypoint.sh "$@"
fi

mkdir -p "$POCKETBASE_DATA_DIR"

/usr/local/bin/pocketbase superuser upsert "$PB_ADMIN_EMAIL" "$PB_ADMIN_PASSWORD" --dir "$POCKETBASE_DATA_DIR"
/usr/local/bin/pocketbase migrate up --dir "$POCKETBASE_DATA_DIR" --migrationsDir /pb_migrations
exec /usr/local/bin/pocketbase serve --http="$POCKETBASE_BIND" --dir "$POCKETBASE_DATA_DIR"
EOF
RUN chmod +x /usr/local/bin/pocketbase-entrypoint.sh
EXPOSE 8090
VOLUME ["/pb/data"]
HEALTHCHECK --interval=30s --timeout=5s --retries=5 CMD wget -qO- http://127.0.0.1:8090/api/health >/dev/null 2>&1 || exit 1
ENTRYPOINT ["/usr/local/bin/pocketbase-entrypoint.sh"]
