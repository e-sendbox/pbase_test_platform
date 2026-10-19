# Multi-stage Dockerfile for Conduit Application
# Combines React Frontend + FastAPI Backend in single container with Nginx

# ============================================================================
# Stage 1: Build React Frontend
# ============================================================================
FROM node:14-alpine AS frontend-builder

WORKDIR /frontend

# Copy package files only (for better caching)
COPY frontend/package.json ./

# Install dependencies (cached unless package.json changes)
RUN npm install --legacy-peer-deps

# Copy frontend source (only invalidates cache if code changes)
COPY frontend/src ./src
COPY frontend/public ./public

# Build production bundle
RUN npm run build

# ============================================================================
# Stage 2: Prepare Python Backend
# ============================================================================
FROM python:3.9-slim AS backend-builder

WORKDIR /backend

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy backend dependencies
COPY backend/pyproject.toml backend/poetry.lock* ./

# Install poetry (older version that supports --no-dev flag) and dependencies
RUN pip install --no-cache-dir "poetry>=1.1,<2.0" && \
    poetry config virtualenvs.create false && \
    poetry install --no-dev --no-interaction --no-ansi

# Copy backend application
COPY backend/app ./app
COPY backend/alembic.ini ./

# Create alembic directory structure (migrations are in app/db/migrations/)
# Create symlink for alembic to find migrations
RUN mkdir -p ./alembic && \
    ln -s /backend/app/db/migrations ./alembic/migrations

# ============================================================================
# Stage 3: Final Image with Nginx + uvicorn
# ============================================================================
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies (nginx, postgresql client, curl for healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    libpq5 \
    postgresql-client \
    curl \
    supervisor \
	nodejs \
	npm \
    && rm -rf /var/lib/apt/lists/*

# Copy Python dependencies and backend from builder
COPY --from=backend-builder /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages
COPY --from=backend-builder /usr/local/bin /usr/local/bin
COPY --from=backend-builder /backend /app

# Copy frontend build to nginx html directory
COPY --from=frontend-builder /frontend/build /usr/share/nginx/html

# Copy Nginx configuration
COPY docker/app/nginx.conf /etc/nginx/nginx.conf

# Create directories for nginx pid and supervisor logs
RUN mkdir -p /var/run/nginx /var/log/supervisor

# Copy supervisor configuration
COPY docker/app/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create startup script
COPY docker/app/startup.sh /startup.sh
RUN chmod +x /startup.sh

# Expose port 80 (nginx)
EXPOSE 80

# Run startup script
CMD ["/startup.sh"]
