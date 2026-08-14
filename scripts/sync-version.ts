import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

/**
 * Version Sync Script for Squoosh-Kit
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
 *
 * Flags (after any command, e.g. set 1.0.0 --no-git):
 *   --no-git         Only write package.json and bun.lock versions; no commit
 */

const WORKSPACE_ROOT = import.meta.dir + '/..';
const PACKAGES = [
  'core',
  'resize',
  'runtime',
  'webp',
  'vite-plugin',
  'avif',
  'hqx',
  'imagequant',
  'jxl',
  'mozjpeg',
  'oxipng',
  'png',
  'qoi',
  'rotate',
  'visdif',
  'wp2',
];

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

function updateLockfileWorkspaceVersions(newVersion: string): void {
  const lockfilePath = join(WORKSPACE_ROOT, 'bun.lock');
  let content = readFileSync(lockfilePath, 'utf-8');

  for (const pkg of PACKAGES) {
    const pattern = new RegExp(
      `("packages/${pkg}": \\{\\s*"name": "@squoosh-kit/${pkg}",\\s*"version": ")([^"]+)(")`
    );
    const next = content.replace(pattern, `$1${newVersion}$3`);
    if (next === content) {
      throw new Error(`bun.lock missing workspace version for packages/${pkg}`);
    }
    content = next;
  }

  writeFileSync(lockfilePath, content, 'utf-8');
  console.log(`✓ Updated bun.lock workspace versions to ${newVersion}`);
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

function isWorkingTreeClean(): boolean {
  try {
    const result = execSync('git status --porcelain', { encoding: 'utf-8' });
    return result.trim() === '';
  } catch {
    return false;
  }
}

type SyncOptions = { noGit: boolean };

function stripFlags(argv: string[]): {
  argv: string[];
  noGit: boolean;
} {
  const out: string[] = [];
  let noGit = false;
  for (const a of argv) {
    if (a === '--no-git') noGit = true;
    else out.push(a);
  }
  return { argv: out, noGit };
}

function syncVersions(newVersion: string, options: SyncOptions): void {
  const { noGit } = options;
  const tag = `v${newVersion}`;

  if (!noGit && !isWorkingTreeClean()) {
    console.error(
      '❌ Working tree is not clean. Commit or stash your changes before bumping the version.'
    );
    process.exit(1);
  }

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
  updateLockfileWorkspaceVersions(newVersion);

  if (noGit) {
    console.log(
      '\n📦 Wrote versions only (--no-git). Commit when ready, e.g.:'
    );
    console.log(
      `   git add package.json bun.lock packages/*/package.json && git commit -m "chore: release ${tag}"`
    );
    return;
  }

  execSync(`git add package.json bun.lock`);
  for (const pkg of PACKAGES) {
    execSync(`git add packages/${pkg}/package.json`);
  }

  execSync(`git commit -m "chore: release ${tag}"`);
  console.log(`\nCreated commit chore: release ${tag}`);
  console.log('Push the branch and open a PR. Deploy tags after npm publish.');
}

function main(): void {
  const rawArgs = process.argv.slice(2);
  const { argv: args, noGit } = stripFlags(rawArgs);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    console.log(`
Version Sync Script for Squoosh-Kit

Usage:
  bun run scripts/sync-version.ts <command> [--no-git]

Commands:
  major           Bump major version (0.0.6 → 1.0.0)
  minor           Bump minor version (0.0.6 → 0.1.0)
  patch           Bump patch version (0.0.6 → 0.0.7)
  set <version>   Set a specific version (e.g., set 1.2.3)
  current         Show current version

Flags:
  --no-git        Only update package.json and bun.lock (no commit)

Examples:
  bun run scripts/sync-version.ts major
  bun run scripts/sync-version.ts set 1.0.0 --no-git
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
      syncVersions(newVersion, { noGit });
      process.exit(0);
    }

    if (command === 'set') {
      const newVersion = args[1];

      if (!newVersion) {
        console.error('❌ Error: version argument required for "set" command');
        console.error(
          'Usage: bun run scripts/sync-version.ts set <version> [--no-git]'
        );
        process.exit(1);
      }

      const versionRegex = /^\d+\.\d+\.\d+$/;
      if (!versionRegex.test(newVersion)) {
        console.error(
          `❌ Error: Invalid version format "${newVersion}". Expected format: X.Y.Z`
        );
        process.exit(1);
      }

      syncVersions(newVersion, { noGit });
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
