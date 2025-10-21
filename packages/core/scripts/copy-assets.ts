import { cp, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packagesDir = resolve(__dirname, '..', '..');
const coreDistDir = resolve(__dirname, '..', 'dist');

async function copyPackageAssets(packageName: string) {
  const sourceDir = resolve(packagesDir, packageName, 'dist');
  const destinationDir = resolve(coreDistDir, 'features', packageName);

  try {
    await mkdir(destinationDir, { recursive: true });
    await cp(sourceDir, destinationDir, { recursive: true });
    console.log(`Copied assets from ${packageName} to ${destinationDir}`);
  } catch (error) {
    console.error(`Error copying assets for ${packageName}:`, error);
  }
}

async function main() {
  await Promise.all([copyPackageAssets('webp'), copyPackageAssets('resize')]);
}

main().catch((error) => {
  console.error('Failed to copy package assets:', error);
  process.exit(1);
});
