#!/bin/bash
set -e

# Always run from repository root (not ./scripts), so we never push a subtree by mistake.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

echo "=========================================="
echo "Push Code to Gitea Repository"
echo "=========================================="
echo "Repository root: $REPO_ROOT"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

#=========================
# Load .env and pipelines
#=========================
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# --- Sync Pipeline Configuration ---
echo "Syncing pipeline configuration from docker/gitea/pipeline.yaml..."

# Проверяем наличие директории перед созданием
if [ ! -d ".gitea/workflows" ]; then
    echo "Creating .gitea/workflows directory..."
    mkdir -p .gitea/workflows
fi

# Копируем файл (cp автоматически перезапишет существующий файл новым)
cp -r docker/gitea/pipeline/. .gitea/workflows/
echo "Pipeline file synced successfully."

GITEA_URL="http://localhost:${GITEA_PORT:-3001}"
GITEA_USER="${GITEA_ADMIN_USER:-devops}"
GITEA_PASSWORD="${GITEA_ADMIN_PASSWORD:-devops123}"
ORG_NAME="conduit"
REPO_NAME="monorepo"

REPO_URL="$GITEA_URL/$ORG_NAME/$REPO_NAME.git"

echo ""
echo "Repository URL: $REPO_URL"
echo ""

# Check if we're already in a git repo
if [ -d .git ]; then
    echo -e "${YELLOW}Git repository already initialized${NC}"
    
    # Check if gitea remote exists
    if git remote | grep -q "gitea"; then
        echo "Gitea remote already configured"
        git remote set-url gitea "http://$GITEA_USER:$GITEA_PASSWORD@localhost:${GITEA_PORT:-3001}/$ORG_NAME/$REPO_NAME.git"
    else
        echo "Adding Gitea remote..."
        git remote add gitea "http://$GITEA_USER:$GITEA_PASSWORD@localhost:${GITEA_PORT:-3001}/$ORG_NAME/$REPO_NAME.git"
    fi
else
    echo "Initializing git repository..."
    git init -b main
    git remote add gitea "http://$GITEA_USER:$GITEA_PASSWORD@localhost:${GITEA_PORT:-3001}/$ORG_NAME/$REPO_NAME.git"
fi

# Create .gitignore if it doesn't exist
if [ ! -f .gitignore ]; then
    echo "Creating .gitignore..."
    cat > .gitignore << 'EOF'
# Environment variables
.env
.gitea-token

# Node modules
node_modules/
frontend/node_modules/
tests/pact/consumer/node_modules/

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
backend/.venv/
backend/venv/
*.egg-info/
dist/
build/

# Pact
tests/pact/consumer/pacts/
tests/pact/consumer/logs/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Docker
*.log

# Test coverage
.coverage
htmlcov/
.pytest_cache/

# Build artifacts
frontend/build/

