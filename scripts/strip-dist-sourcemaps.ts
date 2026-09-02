import { readdirSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

export function stripDistSourcemaps(distDir: string): number {
  let removed = 0;

  function walk(dir: string): void {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      const stat = statSync(path);
      if (stat.isDirectory()) {
        walk(path);
        continue;
      }
      if (entry.endsWith('.map')) {
        unlinkSync(path);
        removed += 1;
      }
    }
  }

  walk(distDir);
  return removed;
}

if (import.meta.main) {
  const distDir = process.argv[2];
  if (!distDir) {
    console.error('usage: strip-dist-sourcemaps.ts <dist-dir>');
    process.exit(1);
  }
  const removed = stripDistSourcemaps(distDir);
  console.log(`Removed ${removed} sourcemap file(s) from ${distDir}`);
}
