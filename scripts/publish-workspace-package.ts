import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function usage(): never {
  console.error(
    'usage: publish-workspace-package.ts <package-dir> [...publish args]'
  );
  process.exit(1);
}

type PublishClient = 'bun' | 'npm';

function getPublishClient(): PublishClient {
  const raw = process.env.PUBLISH_CLIENT?.trim().toLowerCase();
  if (raw === undefined || raw.length === 0) {
    return 'bun';
  }
  if (raw === 'bun' || raw === 'npm') {
    return raw;
  }
  console.error('PUBLISH_CLIENT must be "bun" or "npm"');
  process.exit(1);
}

type PackageManifest = { name: string; version: string };

function readManifest(pkgRoot: string): PackageManifest {
  const pkgPath = resolve(pkgRoot, 'package.json');
  const raw = readFileSync(pkgPath, 'utf8');
  const manifest = JSON.parse(raw) as { name?: unknown; version?: unknown };
  if (typeof manifest.name !== 'string' || typeof manifest.version !== 'string') {
    console.error(`${pkgPath}: missing string name or version`);
    process.exit(1);
  }
  return { name: manifest.name, version: manifest.version };
}

function isVersionPublishedOnRegistry(name: string, version: string): boolean {
  const result = Bun.spawnSync(['npm', 'view', `${name}@${version}`, 'version'], {
    stdout: 'pipe',
    stderr: 'pipe',
  });
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

  const publishClient = getPublishClient();
  const proc = Bun.spawnSync([publishClient, ...args], {
    cwd: pkgRoot,
    stdio: ['inherit', 'inherit', 'inherit'],
  });

  return proc.exitCode ?? 1;
}

process.exit(main());
