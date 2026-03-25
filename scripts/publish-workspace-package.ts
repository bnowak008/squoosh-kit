import { resolve } from 'node:path';

function usage(): never {
  console.error(
    'usage: publish-workspace-package.ts <package-dir> [...bun publish args]'
  );
  process.exit(1);
}

function main(): number {
  const pkgDirName = process.argv[2];
  if (!pkgDirName) {
    usage();
  }

  const passthrough = process.argv.slice(3);
  const tag = process.env.NPM_PUBLISH_TAG?.trim();
  const pkgRoot = resolve(import.meta.dir, '..', 'packages', pkgDirName);

  const args = ['publish', '--access', 'public'];
  if (tag !== undefined && tag.length > 0) {
    args.push('--tag', tag);
  }
  args.push(...passthrough);

  const proc = Bun.spawnSync(['bun', ...args], {
    cwd: pkgRoot,
    stdio: ['inherit', 'inherit', 'inherit'],
  });

  return proc.exitCode ?? 1;
}

process.exit(main());
