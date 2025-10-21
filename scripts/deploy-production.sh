#!/bin/bash

# Production deployment script for @squoosh-kit/core
# This script handles the complete deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PACKAGE_NAME="@squoosh-kit"
PACKAGE_DIR="."
NPM_REGISTRY="https://registry.npmjs.org/"

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if bun is installed
    if ! command -v bun &> /dev/null; then
        log_error "Bun is not installed. Please install Bun first."
        exit 1
    fi
    
    # Check if npm is logged in
    if ! npm whoami &> /dev/null; then
        log_error "Not logged in to npm. Please run 'npm login' first."
        exit 1
    fi
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -d "$PACKAGE_DIR" ]; then
        log_error "Not in the correct directory. Please run from the project root."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Clean and prepare
clean_and_prepare() {
    log_info "Cleaning and preparing workspace..."
    
    # Clean all workspaces
    bun run clean
    
    # Install dependencies
    bun install --frozen-lockfile
    
    log_success "Workspace prepared"
}

# Run quality checks
run_quality_checks() {
    log_info "Running quality checks..."
    
    # Type checking
    log_info "Running type checks..."
    bun run check-types
    
    # Linting
    log_info "Running linter..."
    bun run lint
    
    # Formatting check
    log_info "Checking code formatting..."
    bun run format:check
    
    # Tests
    log_info "Running tests..."
    bun run test
    
    log_success "All quality checks passed"
}

# Build the package
build_package() {
    log_info "Building package for production..."
    
    # Build with production settings
    bun run build:production
    
    log_success "Package built successfully"
}

# Validate build
validate_build() {
    log_info "Validating build artifacts..."
    
    # Check if dist directory exists
    if [ ! -d "$PACKAGE_DIR/dist" ]; then
        log_error "Build directory not found"
        exit 1
    fi
    
    # Check for required files
    local required_files=(
        "$PACKAGE_DIR/dist/index.js"
        "$PACKAGE_DIR/dist/index.d.ts"
        "$PACKAGE_DIR/dist/features/webp/index.js"
        "$PACKAGE_DIR/dist/features/webp/index.d.ts"
        "$PACKAGE_DIR/dist/features/resize/index.js"
        "$PACKAGE_DIR/dist/features/resize/index.d.ts"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            log_error "Required file missing: $file"
            exit 1
        fi
    done
    
    log_success "Build validation passed"
}

# Check version
check_version() {
    log_info "Checking package version..."
    
    local current_version=$(cd "$PACKAGE_DIR" && bun run -e "console.log(require('./package.json').version)")
    local published_version=$(npm view "$PACKAGE_NAME" version 2>/dev/null || echo "not-published")
    
    if [ "$current_version" = "$published_version" ]; then
        log_warning "Version $current_version is already published"
        read -p "Do you want to continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Deployment cancelled"
            exit 0
        fi
    fi
    
    log_success "Version check completed"
}

# Publish to npm
publish_package() {
    log_info "Publishing package to npm..."
    
    cd "$PACKAGE_DIR"
    
    # Publish to npm
    bun publish --access public --registry "$NPM_REGISTRY"
    
    cd - > /dev/null
    
    log_success "Package published successfully"
}

# Verify publication
verify_publication() {
    log_info "Verifying publication..."
    
    # Wait a moment for npm to update
    sleep 5
    
    # Check if package is available
    local published_version=$(npm view "$PACKAGE_NAME" version 2>/dev/null || echo "not-found")
    
    if [ "$published_version" = "not-found" ]; then
        log_error "Package not found on npm"
        exit 1
    fi
    
    log_success "Package successfully published as version $published_version"
}

# Main deployment function
main() {
    log_info "Starting production deployment for $PACKAGE_NAME"
    echo
    
    # Run all steps
    check_prerequisites
    clean_and_prepare
    run_quality_checks
    build_package
    validate_build
    check_version
    publish_package
    verify_publication
    
    echo
    log_success "🎉 Deployment completed successfully!"
    log_info "Package: $PACKAGE_NAME"
    log_info "Registry: $NPM_REGISTRY"
    log_info "You can now install it with: bun add $PACKAGE_NAME"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [options]"
        echo
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --dry-run      Run all checks without publishing"
        echo "  --force        Skip version checks"
        echo
        exit 0
        ;;
    --dry-run)
        log_info "Running in dry-run mode (no publishing)"
        # Override publish function for dry-run
        publish_package() {
            log_info "DRY RUN: Would publish package to npm"
        }
        verify_publication() {
            log_info "DRY RUN: Would verify publication"
        }
        main
        ;;
    --force)
        log_warning "Force mode enabled - skipping version checks"
        check_version() {
            log_info "Skipping version checks (force mode)"
        }
        main
        ;;
    "")
        main
        ;;
    *)
        log_error "Unknown option: $1"
        log_info "Use --help for usage information"
        exit 1
        ;;
esac
