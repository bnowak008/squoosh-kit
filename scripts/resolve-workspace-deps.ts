import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface ResolvedDepsBackup {
  packageJsonPath: string;
  originalContent: string;
}

/**
 * Resolves workspace:* dependencies to concrete version numbers.
 *
 * @param pkgRoot - The root directory of the package to resolve
 * @param version - The concrete version to use for workspace dependencies
 * @returns Backup information to restore the original package.json
 */
export function resolveWorkspaceDependencies(
  pkgRoot: string,
  version: string
): ResolvedDepsBackup {
  const packageJsonPath = resolve(pkgRoot, 'package.json');
  const originalContent = readFileSync(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(originalContent);

  let hasWorkspaceDeps = false;

  // Resolve workspace:* in dependencies
  if (packageJson.dependencies) {
    for (const [depName, depVersion] of Object.entries(
      packageJson.dependencies
    )) {
      if (depVersion === 'workspace:*') {
        packageJson.dependencies[depName] = version;
        hasWorkspaceDeps = true;
        console.log(`  Resolved ${depName}: workspace:* → ${version}`);
      }
    }
  }

  // Resolve workspace:* in devDependencies (if any)
  if (packageJson.devDependencies) {
    for (const [depName, depVersion] of Object.entries(
      packageJson.devDependencies
    )) {
      if (depVersion === 'workspace:*') {
        packageJson.devDependencies[depName] = version;
        hasWorkspaceDeps = true;
        console.log(`  Resolved ${depName}: workspace:* → ${version}`);
      }
    }
  }

  // Resolve workspace:* in peerDependencies (if any)
  if (packageJson.peerDependencies) {
    for (const [depName, depVersion] of Object.entries(
      packageJson.peerDependencies
    )) {
      if (depVersion === 'workspace:*') {
        packageJson.peerDependencies[depName] = version;
        hasWorkspaceDeps = true;
        console.log(`  Resolved ${depName}: workspace:* → ${version}`);
      }
    }
  }

  if (hasWorkspaceDeps) {
    // Write the resolved package.json
    const resolvedContent = JSON.stringify(packageJson, null, 2) + '\n';
    writeFileSync(packageJsonPath, resolvedContent, 'utf8');
  } else {
    console.log('  No workspace dependencies to resolve');
  }

  return {
    packageJsonPath,
    originalContent,
  };
}

/**
 * Restores the original package.json from backup.
 *
 * @param backup - The backup information from resolveWorkspaceDependencies
 */
export function restoreOriginalPackageJson(backup: ResolvedDepsBackup): void {
  writeFileSync(backup.packageJsonPath, backup.originalContent, 'utf8');
}
