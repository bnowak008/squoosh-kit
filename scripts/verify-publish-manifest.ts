import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  readWorkspacePackageVersions,
  rewriteWorkspaceProtocolForPublish,
} from './rewrite-workspace-protocol-for-publish.ts';

const pkgDir = process.argv[2] ?? 'webp';
const repoRoot = resolve(import.meta.dir, '..');
const pkgRoot = resolve(repoRoot, 'packages', pkgDir);
const pkgJsonPath = resolve(pkgRoot, 'package.json');

const raw = readFileSync(pkgJsonPath, 'utf8');
const manifest = JSON.parse(raw) as Record<string, unknown>;
const versions = readWorkspacePackageVersions(resolve(repoRoot, 'packages'));
rewriteWorkspaceProtocolForPublish(manifest, versions);

const blocks = [
  'dependencies',
  'optionalDependencies',
  'peerDependencies',
  'devDependencies',
] as const;

for (const blockName of blocks) {
  const block = manifest[blockName] as Record<string, string> | undefined;
  if (block === undefined) {
    continue;
  }
  for (const [depName, spec] of Object.entries(block)) {
    if (typeof spec === 'string' && spec.startsWith('workspace:')) {
      console.error(
        `${pkgJsonPath}: after rewrite, ${blockName}.${depName} is still ${spec}`
      );
      process.exit(1);
    }
  }
}

const name = typeof manifest.name === 'string' ? manifest.name : pkgDir;
console.log(
  `verify-publish-manifest: ${name} ok (no workspace: in dependency fields)`
);
