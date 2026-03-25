#!/bin/bash

# Production deployment script for squoosh-kit monorepo
# For local/manual use. CI uses .github/workflows/ci.yml for automated publishing.

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

NPM_REGISTRY="https://registry.npmjs.org/"

log_info()    { echo -e "${BLUE}INFO  $1${NC}"; }
log_success() { echo -e "${GREEN}OK    $1${NC}"; }
log_warning() { echo -e "${YELLOW}WARN  $1${NC}"; }
log_error()   { echo -e "${RED}ERROR $1${NC}"; }

check_prerequisites() {
    log_info "Checking prerequisites..."
    if ! command -v bun &> /dev/null; then
        log_error "Bun is not installed."
        exit 1
    fi
    if ! npm whoami --registry "$NPM_REGISTRY" &> /dev/null; then
        log_error "Not logged in to npm. Run 'npm login' or set NPM_CONFIG_TOKEN."
        exit 1
    fi
    if [ ! -f "package.json" ] || [ ! -d "packages" ]; then
        log_error "Run this script from the monorepo root."
        exit 1
    fi
    log_success "Prerequisites OK"
}

clean_and_prepare() {
    log_info "Cleaning and preparing workspace..."
    bun run clean
    bun install --frozen-lockfile --linker=hoisted
    log_success "Workspace prepared"
}

run_quality_checks() {
    log_info "Running quality checks..."
    bun run check-types
    bun run lint
    bun run format:check
    bun run test
    log_success "Quality checks passed"
}

build_packages() {
    log_info "Building all packages (syncing latest Squoosh WASM + building)..."
    bun run ci:build
    log_success "Build completed"
}

validate_build() {
    log_info "Validating build artifacts..."
    bun run validate:artifacts
    log_success "Artifact validation passed"
}

check_version() {
    log_info "Checking version against registry..."
    CURRENT_VERSION=$(bun -e "console.log(require('./package.json').version)")
    PUBLISHED_VERSION=$(npm view "@squoosh-kit/core" version --registry "$NPM_REGISTRY" 2>/dev/null || echo "not-published")
    log_info "Local version:     $CURRENT_VERSION"
    log_info "Published version: $PUBLISHED_VERSION"
    if [ "$CURRENT_VERSION" = "$PUBLISHED_VERSION" ]; then
        log_warning "Version $CURRENT_VERSION is already published to npm"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Deployment cancelled"
            exit 0
        fi
    fi
    log_success "Version check completed"
}

publish_packages() {
    log_info "Publishing all packages to npm..."
    bun run release:publish
    log_success "All packages published"
}

verify_publication() {
    log_info "Verifying publication (waiting 10s for registry propagation)..."
    sleep 10
    CURRENT_VERSION=$(bun -e "console.log(require('./package.json').version)")
    PUBLISHED=$(npm view "@squoosh-kit/core@${CURRENT_VERSION}" version --registry "$NPM_REGISTRY" 2>/dev/null || echo "")
    if [ -z "$PUBLISHED" ]; then
        log_error "@squoosh-kit/core@${CURRENT_VERSION} not found on npm after publish"
        exit 1
    fi
    log_success "Verified @squoosh-kit/core@${PUBLISHED} on npm"
}

main() {
    log_info "Starting production deployment for squoosh-kit"
    echo
    check_prerequisites
    clean_and_prepare
    run_quality_checks
    build_packages
    validate_build
    check_version
    publish_packages
    verify_publication
    echo
    log_success "Deployment complete. Install: bun add @squoosh-kit/core"
}

case "${1:-}" in
    --help|-h)
        cat <<'EOF'
Usage: ./scripts/deploy-production.sh [options]

Options:
  --help, -h     Show this help
  --dry-run      Run all checks without publishing
  --force        Skip version-already-published check

For automated CI publishing, use: git push --follow-tags
EOF
        exit 0
        ;;
    --dry-run)
        log_info "DRY RUN mode: no publishing will occur"
        publish_packages() { log_info "DRY RUN: skipping bun run release:publish"; }
        verify_publication() { log_info "DRY RUN: skipping verification"; }
        main
        ;;
    --force)
        log_warning "FORCE mode: skipping version-already-published check"
        check_version() { log_info "FORCE: skipping version check"; }
        main
        ;;
    "")
        main
        ;;
    *)
        log_error "Unknown option: $1"
        log_info "Use --help for usage"
        exit 1
        ;;
esac
