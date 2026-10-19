#!/bin/bash
set -e

echo "=========================================="
echo "Conduit Application Startup"
echo "=========================================="

# Wait for database to be ready
echo "Waiting for PostgreSQL..."
timeout=60
while ! pg_isready -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER > /dev/null 2>&1; do
    timeout=$((timeout - 1))
    if [ $timeout -eq 0 ]; then
        echo "ERROR: PostgreSQL not ready after 60 seconds"
        exit 1
    fi
    sleep 1
done
echo "✓ PostgreSQL is ready!"

# Run database migrations
echo "Running database migrations..."
cd /app
if ! alembic upgrade head; then
    echo "ERROR: Database migrations failed"
    exit 1
fi
echo "✓ Database migrations completed successfully"

echo "Starting services with supervisor..."
# Start supervisor (runs nginx + uvicorn)
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
