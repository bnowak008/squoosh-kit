# Production Deployment Guide

This guide covers the complete process of building and deploying `@squoosh-kit/core` to npm in a production-ready manner.

## 🚀 Quick Start

### Automated Deployment (Recommended)

The repository is configured with automated CI/CD pipelines. Simply:

1. **Commit with conventional commits**:

   ```bash
   git commit -m "feat: add new WebP encoding options"
   git push origin main
   ```

2. **Automatic release**: The CI/CD pipeline will:
   - Run all quality checks
   - Build the package
   - Determine version bump
   - Publish to npm
   - Create GitHub release

### Manual Deployment

For manual control over releases:

```bash
# 1. Build and test
bun run build:production
bun run test

# 2. Publish to npm
bun run publish:core

# 3. Create GitHub release
gh release create v$(cd packages/core && bun run -e "console.log(require('./package.json').version)") --generate-notes
```

## 📋 Pre-deployment Checklist

### Quality Assurance

- [ ] **Tests pass**: `bun run test`
- [ ] **Type checking**: `bun run check-types`
- [ ] **Linting**: `bun run lint`
- [ ] **Formatting**: `bun run format:check`
- [ ] **Build validation**: `bun run build:production`
- [ ] **Security audit**: `bun audit`

### Documentation

- [ ] **README updated**: Examples and API changes documented
- [ ] **CHANGELOG updated**: New features and fixes listed
- [ ] **Type definitions**: All public APIs have proper types
- [ ] **Code comments**: Complex logic is documented

### Package Configuration

- [ ] **Version bumped**: Appropriate semantic version
- [ ] **Dependencies updated**: Latest compatible versions
- [ ] **Exports configured**: All public APIs exported
- [ ] **Files included**: Only necessary files in package

## 🔧 Build Process

### Production Build

The production build process includes:

1. **Codec Copying**: Downloads WebAssembly codecs from Squoosh
2. **Type Checking**: Validates TypeScript types
3. **Declaration Generation**: Creates `.d.ts` files
4. **Bundle Optimization**: Minifies and optimizes JavaScript
5. **Build Validation**: Ensures all artifacts are present

```bash
# Run production build
bun run build:production

# Validate build artifacts
bun run validate
```

### Build Artifacts

The build produces the following structure:

```
dist/
├── index.js                    # Main entry point
├── index.d.ts                  # TypeScript definitions
├── features/
│   ├── webp/
│   │   ├── index.js            # WebP module
│   │   ├── index.d.ts          # WebP types
│   │   ├── webp.worker.js      # WebP worker
│   │   └── webp.worker.d.ts    # WebP worker types
│   └── resize/
│       ├── index.js            # Resize module
│       ├── index.d.ts          # Resize types
│       ├── resize.worker.js    # Resize worker
│       └── resize.worker.d.ts  # Resize worker types
└── wasm/
    ├── webp/
    │   ├── webp_enc.wasm       # WebP encoder WASM
    │   ├── webp_enc.js          # WebP encoder JS
    │   └── webp_enc.d.ts        # WebP encoder types
    └── resize/
        ├── squoosh_resize_bg.wasm  # Resize WASM
        ├── squoosh_resize.js       # Resize JS
        └── squoosh_resize.d.ts     # Resize types
```

## 🏗️ CI/CD Pipeline

### GitHub Actions Workflows

#### 1. CI Pipeline (`.github/workflows/ci.yml`)

Runs on every push and PR:

- **Type Checking**: TypeScript compilation
- **Linting**: ESLint validation
- **Formatting**: Prettier validation
- **Testing**: Unit and integration tests
- **Security**: Dependency audit
- **Build**: Production build validation

#### 2. Release Pipeline (`.github/workflows/release.yml`)

Runs on main branch pushes:

- **Semantic Release**: Automated versioning
- **NPM Publishing**: Automatic package publishing
- **GitHub Release**: Release notes and tags
- **Changelog**: Automatic changelog generation