# Host + runner bind-mount workspace; CI copies to workspace/conduit (never commit)
workspace/*
!workspace/.keep
workspace/conduit/
EOF
fi

# Ensure workspace rules exist even when .gitignore was created earlier without them
ensure_gitignore_workspace_rules() {
    local f=".gitignore"
    touch "$f"
    if ! grep -q '^workspace/conduit/' "$f" 2>/dev/null; then
        printf '\n# CI runner/app bind mount; populated only on the host during pipeline\nworkspace/conduit/\n' >> "$f"
    fi
    if ! grep -qE '^workspace/\*' "$f" 2>/dev/null; then
        printf '\nworkspace/*\n!workspace/.keep\n' >> "$f"
    fi
}
ensure_gitignore_workspace_rules

# Drop anything under workspace/ from the index except .keep (runtime files must never ship to Gitea)
if git rev-parse --git-dir >/dev/null 2>&1; then
    git rm -r --cached --ignore-unmatch workspace/ 2>/dev/null || true
    if [ -f workspace/.keep ]; then
        git add -f workspace/.keep
    fi
fi

# Stage all files (workspace/ remains ignored except .keep)
echo ""
echo "Staging files for commit..."
git add .

# Set local git identity if not configured
echo "Checking git user configuration..."
if [ -z "$(git config user.email)" ]; then
    GIT_EMAIL="${GITEA_ADMIN_EMAIL:-${GITEA_USER}@localhost}"
    echo "Setting local git user to $GITEA_USER ($GIT_EMAIL)..."
    git config user.email "$GIT_EMAIL"
    git config user.name "$GITEA_USER"
fi

# Create initial commit if needed
if ! git log -1 >/dev/null 2>&1; then
    echo "Creating initial commit..."
    git commit -m "Initial commit: Conduit monorepo with CI/CD pipeline

This commit includes:
- FastAPI backend application
- React frontend application
- Pact contract tests (consumer and provider)
- Gitea Actions CI/CD pipeline
- Docker Compose infrastructure setup
- PostgreSQL database configuration
- Nginx reverse proxy
- Comprehensive documentation"
else
    echo -e "${YELLOW}Repository already has commits${NC}"
    if ! git diff --cached --quiet 2>/dev/null; then
        echo "Committing staged changes before push..."
        git commit -m "chore: sync monorepo to Gitea (03-push-code.sh)"
    fi
fi

# Push to Gitea (НЕ ЗАБУДЬ РАСКОММЕНТИТЬ - ЭТО БАЗОВАЯ СЕКЦИЯ!!!!!!1)
echo ""
echo "Pushing to Gitea..."
git branch -M main
git fetch gitea main 2>/dev/null || true
if git rev-parse gitea/main >/dev/null 2>&1; then
    if ! git merge-base --is-ancestor gitea/main HEAD 2>/dev/null; then
        echo -e "${YELLOW}Integrating gitea/main into local main before push...${NC}"
        git merge gitea/main -m "chore: merge gitea/main (03-push-code.sh)" 2>/dev/null \
            || git merge gitea/main --allow-unrelated-histories -m "chore: merge gitea/main (03-push-code.sh)"
    fi
fi
git push -u gitea main



# Setup Pact Broker Webhook
echo ""
echo "Configuring Pact Broker Webhook..."
# Настройки
GITEA_INTERNAL_URL="http://gitea:3000"
BROKER_URL="http://localhost:9292"
ORG_NAME="conduit"
REPO_NAME="monorepo"

# 1. Проверка токена
if [ -f .gitea-token ]; then
    GITEA_TOKEN=$(cat .gitea-token)
fi

if [ -z "$GITEA_TOKEN" ]; then
    echo -e "${RED}Error: GITEA_TOKEN is not set and .gitea-token file is missing!${NC}"
    exit 1
fi

################# Регистрация проектов

echo "📢 Начинаем проверку проектов в Брокере..."

# --- 1. Проверяем БЭКЕНД ---
echo "🔍 Проверяем conduit-backend..."
# Спрашиваем статус у Брокера
STATUS_BACK=$(docker exec conduit-act-runner curl -s -o /dev/null -w "%{http_code}" http://pact-broker:9292/pacticipants/conduit-backend)

if [ "$STATUS_BACK" -eq "404" ]; then
    echo "➕ conduit-backend не найден. Создаю..."
    docker exec conduit-act-runner curl -s -X POST \
      -H "Content-Type: application/json" \
      -d '{"name": "conduit-backend"}' \
      http://pact-broker:9292/pacticipants > /dev/null
else
    echo "👌 conduit-backend уже есть, пропускаем."
fi

# --- 2. Проверяем ФРОНТЕНД ---
echo "🔍 Проверяем conduit-frontend..."
# Спрашиваем статус у Брокера
STATUS_FRONT=$(docker exec conduit-act-runner curl -s -o /dev/null -w "%{http_code}" http://pact-broker:9292/pacticipants/conduit-frontend)

if [ "$STATUS_FRONT" -eq "404" ]; then
    echo "➕ conduit-frontend не найден. Создаю..."
    docker exec conduit-act-runner curl -s -X POST \
      -H "Content-Type: application/json" \
      -d '{"name": "conduit-frontend"}' \
      http://pact-broker:9292/pacticipants > /dev/null
else
    echo "👌 conduit-frontend уже есть, пропускаем."
fi

################# Создание окружения Stage 

# --- СОЗДАНИЕ ОКРУЖЕНИЯ (Environment) с проверкой ---
echo "🌍 Проверяем/Создаем окружение 'staging'..."

# Получаем список всех окружений и ищем в нем "staging"
# grep -q вернет 0 (успех), если найдет строку, и 1, если нет.
STAGING_EXISTS=$(docker exec conduit-act-runner curl -s http://pact-broker:9292/environments | grep -q '"name":"staging"'; echo $?)

if [ "$STAGING_EXISTS" -ne "0" ]; then
  echo "➕ Окружение 'staging' не найдено в списке. Создаю..."
  docker exec conduit-act-runner pact-broker create-environment \
    --name staging \
    --display-name "Staging" \
    --broker-base-url http://pact-broker:9292
  echo "✅ Окружение 'staging' успешно создано."
else
  echo "👌 Окружение 'staging' уже есть в списке, пропускаем."
fi



###############  Создание вебхука

# 2. Проверка наличия вебхука
echo "Checking for existing webhooks between frontend and backend..."
HOOK_JSON=$(curl -s "$BROKER_URL/webhooks/provider/conduit-backend/consumer/conduit-frontend")
HOOK_URL=$(curl -s "$BROKER_URL/webhooks/provider/conduit-backend/consumer/conduit-frontend" | \
    grep -o '"href":"http://[^"]*"' | \
    grep -v "provider" | \
    grep "webhooks/" | \
    head -n 1 | \
    sed 's/"href":"//g' | sed 's/"//g')

if [[ "$HOOK_JSON" != *'"pb:webhooks":[]'* ]]; then
    echo -e "${YELLOW}Webhook already exists: $HOOK_URL${NC}"

	###########################################################
	# Удаление всех вебхуков между conduit backend и frontend
	if [ ! -z "$HOOK_URL" ]; then
		echo "Удаляю: $HOOK_URL"
		curl -v -X DELETE "$HOOK_URL"
	fi

    # ПРОВЕРКА: Получаем список хуков после удаления
    echo "Verifying cleanup..."
    REMAINING=$(curl -s "$BROKER_URL/webhooks/provider/conduit-backend/consumer/conduit-frontend")

    # Выводим то, что реально вернул Брокер (пусть даже это пустой массив)
    echo "Broker response: $REMAINING"

    # Теперь проверяем
    if [[ $REMAINING == *'"pb:webhooks":[]'* ]] || [[ $REMAINING == *'"pb:webhooks": []'* ]]; then
        echo -e "${GREEN}Cleanup successful: List is empty.${NC}"
        HOOK_URL="" # Важно: обнуляем, чтобы скрипт дальше пошел создавать новый
    else
        echo -e "${RED}Warning: Webhooks still exist!${NC}"
    fi
    
	############################################################

else
    echo -e "${YELLOW}Webhook not found. Creating new one...${NC}"
	
	# 3. Создание вебхука и СРАЗУ сохраняем результат в переменную
    POST_RESPONSE=$(curl -s -X POST "$BROKER_URL/webhooks" \
      -H "Content-Type: application/json" \
      -d @- <<EOF
    {
      "description": "Trigger Pact Provider Verification for Conduit",
      "enabled": true,
      "consumer": { "name": "conduit-frontend" },
      "provider": { "name": "conduit-backend" },
      "request": {
        "method": "POST",
        "url": "$GITEA_INTERNAL_URL/api/v1/repos/$ORG_NAME/$REPO_NAME/actions/workflows/modules%2F_pact-provider-verifier.yaml/dispatches",
        "headers": { "Authorization": "token $GITEA_TOKEN", "Content-Type": "application/json" },
        "body": { "ref": "main" }
      },
      "events": [ { "name": "contract_published" } ]
    }
EOF
)

    echo -e "\n${GREEN}Pact Broker configuration finished!${NC}"

    # --- ТЕСТ-ДРАЙВ ---
    # Вытаскиваем URL для execute прямо из ответа POST
    TEST_EXECUTE_URL=$(echo "$POST_RESPONSE" | grep -o '"pb:execute":{"title":"[^"]*","href":"[^"]*"' | sed 's/.*"href":"//g' | sed 's/"//g')

    echo "Running smoke test on webhook..."
    if [ ! -z "$TEST_EXECUTE_URL" ]; then
        echo "Triggering test execution for: $TEST_EXECUTE_URL"
        curl -v -X POST "$TEST_EXECUTE_URL"
        echo -e "${GREEN}Test trigger sent! Check Gitea actions for activity.${NC}"
    else
        echo -e "${RED}Test failed: Execute URL not found in response!${NC}"
    fi
#######	
	echo "🔍 Detecting commit hashes for initial seeding..."

	# Достаем реальные хэши из репозиториев
	CURRENT_SHA=$(git rev-parse HEAD)

	if [ -z "$CURRENT_SHA" ]; then
		echo "❌ ERROR: Could not detect git SHA. Are you in a git repository?"
		exit 1
	fi

	# Настройки имен
	RUNNER_NAME="conduit-act-runner"
	BROKER_URL="http://pact-broker:9292"

	echo "📡 Registering versions and recording deployment..."

	# --- BACKEND ---
	echo "----------------------------------------------------------"
	echo "📦 Processing BACKEND..."
	# Регистрация версии
	docker exec $RUNNER_NAME curl -s -X PUT -H "Content-Type: application/json" \
	  "$BROKER_URL/pacticipants/conduit-backend/versions/$CURRENT_SHA" > /dev/null

	# Запись деплоя
	docker exec $RUNNER_NAME pact-broker record-deployment \
	  --pacticipant conduit-backend \
	  --version "$CURRENT_SHA" \
	  --environment staging \
	  --broker-base-url "$BROKER_URL"

	# --- FRONTEND ---
	echo "----------------------------------------------------------"
	echo "📦 Processing FRONTEND..."
	# Регистрация версии
	docker exec $RUNNER_NAME curl -s -X PUT -H "Content-Type: application/json" \
	  "$BROKER_URL/pacticipants/conduit-frontend/versions/$CURRENT_SHA" > /dev/null

	# Запись деплоя
	docker exec $RUNNER_NAME pact-broker record-deployment \
	  --pacticipant conduit-frontend \
	  --version "$CURRENT_SHA" \
	  --environment staging \
	  --broker-base-url "$BROKER_URL"

	echo "=========================================================="
	echo "✅ EXPLICIT SEEDING FINISHED"

########	
fi

echo ""
echo "=========================================="
echo -e "${GREEN}Code successfully pushed to Gitea!${NC}"
echo "=========================================="
echo ""
echo "View repository: $GITEA_URL/$ORG_NAME/$REPO_NAME"
echo "View pipeline: $GITEA_URL/$ORG_NAME/$REPO_NAME/actions"
echo ""
echo "The CI/CD pipeline should now be triggered automatically!"
echo ""
echo -e "${GREEN}All systems synced and pushed! Ready for testing.${NC}"
echo ""