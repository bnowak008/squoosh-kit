import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';

function usage(): never {
  console.error(
    'usage: publish-workspace-package.ts <package-dir> [...publish args]'
  );
  process.exit(1);
}

type PackageManifest = { name: string; version: string };

type PackedManifest = {
  dependencies?: Record<string, unknown>;
  peerDependencies?: Record<string, unknown>;
  optionalDependencies?: Record<string, unknown>;
};

const PACKED_DEP_FIELDS = [
  'dependencies',
  'peerDependencies',
  'optionalDependencies',
] as const;

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

function tarballFileName(name: string, version: string): string {
  const normalized = name.replace(/^@/, '').replaceAll('/', '-');
  return `${normalized}-${version}.tgz`;
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

function run(cmd: string[], cwd: string): number {
  const proc = Bun.spawnSync(cmd, {
    cwd,
    stdio: ['inherit', 'inherit', 'inherit'],
  });
  return proc.exitCode ?? 1;
}

function readPackedManifest(tarballPath: string): PackedManifest {
  const result = Bun.spawnSync(
    ['tar', '-xOf', tarballPath, 'package/package.json'],
    {
      stdout: 'pipe',
      stderr: 'pipe',
    }
  );
  if (result.exitCode !== 0) {
    throw new Error(`failed to read packed package.json from ${tarballPath}`);
  }
  return JSON.parse(new TextDecoder().decode(result.stdout)) as PackedManifest;
}

function workspacePackageDir(depName: string): string | undefined {
  const prefix = '@squoosh-kit/';
  if (!depName.startsWith(prefix)) {
    return undefined;
  }
  return depName.slice(prefix.length);
}

function assertPackedWorkspaceDeps(
  packed: PackedManifest,
  packagesRoot: string
): void {
  for (const field of PACKED_DEP_FIELDS) {
    const deps = packed[field];
    if (deps === undefined) {
      continue;
    }
    for (const [depName, depVersion] of Object.entries(deps)) {
      if (typeof depVersion !== 'string') {
        continue;
      }
      if (depVersion.startsWith('workspace:')) {
        throw new Error(
          `packed ${field} still contains ${depName}: ${depVersion}`
        );
      }
      const dirName = workspacePackageDir(depName);
      if (dirName === undefined) {
        continue;
      }
      const expected = readManifest(resolve(packagesRoot, dirName)).version;
      const resolved = depVersion.replace(/^[\^~]/, '');
      if (resolved !== expected) {
        throw new Error(
          `packed ${depName} is ${depVersion} but packages/${dirName} is ${expected}. Refresh bun.lock with bun install.`
        );
      }
    }
  }
}

function main(): number {
  const pkgDirName = process.argv[2];
  if (!pkgDirName) {
    usage();
  }

  const passthrough = process.argv.slice(3);
  const tag = process.env.NPM_PUBLISH_TAG?.trim();
  const packagesRoot = resolve(import.meta.dir, '..', 'packages');
  const pkgRoot = resolve(packagesRoot, pkgDirName);
  const { name, version } = readManifest(pkgRoot);

  const skipIfExists = process.env.PUBLISH_SKIP_IF_EXISTS?.trim() !== '0';
  if (skipIfExists) {
    if (isVersionPublishedOnRegistry(name, version)) {
      console.log(`skip: ${name}@${version} already on registry`);
      return 0;
    }
  }

  const tarballPath = resolve(pkgRoot, tarballFileName(name, version));

  try {
    console.log(`Packing ${name}@${version} with bun pm pack...`);
    const packExit = run(
      ['bun', 'pm', 'pack', '--filename', tarballPath],
      pkgRoot
    );
    if (packExit !== 0) {
      return packExit;
    }

    if (!existsSync(tarballPath)) {
      console.error(`expected pack output missing: ${tarballPath}`);
      return 1;
    }

    assertPackedWorkspaceDeps(readPackedManifest(tarballPath), packagesRoot);

    const args = ['publish', '--access', 'public'];
    if (tag !== undefined && tag.length > 0) {
      args.push('--tag', tag);
    }
    args.push(...passthrough);
    args.push(tarballPath);

    console.log(`Publishing ${tarballPath} with npm...`);
    return run(['npm', ...args], pkgRoot);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  } finally {
    if (existsSync(tarballPath)) {
      unlinkSync(tarballPath);
    }
  }
}

process.exit(main());
