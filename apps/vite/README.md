# Squoosh Kit Vite + React Demo

This is a demo application showing how to use `@squoosh-kit` in a Vite + React project. It demonstrates image resizing and WebP encoding with Web Workers.

## Quick Start

```bash
# Install dependencies
bun install

# Development
bun run dev  # Starts at http://localhost:5173

# Production build
bun run build  # Creates optimized dist/

# Preview production build locally
bun run preview
```

## Deployment

### Local Testing

```bash
bun run build
http-server dist/  # Requires: npm install -g http-server
# Visit http://localhost:8080
```

### Production Deployment

This app uses Web Workers which require proper server configuration. See the deployment guides:

- **[NGINX_DEPLOYMENT.md](../../NGINX_DEPLOYMENT.md)** - Complete Nginx configuration for production
- **[DEPLOYMENT_TROUBLESHOOTING.md](../../DEPLOYMENT_TROUBLESHOOTING.md)** - Troubleshooting guide

**Key production requirements:**

1. Worker files are copied to `public/squoosh-kit/` during build
2. These must be served at `/squoosh-kit/` with correct MIME types
3. Nginx requires Cross-Origin headers (`COEP`, `COOP`, CORS)
4. HTTPS is required (WASM needs secure context)

### Deployment Checklist

- [ ] Run `bun run build`
- [ ] Copy `dist/` to server: `/var/www/squoosh-app/dist/`
- [ ] Update Nginx config with CORS headers (see NGINX_DEPLOYMENT.md)
- [ ] Verify worker files at `/squoosh-kit/resize/` and `/squoosh-kit/webp/`
- [ ] Test with: `curl -I https://your-domain.com/squoosh-kit/resize/resize.worker.browser.mjs`
- [ ] Open app and verify image processing works

## Features

- ✅ Image resizing with configurable dimensions
- ✅ WebP encoding with quality and optimization options
- ✅ Web Worker support for non-blocking processing
- ✅ Before/after image comparison
- ✅ Processing statistics and timing
- ✅ Responsive design

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x';
import reactDom from 'eslint-plugin-react-dom';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
