import { writeFileSync } from 'fs';

const SOURCE_FILE = 'src/index.ts';
const OUTPUT_DIR = 'dist';

function logBuildFailure(
  label: string,
  logs: Array<{ message: string }>
): void {
  console.error(`${label} failed`);
  for (const message of logs) {
    console.error(message);
  }
}

try {
  const esmResult = await Bun.build({
    entrypoints: [SOURCE_FILE],
    outdir: OUTPUT_DIR,
    splitting: false,
    sourcemap: 'none',
    minify: false,
    target: 'node',
    format: 'esm',
    external: ['vite'],
  });

  if (!esmResult.success) {
    logBuildFailure('ESM build', esmResult.logs);
    process.exit(1);
  }
  console.log('ESM build completed successfully');

  const cjsResult = await Bun.build({
    entrypoints: [SOURCE_FILE],
    outfile: `${OUTPUT_DIR}/index.cjs`,
    splitting: false,
    sourcemap: 'none',
    minify: false,
    target: 'node',
    format: 'cjs',
    external: ['vite'],
  });

  if (!cjsResult.success) {
    logBuildFailure('CJS build', cjsResult.logs);
    process.exit(1);
  }
  console.log('CJS build completed successfully');

  const typesResult = await Bun.spawn(
    ['bun', 'tsc', '-p', '.', '--declarationMap', 'false'],
    { stdout: 'inherit', stderr: 'inherit' }
  ).exited;
  if (typesResult !== 0) {
    console.error('TypeScript declaration build failed');
    process.exit(1);
  }
  console.log('TypeScript declaration build completed successfully');

  writeFileSync(
    `${OUTPUT_DIR}/index.d.ts`,
    'export default function squooshVitePlugin(squooshKitRoot: string): { name: string };\n'
  );
} catch (error) {
  console.error(error);
  process.exit(1);
}

export {};
