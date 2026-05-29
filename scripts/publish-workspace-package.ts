import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  readWorkspacePackageVersions,
  rewriteWorkspaceProtocolForPublish,
} from './rewrite-workspace-protocol-for-publish.ts';

function usage(): never {
  console.error(
    'usage: publish-workspace-package.ts <package-dir> [...publish args]'
  );
  process.exit(1);
}

type PackageManifest = { name: string; version: string };

function readManifest(pkgRoot: string): PackageManifest {
  const pkgPath = resolve(pkgRoot, 'package.json');
  const raw = readFileSync(pkgPath, 'utf8');
  const manifest = JSON.parse(raw) as { name?: unknown; version?: unknown };
  if (
    typeof manifest.name !== 'string' ||
    typeof manifest.version !== 'string'
  ) {
    console.error(`${pkgPath}: missing string name or version`);
    process.exit(1);
  }
  return { name: manifest.name, version: manifest.version };
}

function isVersionPublishedOnRegistry(name: string, version: string): boolean {
  const result = Bun.spawnSync(
    ['npm', 'view', `${name}@${version}`, 'version'],
    {
      stdout: 'pipe',
      stderr: 'pipe',
    }
  );
  if (result.exitCode !== 0) {
    return false;
  }
  const out = new TextDecoder().decode(result.stdout).trim();
  return out === version;
}

function main(): number {
  const pkgDirName = process.argv[2];
  if (!pkgDirName) {
    usage();
  }

  const passthrough = process.argv.slice(3);
  const tag = process.env.NPM_PUBLISH_TAG?.trim();
  const pkgRoot = resolve(import.meta.dir, '..', 'packages', pkgDirName);
  const pkgJsonPath = resolve(pkgRoot, 'package.json');
  const packagesDir = resolve(import.meta.dir, '..', 'packages');

  const skipIfExists = process.env.PUBLISH_SKIP_IF_EXISTS?.trim() !== '0';
  if (skipIfExists) {
    const { name, version } = readManifest(pkgRoot);
    if (isVersionPublishedOnRegistry(name, version)) {
      console.log(`skip: ${name}@${version} already on registry`);
      return 0;
    }
  }

  const args = ['publish', '--access', 'public'];
  if (tag !== undefined && tag.length > 0) {
    args.push('--tag', tag);
  }
  args.push(...passthrough);

  const originalBytes = readFileSync(pkgJsonPath);
  const versions = readWorkspacePackageVersions(packagesDir);

  try {
    const manifest = JSON.parse(originalBytes.toString('utf8')) as Record<
      string,
      unknown
    >;
    rewriteWorkspaceProtocolForPublish(manifest, versions);
    writeFileSync(pkgJsonPath, `${JSON.stringify(manifest, null, 2)}\n`);

    const proc = Bun.spawnSync(['npm', ...args], {
      cwd: pkgRoot,
      stdio: ['inherit', 'inherit', 'inherit'],
    });

    return proc.exitCode ?? 1;
  } finally {
    writeFileSync(pkgJsonPath, originalBytes);
  }
}

process.exit(main());
