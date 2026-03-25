import { build, Transpiler } from 'bun';
import { spawn } from 'bun';

const OUTPUT_DIR = 'dist';
const SOURCE_FILE = 'src/index.ts';

// Core is a pure re-exporter. Bun.build() generates invalid ESM stubs for
// namespace re-exports from workspace packages, so we use Bun.Transpiler for
// the ESM targets — it strips TS types and produces valid `export * as X from ...`.
async function buildEsm(outFile: string): Promise<void> {
  const transpiler = new Transpiler({ loader: 'ts' });
  const source = await Bun.file(SOURCE_FILE).text();
  const output = transpiler.transformSync(source);
  await Bun.write(`${OUTPUT_DIR}/${outFile}`, output);
}

try {
  // ESM targets via transpiler (avoids Bun.build namespace re-export bug)
  await buildEsm('index.bun.js');
  console.log('Bun build completed successfully');

  await buildEsm('index.node.mjs');
  console.log('Node ESM build completed successfully');

  await buildEsm('index.browser.mjs');
  console.log('Browser build completed successfully');

  // CJS target via Bun.build (needs CommonJS format transform)
  const nodeCjsResult = await build({
    entrypoints: [SOURCE_FILE],
    outdir: OUTPUT_DIR,
    splitting: false,
    sourcemap: 'external',
    minify: false,
    target: 'node',
    format: 'cjs',
    naming: '[dir]/[name].node.cjs',
  });

  if (!nodeCjsResult.success) {
    console.error('Node CJS build failed');
    for (const message of nodeCjsResult.logs) {
      console.error(message);
    }
  } else {
    console.log('Node CJS build completed successfully');
  }

  // Generate type definitions
  const typesResult = await spawn([
    'bun',
    'tsc',
    '--emitDeclarationOnly',
    '--outDir',
    OUTPUT_DIR,
  ]).exited;
  if (typesResult !== 0) {
    console.error('TypeScript declaration build failed');
    process.exit(1);
  }
  console.log('TypeScript declaration build completed successfully');
} catch (error) {
  console.error(error);
}
