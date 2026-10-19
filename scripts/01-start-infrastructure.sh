#!/bin/bash
set -e

echo "=========================================="
echo "Conduit Infrastructure Startup"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

#=====================
# Load .env variables
#=====================
if [ -f .env ]; then
    echo -e "${GREEN}Loading environment variables from .env${NC}"
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${YELLOW}Warning: .env file not found. Using defaults${NC}"
fi

#======================
# Install envinronment
#======================
# 1) Network
echo ""
echo "Step 1: Ensuring shared Docker network exists..."
docker network inspect conduit-network >/dev/null 2>&1 || docker network create conduit-network

# 2) Database server
echo ""
echo "Step 2: Starting PostgreSQL database..."
docker-compose up -d db

echo "Waiting for PostgreSQL to be ready..."
until docker-compose exec -T db pg_isready -U postgres >/dev/null 2>&1; do
    echo -n "."
    sleep 1
done
echo -e "\n${GREEN}PostgreSQL is ready!${NC}"

#echo ""
#echo "Step 2b: Ensuring pytest database exists (idempotent for existing #volumes)..."
#docker-compose exec -T db psql -U postgres -tc "SELECT 1 FROM pg_database #WHERE datname = 'conduit_test_db'" | grep -q 1 \
#  || docker-compose exec -T db psql -U postgres -c "CREATE DATABASE #conduit_test_db;"

# 3) Pact-broker
echo ""
echo "Step 3: Starting Pact Broker..."
docker-compose up -d pact-broker

echo "Waiting for Pact Broker to be ready..."
PACT_READY=0
for i in {1..30}; do
    if curl -fsS "http://127.0.0.1:${PACT_BROKER_PORT:-9292}/" >/dev/null 2>&1; then
        
		echo -e "\n${NC}Create Pact Broker environments...${NC}"

		# --- TEST ENVIRONMENT ---
		if docker run --rm --network conduit-network pactfoundation/pact-cli:latest \
			broker create-environment --name test --display-name "Test Stand" \
			--broker-base-url http://pact-broker:9292 > /dev/null 2>&1; then
			echo -e "  - Test environment: ${GREEN}CREATED${NC}"
		else
			echo -e "  - Test environment: ${YELLOW}ALREADY EXISTS${NC}"
		fi

		# --- STAGING ENVIRONMENT ---
		if docker run --rm --net work conduit-network pactfoundation/pact-cli:latest \
			broker create-environment --name staging --display-name "Staging" \
			--broker-base-url http://pact-broker:9292 > /dev/null 2>&1; then
			echo -e "  - Staging environment: ${GREEN}CREATED${NC}"
		else
			echo -e "  - Staging environment: ${YELLOW}ALREADY EXISTS${NC}"
		fi

		# --- PRODUCTION ENVIRONMENT ---
		if docker run --rm --network conduit-network pactfoundation/pact-cli:latest \
			broker create-environment --name production --display-name "Production" --production \
			--broker-base-url http://pact-broker:9292 > /dev/null 2>&1; then
			echo -e "  - Production environment: ${GREEN}CREATED${NC}"
		else
			echo -e "  - Production environment: ${YELLOW}ALREADY EXISTS${NC}"
		fi

    echo -e "${GREEN}Pact Broker is ready!${NC}"
		
		echo -e "${GREEN}Pact Broker is ready!${NC}"
        PACT_READY=1
        break
    fi
    echo -n "."
    sleep 2
done
if [ "$PACT_READY" != "1" ]; then
    echo -e "\n${RED}ERROR: Pact Broker did not become ready in time.${NC}"
    exit 1
fi

# 4) Gitea
echo ""
echo "Step 4: Starting Gitea..."
docker-compose up -d gitea

echo "Waiting for Gitea to be ready..."
GITEA_READY=0
for i in {1..60}; do
    if curl -fsS "http://127.0.0.1:${GITEA_PORT:-3001}/" >/dev/null 2>&1; then
        echo -e "${GREEN}Gitea is ready!${NC}"
        GITEA_READY=1
        break
    fi
    echo -n "."
    sleep 2
done
if [ "$GITEA_READY" != "1" ]; then
    echo -e "\n${RED}ERROR: Gitea did not become ready in time.${NC}"
    exit 1
fi

# 5) RealWorld APP
echo ""
echo "Step 5: Building and starting application container..."
docker-compose build app
docker-compose up -d app

echo "Waiting for application to be ready..."
APP_READY=0
for i in {1..60}; do
    if curl -fsS "http://127.0.0.1:${APP_PORT:-3000}/health" >/dev/null 2>&1; then
        echo -e "${GREEN}Application is ready!${NC}"
        APP_READY=1
        break
    fi
    echo -n "."
    sleep 2
done
if [ "$APP_READY" != "1" ]; then
    echo -e "\n${RED}ERROR: Application /health did not become ready in time.${NC}"
    exit 1
fi

#===========
# Report
#===========
echo ""
echo "=========================================="
echo -e "${GREEN}Infrastructure startup complete!${NC}"
echo "=========================================="
echo ""
echo "Services are running:"
echo "  - PostgreSQL:   localhost:${POSTGRES_PORT:-5432}"
echo "  - Pact Broker:  http://localhost:${PACT_BROKER_PORT:-9292}"
echo "  - Gitea:        http://localhost:${GITEA_PORT:-3001}"
echo "  - Application:  http://localhost:${APP_PORT:-3000}"
echo ""
echo "Next steps:"
echo "  1. Run: ./scripts/02-setup-gitea.sh"
echo "  2. Run: ./scripts/03-push-code.sh"
echo ""
