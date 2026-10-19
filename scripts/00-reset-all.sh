#!/bin/bash
set -e

echo "=========================================="
echo "Complete System Reset Utility"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo -e "${RED}WARNING: This will delete ALL data including:${NC}"
echo "  - PostgreSQL databases (conduit_db, gitea_db, pactbroker_db)"
echo "  - All Git repositories in Gitea"
echo "  - All Pact contracts"
echo "  - All users and settings"
echo "  - Act runner configuration"
echo ""
echo -e "${YELLOW}This action is IRREVERSIBLE!${NC}"
echo ""
read -p "Are you sure you want to continue? Type 'yes' to proceed: " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "Step 1: Stopping containers and removing compose volumes..."
if docker compose version >/dev/null 2>&1; then
    docker compose down -v --remove-orphans
else
    docker-compose down -v --remove-orphans
fi

echo ""
echo "Step 2: Legacy cleanup (optional volumes from older project names)..."
docker volume rm base_test_platform_postgres_data base_test_platform_gitea_data base_test_platform_act_runner_data 2>/dev/null || true

echo ""
echo "Step 3: Removing shared compose network name (if still present)..."
docker network rm conduit-network 2>/dev/null && echo -e "${GREEN}✓ Removed conduit-network${NC}" || true
docker network rm base_test_platform_conduit-network 2>/dev/null && echo -e "${GREEN}✓ Removed legacy project network${NC}" || true

echo ""
echo "Step 4: Removing any dangling images (optional)..."
read -p "Do you want to remove unused Docker images? (yes/no): " CLEAN_IMAGES
if [ "$CLEAN_IMAGES" = "yes" ]; then
    docker image prune -f
    echo -e "${GREEN}✓ Cleaned up dangling images${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}Complete system reset finished!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. ./scripts/01-start-infrastructure.sh"
echo "  2. ./scripts/02-setup-gitea.sh"
echo "  3. ./scripts/03-push-code.sh"
echo "  4. ./scripts/verify-system.sh"
echo ""
