import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import squooshVitePlugin from '@squoosh-kit/vite-plugin';
import { join } from 'path';

export default defineConfig({
  base: '/',
  server: {
    allowedHosts: ['squoosh-kit.dev', 'www.squoosh-kit.dev'],
  },
  plugins: [
    react(),
    tailwindcss(),
    squooshVitePlugin(join(process.cwd(), '..', '..', 'packages')),
  ],
});
