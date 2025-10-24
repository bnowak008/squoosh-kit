import { Glob } from 'bun';

const SOURCE_DIR = 'src';
const OUTPUT_DIR = 'dist';

const glob = new Glob(`${SOURCE_DIR}/**/*.ts`);
const entrypoints = [...glob.scanSync()];

try {
  const result = await Bun.build({
    entrypoints,
    outdir: OUTPUT_DIR,
    splitting: true,
    sourcemap: 'external',
    minify: true,
    target: 'bun',
    format: 'esm',
    naming: '[dir]/[name].bun.[ext]',
  });

  if (!result.success) {
    console.error('Bun build failed');
    for (const message of result.logs) {
      console.error(message);
    }
  } else {
    console.log('Bun build completed successfully');
  }

  const nodeResult = await Bun.build({
    entrypoints,
    outdir: OUTPUT_DIR,
    splitting: true,
    sourcemap: 'external',
    minify: true,
    target: 'node',
    format: 'esm',
    naming: '[dir]/[name].node.mjs',
  });

  if (!nodeResult.success) {
    console.error('Node ESM build failed');
    for (const message of nodeResult.logs) {
      console.error(message);
    }
  } else {
    console.log('Node ESM build completed successfully');
  }

  const nodeCjsResult = await Bun.build({
    entrypoints,
    outdir: OUTPUT_DIR,
    splitting: true,
    sourcemap: 'external',
    minify: true,
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

  const browserResult = await Bun.build({
    entrypoints,
    outdir: OUTPUT_DIR,
    splitting: true,
    sourcemap: 'external',
    minify: true,
    target: 'browser',
    format: 'esm',
    naming: '[dir]/[name].browser.mjs',
  });

  if (!browserResult.success) {
    console.error('Browser build failed');
    for (const message of browserResult.logs) {
      console.error(message);
    }
  } else {
    console.log('Browser build completed successfully');
  }

  // Generate type definitions
  const typesResult = await Bun.spawn([
    'bun',
    'tsc',
    '--emitDeclarationOnly',
    '--outDir',
    OUTPUT_DIR,
  ]).exited;
  if (typesResult !== 0) {
    console.error('TypeScript declaration build failed');
  } else {
    console.log('TypeScript declaration build completed successfully');
  }
} catch (error) {
  console.error(error);
}
