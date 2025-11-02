#!/usr/bin/env bun
import { join } from 'path';
import { existsSync, mkdirSync, cpSync, rmSync } from 'fs';

const PACKAGE_ROOT = join(import.meta.dir, '..');
const SQUOOSH_ROOT = join(PACKAGE_ROOT, '..', '..', '.squoosh-temp');
const DEST_DIR = join(PACKAGE_ROOT, 'wasm');

async function main() {
  const jxlEncSrc = join(SQUOOSH_ROOT, 'codecs', 'jxl', 'enc');
  const jxlDecSrc = join(SQUOOSH_ROOT, 'codecs', 'jxl', 'dec');

  if (!existsSync(jxlEncSrc)) {
    console.error(`JXL encoder source not found at: ${jxlEncSrc}`);
    process.exit(1);
  }

  if (existsSync(DEST_DIR)) rmSync(DEST_DIR, { recursive: true, force: true });
  mkdirSync(DEST_DIR, { recursive: true });

  console.log('Copying JXL codec artifacts...');

  const filesToCopy = {
    [jxlEncSrc]: [
      'jxl_enc.wasm',
      'jxl_enc.js',
      'jxl_enc.d.ts',
      'jxl_enc_mt.wasm',
      'jxl_enc_mt.js',
      'jxl_enc_mt.d.ts',
      'jxl_enc_mt.worker.js',
      'jxl_enc_mt_simd.wasm',
      'jxl_enc_mt_simd.js',
      'jxl_enc_mt_simd.d.ts',
      'jxl_enc_mt_simd.worker.js',
      'jxl_node_enc.wasm',
      'jxl_node_enc.js',
    ],
    [jxlDecSrc]: [
      'jxl_dec.wasm',
      'jxl_dec.js',
      'jxl_dec.d.ts',
      'jxl_node_dec.wasm',
      'jxl_node_dec.js',
    ],
  };

  let copiedCount = 0;
  for (const [srcDir, files] of Object.entries(filesToCopy)) {
    if (!existsSync(srcDir)) continue;
    const dest =
      srcDir === jxlEncSrc ? join(DEST_DIR, 'jxl') : join(DEST_DIR, 'jxl-dec');
    mkdirSync(dest, { recursive: true });

    for (const file of files) {
      const srcFile = join(srcDir, file);
      const destFile = join(dest, file);
      if (existsSync(srcFile)) {
        cpSync(srcFile, destFile);
        console.log(`  ✓ ${file}`);
        copiedCount++;
      }
    }
  }

  console.log(`\nCopied ${copiedCount} JXL files.`);
}

main().catch((error) => {
  console.error('Error copying JXL assets:', error);
  process.exit(1);
});
