#!/bin/sh
# Riffado local installer / production build deployer.
# Used to build and deploy your custom local version in a production Docker container.
#
# Usage:
#   chmod +x scripts/install-local.sh
#   ./scripts/install-local.sh
#

set -eu

DEFAULT_DIR="$(pwd)"
DEFAULT_APP_URL="http://localhost:3000"
HEALTH_TIMEOUT=60

# ---- output helpers --------------------------------------------------------

if [ -t 1 ]; then
    BOLD="$(printf '\033[1m')"
    DIM="$(printf '\033[2m')"
    RED="$(printf '\033[31m')"
    GREEN="$(printf '\033[32m')"
    YELLOW="$(printf '\033[33m')"
    RESET="$(printf '\033[0m')"
else
    BOLD=""; DIM=""; RED=""; GREEN=""; YELLOW=""; RESET=""
fi

info()  { printf '%s==>%s %s\n' "$BOLD" "$RESET" "$1"; }
ok()    { printf '%s✓%s %s\n' "$GREEN" "$RESET" "$1"; }
warn()  { printf '%s!%s %s\n' "$YELLOW" "$RESET" "$1"; }
die()   { printf '%serror:%s %s\n' "$RED" "$RESET" "$1" >&2; exit 1; }

# ---- prerequisite checks ---------------------------------------------------

OS="$(uname -s)"
case "$OS" in
    Linux|Darwin) ;;
    MINGW*|MSYS*|CYGWIN*) die "Windows is not supported directly. Use WSL2: https://learn.microsoft.com/windows/wsl/install" ;;
    *) die "Unsupported OS: $OS (Linux and macOS only)" ;;
esac
ok "Detected OS: $OS"

command -v openssl >/dev/null 2>&1 || die "openssl is required but not installed"
command -v docker >/dev/null 2>&1 || die "Docker is required. Install: https://docs.docker.com/get-docker/"

if ! docker info >/dev/null 2>&1; then
    die "Docker daemon is not running or your user lacks permission. Start Docker Desktop / 'sudo systemctl start docker' / add yourself to the docker group."
fi
ok "Docker daemon reachable"

if ! docker compose version >/dev/null 2>&1; then
    die "Docker Compose v2 is required. 'docker compose version' failed. Install: https://docs.docker.com/compose/install/"
fi
ok "Docker Compose v2 available"

# ---- setup env file --------------------------------------------------------

if [ ! -f .env ]; then
    info "No .env file found. Copying .env.example..."
    cp .env.example .env
    ok "Created .env file"
fi

# ---- generate secrets and set local version --------------------------------

patch_env() {
    # patch_env <key> <value>
    _key="$1"; _value="$2"
    
    # Check if value is already set and not empty (non-comments only)
    if grep -q "^[[:space:]]*$_key=[a-zA-Z0-9]" .env; then
        ok "$_key is already set in .env"
        return
    fi
    
    _tmp="$(mktemp)"
    awk -v k="$_key" -v v="$_value" '
        BEGIN { written = 0 }
        {
            # Match commented or blank assignment of key
            if ($0 ~ "^[[:space:]]*#?[[:space:]]*" k "=") {
                print k "=" v
                written = 1
                next
            }
            print
        }
        END {
            if (!written) print k "=" v
        }
    ' .env > "$_tmp" && mv "$_tmp" .env
    ok "Set $_key in .env"
}

# Generate secret values if not already present
BETTER_AUTH_SECRET="$(openssl rand -hex 32)"
ENCRYPTION_KEY="$(openssl rand -hex 32)"

patch_env BETTER_AUTH_SECRET "$BETTER_AUTH_SECRET"
patch_env ENCRYPTION_KEY "$ENCRYPTION_KEY"
patch_env RIFFADO_VERSION "local"
chmod 600 .env

# Get configured APP_URL or fallback
APP_URL="$(grep "^[[:space:]]*APP_URL=" .env | cut -d'=' -f2- || echo "")"
if [ -z "$APP_URL" ]; then
    APP_URL="$DEFAULT_APP_URL"
    patch_env APP_URL "$APP_URL"
fi

# ---- build custom image ----------------------------------------------------

info "Building production Docker image from local source..."
docker build -t riffado:local .
ok "Built riffado:local image successfully"

# ---- start the stack -------------------------------------------------------

info "Starting Riffado container stack..."
docker compose up -d

# ---- health check ----------------------------------------------------------

info "Waiting for $APP_URL/api/health (timeout ${HEALTH_TIMEOUT}s)..."
i=0
while [ "$i" -lt "$HEALTH_TIMEOUT" ]; do
    if docker compose exec -T app node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" >/dev/null 2>&1; then
        ok "Health check passed"
        printf '\n%s🎙  Riffado is up in production mode.%s\n' "$BOLD" "$RESET"
        printf '   Open %s%s/register%s to create your account.\n\n' "$BOLD" "$APP_URL" "$RESET"
        printf '   Logs:    docker compose logs -f\n'
        printf '   Restart: docker compose restart\n'
        printf '   Stop:    docker compose down\n\n'
        exit 0
    fi
    i=$((i + 1))
    sleep 1
done

warn "Health check did not return 200 within ${HEALTH_TIMEOUT}s."
warn "The stack may still be starting. Check logs using:"
warn "  docker compose logs -f"
exit 1
