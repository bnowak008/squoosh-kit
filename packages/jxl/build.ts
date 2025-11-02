import { Glob } from 'bun';
import { join } from 'path';
import { existsSync, mkdirSync, cpSync } from 'fs';

const SOURCE_DIR = 'src';
const OUTPUT_DIR = 'dist';

const glob = new Glob(`${SOURCE_DIR}/**/*.ts`);
const entrypoints = [...glob.scanSync()];

try {
  await import('./scripts/copy-assets.ts');

  for (const [target, format, naming] of [
    ['bun', 'esm', '[dir]/[name].bun.[ext]'],
    ['node', 'esm', '[dir]/[name].node.mjs'],
    ['node', 'cjs', '[dir]/[name].node.cjs'],
    ['browser', 'esm', '[dir]/[name].browser.mjs'],
  ] as const) {
    const result = await Bun.build({
      entrypoints,
      outdir: OUTPUT_DIR,
      splitting: true,
      sourcemap: 'external',
      minify: true,
      target,
      format,
      naming,
    });
    console.log(`${target} ${format} build: ${result.success ? '✓' : '✗'}`);
  }

  const typesResult = await Bun.spawn([
    'bun',
    'tsc',
    '--emitDeclarationOnly',
    '--outDir',
    OUTPUT_DIR,
  ]).exited;
  console.log(`TypeScript declarations: ${typesResult === 0 ? '✓' : '✗'}`);

  const wasmSrcDir = join('.', 'wasm');
  const wasmDestDir = join(OUTPUT_DIR, 'wasm');
  if (existsSync(wasmSrcDir)) {
    mkdirSync(wasmDestDir, { recursive: true });
    cpSync(wasmSrcDir, wasmDestDir, { recursive: true });
    console.log('✓ WASM files copied to dist/wasm/');
  }
} catch (error) {
  console.error(error);
}
