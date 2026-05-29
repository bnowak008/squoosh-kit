import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const WORKSPACE_PROTOCOL = /^workspace:/;

export function readWorkspacePackageVersions(
  packagesDir: string
): Map<string, string> {
  const map = new Map<string, string>();
  for (const entry of readdirSync(packagesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }
    const pkgPath = join(packagesDir, entry.name, 'package.json');
    let raw: string;
    try {
      raw = readFileSync(pkgPath, 'utf8');
    } catch {
      continue;
    }
    const manifest = JSON.parse(raw) as { name?: unknown; version?: unknown };
    if (
      typeof manifest.name === 'string' &&
      typeof manifest.version === 'string'
    ) {
      map.set(manifest.name, manifest.version);
    }
  }
  return map;
}

type DepBlock = Record<string, string>;

function rewriteDepBlock(
  block: DepBlock | undefined,
  versions: ReadonlyMap<string, string>
): void {
  if (block === undefined) {
    return;
  }
  for (const key of Object.keys(block)) {
    const spec = block[key];
    if (typeof spec !== 'string' || !WORKSPACE_PROTOCOL.test(spec)) {
      continue;
    }
    const ver = versions.get(key);
    if (ver === undefined) {
      throw new Error(
        `Cannot resolve workspace dependency "${key}": no package named "${key}" under packages/`
      );
    }
    block[key] = ver;
  }
}

export function rewriteWorkspaceProtocolForPublish(
  manifest: Record<string, unknown>,
  versions: ReadonlyMap<string, string>
): void {
  rewriteDepBlock(manifest.dependencies as DepBlock | undefined, versions);
  rewriteDepBlock(
    manifest.optionalDependencies as DepBlock | undefined,
    versions
  );
  rewriteDepBlock(manifest.peerDependencies as DepBlock | undefined, versions);
  rewriteDepBlock(manifest.devDependencies as DepBlock | undefined, versions);
}
