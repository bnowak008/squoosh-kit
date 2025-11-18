import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Version Sync Script for Squoosh Kit
 *
 * This script automatically bumps and synchronizes version numbers across all packages
 * in the monorepo, following semantic versioning principles.
 *
 * When a higher-level version is bumped, lower versions are automatically reset to 0.
 * For example:
 *   - Bumping major:   0.0.6 → 1.0.0
 *   - Bumping minor:   0.0.6 → 0.1.0
 *   - Bumping patch:   0.0.6 → 0.0.7
 *
 * Files updated:
 *   - Root package.json
 *   - packages/core/package.json
 *   - packages/resize/package.json
 *   - packages/runtime/package.json
 *   - packages/webp/package.json
 *
 * Usage:
 *   bun run scripts/sync-version.ts <command> [args]
 *
 * Commands:
 *   major            Bump major version
 *   minor            Bump minor version
 *   patch            Bump patch version
 *   set <version>    Set a specific version (must be in X.Y.Z format)
 *   current          Display the current version
 *   --help, -h       Show this help message
 */

const WORKSPACE_ROOT = import.meta.dir + '/..';
const PACKAGES = ['core', 'resize', 'runtime', 'webp', 'vite-plugin'];

type BumpType = 'major' | 'minor' | 'patch';

interface Version {
  major: number;
  minor: number;
  patch: number;
}

function parseVersion(versionString: string): Version {
  const [major, minor, patch] = versionString.split('.').map(Number);
  return { major, minor, patch };
}

function versionToString(version: Version): string {
  return `${version.major}.${version.minor}.${version.patch}`;
}

function bumpVersion(version: Version, bumpType: BumpType): Version {
  const bumped = { ...version };

  switch (bumpType) {
    case 'major':
      bumped.major += 1;
      bumped.minor = 0;
      bumped.patch = 0;
      break;
    case 'minor':
      bumped.minor += 1;
      bumped.patch = 0;
      break;
    case 'patch':
      bumped.patch += 1;
      break;
  }

  return bumped;
}

function updatePackageJsonVersion(filePath: string, newVersion: string): void {
  const content = readFileSync(filePath, 'utf-8');
  const json = JSON.parse(content);
  json.version = newVersion;

  writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf-8');
  console.log(`✓ Updated ${filePath} to ${newVersion}`);
}

function getCurrentVersion(): string {
  const rootPackageJsonPath = join(WORKSPACE_ROOT, 'package.json');
  const content = readFileSync(rootPackageJsonPath, 'utf-8');
  const json = JSON.parse(content);
  return json.version;
}

function syncVersions(newVersion: string): void {
  console.log(`\nSyncing version to ${newVersion}...\n`);

  const rootPackageJsonPath = join(WORKSPACE_ROOT, 'package.json');
  updatePackageJsonVersion(rootPackageJsonPath, newVersion);

  for (const pkg of PACKAGES) {
    const packageJsonPath = join(
      WORKSPACE_ROOT,
      'packages',
      pkg,
      'package.json'
    );
    updatePackageJsonVersion(packageJsonPath, newVersion);
  }

  console.log(`\n✨ All versions synced to ${newVersion}`);
}

function main(): void {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    console.log(`
Version Sync Script for Squoosh Kit

Usage:
  bun run scripts/sync-version.ts <command>

Commands:
  major           Bump major version (0.0.6 → 1.0.0)
  minor           Bump minor version (0.0.6 → 0.1.0)
  patch           Bump patch version (0.0.6 → 0.0.7)
  set <version>   Set a specific version (e.g., set 1.2.3)
  current         Show current version

Examples:
  bun run scripts/sync-version.ts major
  bun run scripts/sync-version.ts minor
  bun run scripts/sync-version.ts patch
  bun run scripts/sync-version.ts set 1.0.0
  bun run scripts/sync-version.ts current
    `);
    process.exit(0);
  }

  try {
    const currentVersion = getCurrentVersion();

    if (command === 'current') {
      console.log(`Current version: ${currentVersion}`);
      process.exit(0);
    }

    if (command === 'major' || command === 'minor' || command === 'patch') {
      const parsed = parseVersion(currentVersion);
      const bumped = bumpVersion(parsed, command);
      const newVersion = versionToString(bumped);
      syncVersions(newVersion);
      process.exit(0);
    }

    if (command === 'set') {
      const newVersion = args[1];

      if (!newVersion) {
        console.error('❌ Error: version argument required for "set" command');
        console.error('Usage: bun run scripts/sync-version.ts set <version>');
        process.exit(1);
      }

      const versionRegex = /^\d+\.\d+\.\d+$/;
      if (!versionRegex.test(newVersion)) {
        console.error(
          `❌ Error: Invalid version format "${newVersion}". Expected format: X.Y.Z`
        );
        process.exit(1);
      }

      syncVersions(newVersion);
      process.exit(0);
    }

    console.error(`❌ Unknown command: ${command}`);
    console.error('Run with --help to see available commands');
    process.exit(1);
  } catch (error) {
    console.error(
      '❌ Error:',
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

main();
