#!/bin/bash
set -e

echo "=========================================="
echo "Gitea Configuration via API"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

#===========
# Load .env 
#===========
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

GITEA_URL="http://localhost:${GITEA_PORT:-3001}"
GITEA_USER="${GITEA_ADMIN_USER:-devops}"
GITEA_PASSWORD="${GITEA_ADMIN_PASSWORD:-devops123}"
GITEA_EMAIL="${GITEA_ADMIN_EMAIL:-devops@example.com}"
REPO_NAME="monorepo"
ORG_NAME="conduit"
GITEA_CONTAINER="${GITEA_CONTAINER:-conduit-gitea}"


echo ""
echo "Gitea URL: $GITEA_URL"
echo "Admin User: $GITEA_USER"
echo ""

#=================
# Configure Gitea 
#=================

# Wait for Gitea to be fully ready
echo "Waiting for Gitea to be fully initialized..."
sleep 10

# Step 1: Check if Gitea needs initial setup
echo "Step 1: Checking Gitea installation status..."
INSTALL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$GITEA_URL/api/v1/version")

if [ "$INSTALL_STATUS" != "200" ]; then
    echo -e "${YELLOW}Gitea needs initial setup. Performing first-time configuration...${NC}"
    
    # Perform initial setup via web interface automation or API
    # For simplicity, we'll assume Gitea is configured via environment variables in docker-compose
    echo "Please complete initial Gitea setup in browser if needed: $GITEA_URL"
    echo "Then re-run this script."
    exit 1
fi

echo -e "${GREEN}Gitea is configured!${NC}"

# Step 2: Verify Gitea is running with correct permissions
echo ""
echo "Step 2: Verifying Gitea user permissions..."

# Check the actual Gitea process user (not the exec user)
GITEA_PROCESS_USER=$(docker exec "$GITEA_CONTAINER" ps aux | grep "gitea web" | grep -v grep | awk '{print $1}' 2>/dev/null || echo "unknown")
GIT_USER_UID=$(docker exec -u git conduit-gitea id -u 2>/dev/null || echo "0")

echo "Gitea process running as: $GITEA_PROCESS_USER (git user UID: $GIT_USER_UID)"

if [ "$GIT_USER_UID" = "0" ] || [ "$GITEA_PROCESS_USER" = "root" ]; then
    echo -e "${RED}ERROR: Gitea is running as root!${NC}"
    echo ""
    echo "This usually means the container was created before user settings took effect."
    echo "Please run the following to fix:"
    echo "  ./scripts/00-reset-all.sh"
    echo ""
    exit 1
fi

if [ "$GIT_USER_UID" != "1000" ]; then
    echo -e "${YELLOW}WARNING: git user UID is $GIT_USER_UID (expected 1000)${NC}"
    echo "Continuing anyway..."
fi

echo -e "${GREEN}✓ Gitea is running with proper permissions (git user UID: $GIT_USER_UID)${NC}"

# Step 3: Ensure admin user exists (create via CLI if missing)
echo ""
echo "Step 3: Verifying admin user exists..."

# Check if user exists via API (anonymous GET /api/v1/users/:name returns 404 if absent)
USER_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "$GITEA_URL/api/v1/users/$GITEA_USER")

if [ "$USER_CHECK" = "200" ]; then
    echo -e "${GREEN}✓ Admin user '$GITEA_USER' exists${NC}"
elif [ "$USER_CHECK" = "404" ]; then
    echo -e "${YELLOW}Admin user '$GITEA_USER' not found — creating via gitea CLI in container '$GITEA_CONTAINER'...${NC}"
    if ! docker ps --format '{{.Names}}' | grep -qx "$GITEA_CONTAINER"; then
        echo -e "${RED}ERROR: Container '$GITEA_CONTAINER' is not running.${NC}"
        echo "Start Gitea first (e.g. docker compose up -d gitea)."
        exit 1
    fi
    if docker exec -u git "$GITEA_CONTAINER" gitea admin user create \
        --username "$GITEA_USER" \
        --password "$GITEA_PASSWORD" \
        --email "$GITEA_EMAIL" \
        --admin \
        --must-change-password=false; then
        echo -e "${GREEN}✓ Admin user '$GITEA_USER' created${NC}"
    else
        echo -e "${RED}ERROR: Failed to create admin user via gitea CLI.${NC}"
        exit 1
    fi
    USER_VERIFY=$(curl -s -o /dev/null -w "%{http_code}" "$GITEA_URL/api/v1/users/$GITEA_USER")
    if [ "$USER_VERIFY" != "200" ]; then
        echo -e "${RED}ERROR: User still not visible via API (HTTP $USER_VERIFY).${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}WARNING: Could not verify user (HTTP $USER_CHECK). Continuing anyway...${NC}"
fi

# Step 4: Get or create access token
echo ""
echo "Step 4: Getting access token..."

# First, try to verify if existing token works
if [ -f .gitea-token ]; then
    EXISTING_TOKEN=$(cat .gitea-token)
    TOKEN_TEST=$(curl -s -o /dev/null -w "%{http_code}" "$GITEA_URL/api/v1/user" \
        -H "Authorization: token $EXISTING_TOKEN")
    
    if [ "$TOKEN_TEST" = "200" ]; then
        ACCESS_TOKEN=$EXISTING_TOKEN
        echo -e "${GREEN}✓ Using existing valid token${NC}"
    else
        echo "Existing token is invalid (HTTP $TOKEN_TEST), generating new one..."
        rm -f .gitea-token
    fi
