# Deployment Guide

This guide covers the complete process of building and deploying `@squoosh-kit/core` to npm in a production-ready manner.

## Prerequisites

- Bun 1.0+ installed
- npm account with publish permissions
- GitHub repository with proper secrets configured

## Environment Setup

### 1. NPM Authentication

Create an npm token with publish permissions:

```bash
npm login
# or
npm token create --access=public
```

Add the token to your GitHub repository secrets:
- Go to Settings → Secrets and variables → Actions
- Add `NPM_TOKEN` with your npm token value

### 2. GitHub Secrets

Ensure these secrets are configured in your repository:

- `NPM_TOKEN`: Your npm authentication token
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions

## Build Process

### Local Development Build

```bash
# Install dependencies
bun install

# Run tests
bun run test

# Lint and format
bun run lint
bun run format

# Build the package
bun run build:production
```

### Production Build

The production build process includes:

1. **Codec Copying**: Downloads and copies WebAssembly codecs from Squoosh
2. **Type Checking**: Validates TypeScript types
3. **Declaration Generation**: Creates `.d.ts` files
4. **Bundle Optimization**: Minifies and optimizes JavaScript
5. **Build Validation**: Ensures all artifacts are present

## Deployment Options

### Option 1: Automated Release (Recommended)

The repository is configured with semantic-release for automated versioning and publishing:

1. **Commit Convention**: Use conventional commits (feat:, fix:, etc.)
2. **Automatic Versioning**: Semantic-release determines version bumps
3. **Automatic Publishing**: Publishes to npm on version bump
4. **Changelog Generation**: Automatically updates CHANGELOG.md

#### Triggering a Release

```bash
# For a patch release (bug fixes)
git commit -m "fix: resolve WebP encoding issue"

# For a minor release (new features)
git commit -m "feat: add JPEG support"

# For a major release (breaking changes)
git commit -m "feat!: redesign API interface"
```

### Option 2: Manual Release

For manual control over releases:

```bash
# Update version in package.json
bun run version:patch  # or :minor, :major

# Build and test
bun run build:production
bun run test

# Publish to npm
bun publish
```

## Quality Assurance

### Pre-deployment Checklist

- [ ] All tests pass (`bun run test`)
- [ ] Type checking passes (`bun run check-types`)
- [ ] Linting passes (`bun run lint`)
- [ ] Code is formatted (`bun run format:check`)
- [ ] Build artifacts are valid (`bun run build:production`)
- [ ] Documentation is updated
- [ ] CHANGELOG.md is updated
- [ ] Version is bumped appropriately

### Automated Checks

The CI/CD pipeline automatically runs:

- **Type Checking**: TypeScript compilation
- **Linting**: ESLint validation
- **Formatting**: Prettier validation
- **Testing**: Unit and integration tests
- **Security**: Dependency audit
- **Build Validation**: Artifact verification

## Package Configuration

### Files Included in NPM Package

The following files are included in the published package:

```
@squoosh-kit/core/
├── dist/                    # Built JavaScript and TypeScript
│   ├── index.js
│   ├── index.d.ts
│   ├── features/
│   └── wasm/
├── wasm/                    # WebAssembly codecs
├── README.md
├── LICENSE
└── package.json
```

### Files Excluded

The following files are excluded via `.npmignore`:

- Source TypeScript files (`src/`)
- Test files (`test/`, `*.test.ts`)
- Development configuration (`.eslintrc.json`, `tsconfig.json`)
- Build scripts (`scripts/`)
- Documentation files (`README.md`, `CHANGELOG.md`)

## Version Management

### Semantic Versioning

The package follows semantic versioning (SemVer):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Pre-release Versions

For beta/alpha releases:

```bash
# Create a beta release
bun run version:prerelease --preid=beta

# Create an alpha release
bun run version:prerelease --preid=alpha
```

## Monitoring and Maintenance

### Post-deployment

1. **Monitor Downloads**: Check npm download statistics
2. **Monitor Issues**: Watch for GitHub issues and npm feedback
3. **Update Documentation**: Keep README and examples current
4. **Dependency Updates**: Regular security and feature updates

### Rollback Procedure

If a critical issue is discovered:

```bash
# Unpublish the problematic version
npm unpublish @squoosh-kit/core@<version>

# Fix the issue and republish
git revert <commit-hash>
bun run build:production
bun publish
```

## Security Considerations

### Package Security

- All dependencies are audited before publishing
- No sensitive information in published files
- WASM files are from trusted Squoosh repository
- No runtime dependencies on external services

### Access Control

- NPM token has minimal required permissions
- GitHub Actions run with limited scope
- Repository access is properly configured

## Troubleshooting

### Common Issues

1. **Build Failures**: Check TypeScript errors and missing dependencies
2. **Publish Failures**: Verify NPM_TOKEN and package permissions
3. **CI Failures**: Check GitHub Actions logs for specific errors
4. **Version Conflicts**: Ensure semantic-release configuration is correct

### Getting Help

- Check GitHub Issues for known problems
- Review CI/CD logs for specific error messages
- Verify all prerequisites are met
- Ensure proper authentication tokens are configured

## Best Practices

1. **Always test locally** before pushing
2. **Use conventional commits** for automatic versioning
3. **Keep dependencies updated** regularly
4. **Monitor package health** on npm
5. **Document breaking changes** clearly
6. **Maintain backward compatibility** when possible