### Environment Variables

Required secrets in GitHub repository:

- `NPM_TOKEN`: npm authentication token
- `GITHUB_TOKEN`: Automatically provided by GitHub

## 📦 Package Configuration

### NPM Package Structure

The published package includes:

```
@squoosh-kit/core/
├── dist/                    # Built JavaScript and TypeScript
├── wasm/                    # WebAssembly codecs
├── README.md               # Package documentation
├── LICENSE                 # MIT license
└── package.json            # Package metadata
```

### Package.json Configuration

Key configuration for production:

```json
{
  "name": "@squoosh-kit/core",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./webp": {
      "types": "./dist/features/webp/index.d.ts",
      "import": "./dist/features/webp/index.js"
    },
    "./resize": {
      "types": "./dist/features/resize/index.d.ts",
      "import": "./dist/features/resize/index.js"
    }
  },
  "files": ["dist/**", "wasm/**", "README.md", "LICENSE"],
  "sideEffects": false,
  "engines": {
    "bun": ">=1.0.0",
    "node": ">=18.0.0"
  }
}
```

## 🔒 Security Considerations

### Package Security

- **Dependency Audit**: All dependencies are audited
- **WASM Validation**: WebAssembly files are checksummed
- **No Runtime Dependencies**: Minimal external dependencies
- **Input Validation**: All inputs are validated

### Access Control

- **NPM Token**: Minimal required permissions
- **GitHub Actions**: Limited scope execution
- **Repository Access**: Proper team permissions

## 🚨 Troubleshooting

### Common Issues

#### Build Failures

```bash
# Check TypeScript errors
bun run check-types

# Check linting issues
bun run lint

# Check formatting
bun run format:check
```

#### Publish Failures

```bash
# Check npm authentication
npm whoami

# Check package permissions
npm access list packages @squoosh-kit

# Check package.json configuration
bun run validate
```

#### CI/CD Failures

1. **Check GitHub Actions logs**
2. **Verify secrets are configured**
3. **Check branch protection rules**
4. **Validate commit messages**

### Rollback Procedure

If a critical issue is discovered:

```bash
# 1. Unpublish the problematic version
npm unpublish @squoosh-kit/core@<version>

# 2. Fix the issue
git revert <commit-hash>
bun run build:production
bun run publish:core

# 3. Create a patch release
git commit -m "fix: resolve critical issue"
git push origin main
```

## 📊 Monitoring

### Post-deployment Monitoring

1. **NPM Downloads**: Monitor package usage
2. **GitHub Issues**: Watch for user feedback
3. **Security Advisories**: Monitor for vulnerabilities
4. **Dependency Updates**: Regular security updates

### Metrics to Track

- **Download Statistics**: npm download counts
- **GitHub Stars**: Repository popularity
- **Issue Resolution**: Bug fix response time
- **Security Updates**: Vulnerability response time

## 🎯 Best Practices

### Development

1. **Use conventional commits** for automatic versioning
2. **Test locally** before pushing
3. **Keep dependencies updated** regularly
4. **Document breaking changes** clearly
5. **Maintain backward compatibility** when possible

### Release Management

1. **Semantic versioning** for all releases
2. **Automated testing** before deployment
3. **Security scanning** in CI/CD
4. **Documentation updates** with releases
5. **User communication** for breaking changes

### Quality Assurance

1. **Code review** for all changes
2. **Automated testing** coverage
3. **Security auditing** regularly
4. **Performance monitoring** for regressions
5. **User feedback** integration

## 📚 Additional Resources

- [NPM Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [TypeScript Configuration](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html)

## 🤝 Support

For deployment issues:

- **GitHub Issues**: [Create an issue](https://github.com/bnowak008/squoosh-kit/issues)
- **Documentation**: Check this guide and README
- **Community**: GitHub Discussions
- **Security**: Use private security reporting

---

**Remember**: Always test your deployment process in a staging environment before deploying to production!
