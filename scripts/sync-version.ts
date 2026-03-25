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
 * Flags (after any command, e.g. set 1.0.0 --force):
 *   --no-git         Only write package.json versions; no commit or tag (skips tag-exists check)
 *   --force          Allow replacing an existing local tag (uses git tag -f)
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

function tagExists(tag: string): boolean {
  try {
    execSync(`git rev-parse refs/tags/${tag}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

type SyncOptions = { noGit: boolean; force: boolean };

function stripFlags(argv: string[]): {
  argv: string[];
  noGit: boolean;
  force: boolean;
} {
  const out: string[] = [];
  let noGit = false;
  let force = false;
  for (const a of argv) {
    if (a === '--no-git') noGit = true;
    else if (a === '--force') force = true;
    else out.push(a);
  }
  return { argv: out, noGit, force };
}

function syncVersions(newVersion: string, options: SyncOptions): void {
  const { noGit, force } = options;
  const tag = `v${newVersion}`;

  if (!noGit && !isWorkingTreeClean()) {
    console.error(
      '❌ Working tree is not clean. Commit or stash your changes before bumping the version.'
    );
    process.exit(1);
  }

  if (!noGit && !force && tagExists(tag)) {
    console.error(
      `❌ Tag ${tag} already exists. Delete it (git tag -d ${tag}), push --force if on remote, or re-run with --force (git tag -f) or --no-git (files only).`
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

  if (noGit) {
    console.log(
      '\n📦 Wrote versions only (--no-git). Commit and tag when ready, e.g.:'
    );
    console.log(
      `   git add package.json packages/*/package.json && git commit -m "chore: release ${tag}" && git tag ${tag}`
    );
    return;
  }

  execSync(`git add package.json`);
  for (const pkg of PACKAGES) {
    execSync(`git add packages/${pkg}/package.json`);
  }

  execSync(`git commit -m "chore: release ${tag}"`);
  if (force && tagExists(tag)) {
    execSync(`git tag -f ${tag}`);
    console.log(
      `\n🏷️  Created commit and replaced local tag ${tag} (git tag -f)`
    );
    console.log(
      'If the tag exists on the remote: git push origin ' + tag + ' --force'
    );
  } else {
    execSync(`git tag ${tag}`);
    console.log(`\n🏷️  Created commit and tag ${tag}`);
  }
  console.log('Run: git push --follow-tags');
}

function main(): void {
  const rawArgs = process.argv.slice(2);
  const { argv: args, noGit, force } = stripFlags(rawArgs);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    console.log(`
Version Sync Script for Squoosh-Kit

Usage:
  bun run scripts/sync-version.ts <command> [--no-git] [--force]

Commands:
  major           Bump major version (0.0.6 → 1.0.0)
  minor           Bump minor version (0.0.6 → 0.1.0)
  patch           Bump patch version (0.0.6 → 0.0.7)
  set <version>   Set a specific version (e.g., set 1.2.3)
  current         Show current version

Flags:
  --no-git        Only update package.json files (no commit/tag; skips tag-exists check)
  --force         If tag vX.Y.Z exists locally, replace it (git tag -f) after commit

Examples:
  bun run scripts/sync-version.ts major
  bun run scripts/sync-version.ts set 1.0.0 --force
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
      syncVersions(newVersion, { noGit, force });
      process.exit(0);
    }

    if (command === 'set') {
      const newVersion = args[1];

      if (!newVersion) {
        console.error('❌ Error: version argument required for "set" command');
        console.error(
          'Usage: bun run scripts/sync-version.ts set <version> [--no-git] [--force]'
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

      syncVersions(newVersion, { noGit, force });
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