fi

# If no valid token, create a new one
if [ -z "$ACCESS_TOKEN" ]; then
    echo "Creating new access token via API..."
    TOKEN_RESPONSE=$(curl -s -X POST "$GITEA_URL/api/v1/users/$GITEA_USER/tokens" \
        -u "$GITEA_USER:$GITEA_PASSWORD" \
        -H "Content-Type: application/json" \
        -d "{\"name\": \"automation-token-$(date +%s)\", \"scopes\": [\"write:organization\", \"write:repository\", \"write:user\"]}")

    ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | grep -oE '"sha1":"[^"]*' | cut -d'"' -f4)
    if [ -z "$ACCESS_TOKEN" ]; then
        ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | grep -oE '"token":"[^"]*' | cut -d'"' -f4)
    fi

    if [ -z "$ACCESS_TOKEN" ]; then
        echo -e "${RED}Failed to create access token.${NC}"
        echo "Response: $TOKEN_RESPONSE"
        echo ""
        echo "Please verify:"
        echo "  1. Username: $GITEA_USER"
        echo "  2. Password: $GITEA_PASSWORD"
        echo "  3. You can login at $GITEA_URL"
        exit 1
    fi
    
    echo -e "${GREEN}✓ New access token created${NC}"
    echo "$ACCESS_TOKEN" > .gitea-token
fi


# Step 5: Create organization (idempotent)
echo ""
echo "Step 5: Ensuring organization: $ORG_NAME..."

ORG_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$GITEA_URL/api/v1/orgs/$ORG_NAME" \
    -H "Authorization: token $ACCESS_TOKEN")
if [ "$ORG_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Organization '$ORG_NAME' already exists${NC}"
else
    ORG_RESPONSE=$(curl -s -X POST "$GITEA_URL/api/v1/orgs" \
        -H "Authorization: token $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"username\": \"$ORG_NAME\", \"full_name\": \"Conduit Organization\"}")
    echo "Organization response: $ORG_RESPONSE"
fi

# Step 6: Create repository (idempotent)
echo ""
echo "Step 6: Ensuring repository: $ORG_NAME/$REPO_NAME..."

REPO_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$GITEA_URL/api/v1/repos/$ORG_NAME/$REPO_NAME" \
    -H "Authorization: token $ACCESS_TOKEN")
if [ "$REPO_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Repository '$ORG_NAME/$REPO_NAME' already exists${NC}"
else
    REPO_RESPONSE=$(curl -s -X POST "$GITEA_URL/api/v1/org/$ORG_NAME/repos" \
        -H "Authorization: token $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"$REPO_NAME\",
            \"description\": \"Conduit application monorepo with CI/CD\",
            \"private\": false,
            \"auto_init\": false
        }")
    echo "Repository response: $REPO_RESPONSE"
fi

#============================
# Configure Gitea act-runner 
#============================

# Step 7: Enable Actions for repository
echo ""
echo "Step 7: Configuring Gitea Actions..."

# Actions are enabled via environment variables in docker-compose
echo -e "${GREEN}Gitea Actions enabled via configuration${NC}"

# Step 7: Get runner registration token
echo "Getting token..."
RUNNER_TOKEN_RESPONSE=$(curl -s -X POST "$GITEA_URL/api/v1/repos/$ORG_NAME/$REPO_NAME/actions/runners/registration-token" \
    -H "Authorization: token $ACCESS_TOKEN")

RUNNER_TOKEN=$(echo $RUNNER_TOKEN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$RUNNER_TOKEN" ] || [ "$RUNNER_TOKEN" == "null" ]; then
    echo -e "${RED}ERROR: Runner registration token is empty.${NC}"
    echo "API response (check repository Actions / permissions): $RUNNER_TOKEN_RESPONSE"
    exit 1
fi

# Persist runner token into .env (best-effort; portable sed -i)
if [ -n "$RUNNER_TOKEN" ] && [ -f .env ]; then
    if grep -q '^GITEA_RUNNER_TOKEN=' .env; then
        if sed --version >/dev/null 2>&1; then
            sed -i "s/^GITEA_RUNNER_TOKEN=.*/GITEA_RUNNER_TOKEN=$RUNNER_TOKEN/" .env
        else
            sed -i '' "s/^GITEA_RUNNER_TOKEN=.*/GITEA_RUNNER_TOKEN=$RUNNER_TOKEN/" .env
        fi
    else
        echo "GITEA_RUNNER_TOKEN=$RUNNER_TOKEN" >> .env
    fi
fi

echo "Building and restarting act-runner (custom image with Node.js)..."
export GITEA_RUNNER_TOKEN="$RUNNER_TOKEN"
docker-compose build act-runner
docker-compose up -d --force-recreate act-runner

#=================
# Success Report 
#=================

echo ""
echo "=========================================="
echo -e "${GREEN}Gitea setup complete!${NC}"
echo "=========================================="
echo ""
echo "Repository:"
echo "  URL: $GITEA_URL/$ORG_NAME/$REPO_NAME"
echo "  Clone: git clone http://localhost:${GITEA_PORT:-3001}/$ORG_NAME/$REPO_NAME.git"
echo ""
echo "API token saved to .gitea-token (not printed)."
echo ""
echo "Next step: Run ./scripts/03-push-code.sh"
echo ""
