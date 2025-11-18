import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import squooshVitePlugin from '@squoosh-kit/vite-plugin';
import { join } from 'path';

export default defineConfig({
  plugins: [
    react(),
    squooshVitePlugin(join(process.cwd(), '..', '..', 'packages')),
  ],
});
