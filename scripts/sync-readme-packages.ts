/**
 * Syncs package catalog tables into package READMEs.
 *
 * Updates:
 *   - Related Packages section in every packages/<name>/README.md
 *   - Whats Included table in packages/core/README.md
 *
 * Usage:
 *   bun run scripts/sync-readme-packages.ts          Write updates
 *   bun run scripts/sync-readme-packages.ts --check  Exit 1 if out of sync
 */

import { readdirSync } from 'fs';
import { join } from 'path';

const WORKSPACE_ROOT = join(import.meta.dir, '..');
const PACKAGES_DIR = join(WORKSPACE_ROOT, 'packages');
const REPO_URL = 'https://github.com/bnowak008/squoosh-kit';

const RELATED_BEGIN = '<!-- BEGIN:SQUOOSH-KIT-RELATED-PACKAGES -->';
const RELATED_END = '<!-- END:SQUOOSH-KIT-RELATED-PACKAGES -->';
const CORE_INCLUDED_BEGIN = '<!-- BEGIN:SQUOOSH-KIT-CORE-INCLUDED -->';
const CORE_INCLUDED_END = '<!-- END:SQUOOSH-KIT-CORE-INCLUDED -->';

type PackageEntry = {
  id: string;
  purpose: string;
  namespace?: string;
};

const PACKAGE_CATALOG: PackageEntry[] = [
  { id: 'core', purpose: 'All codecs bundled together' },
  { id: 'webp', namespace: 'webp', purpose: 'WebP encoding/decoding' },
  { id: 'avif', namespace: 'avif', purpose: 'AVIF encoding/decoding' },
  { id: 'mozjpeg', namespace: 'mozjpeg', purpose: 'Optimized JPEG encoding/decoding' },
  { id: 'jxl', namespace: 'jxl', purpose: 'JPEG XL encoding/decoding' },
  { id: 'wp2', namespace: 'wp2', purpose: 'WP2 encoding/decoding (experimental)' },
  { id: 'png', namespace: 'png', purpose: 'Lossless PNG encoding/decoding' },
  { id: 'qoi', namespace: 'qoi', purpose: 'QOI lossless encoding/decoding' },
  { id: 'resize', namespace: 'resize', purpose: 'High-quality image resizing' },
  { id: 'rotate', namespace: 'rotate', purpose: '90°/180°/270° rotation' },
  { id: 'oxipng', namespace: 'oxipng', purpose: 'Lossless PNG optimization' },
  { id: 'imagequant', namespace: 'imagequant', purpose: 'Palette quantization (PNG-8)' },
  { id: 'hqx', namespace: 'hqx', purpose: 'Pixel-art upscaling (2x/3x/4x)' },
  { id: 'visdif', namespace: 'visdif', purpose: 'Butteraugli perceptual comparison' },
  { id: 'runtime', purpose: 'Internal runtime utilities' },
  { id: 'vite-plugin', purpose: 'Vite plugin for WASM assets and CORS headers' },
];

function npmName(id: string): string {
  return `@squoosh-kit/${id}`;
}

function npmUrl(id: string): string {
  return `https://www.npmjs.com/package/${npmName(id)}`;
}

function npmLink(id: string): string {
  return `[\`${npmName(id)}\`](${npmUrl(id)})`;
}

function pad(text: string, width: number): string {
  return text.padEnd(width);
}

function relatedPackagesSection(): string {
  const rows = PACKAGE_CATALOG.map((entry) => ({
    package: npmLink(entry.id),
    purpose: entry.purpose,
  }));

  const packageWidth = Math.max('Package'.length, ...rows.map((row) => row.package.length));
  const purposeWidth = Math.max('Purpose'.length, ...rows.map((row) => row.purpose.length));

  const lines = [
    '## Related Packages',
    '',
    `Part of [Squoosh-Kit](${REPO_URL}). Install only what you need:`,
    '',
    `| ${pad('Package', packageWidth)} | ${pad('Purpose', purposeWidth)} |`,
    `| ${'-'.repeat(packageWidth)} | ${'-'.repeat(purposeWidth)} |`,
    ...rows.map(
      (row) => `| ${pad(row.package, packageWidth)} | ${pad(row.purpose, purposeWidth)} |`
    ),
    '',
  ];

  return `${RELATED_BEGIN}\n${lines.join('\n')}${RELATED_END}`;
}

function coreIncludedSection(): string {
  const rows = PACKAGE_CATALOG.filter((entry) => entry.namespace !== undefined).map((entry) => ({
    namespace: `\`${entry.namespace}\``,
    package: npmLink(entry.id),
    purpose: entry.purpose,
  }));

  const namespaceWidth = Math.max('Namespace'.length, ...rows.map((row) => row.namespace.length));
  const packageWidth = Math.max('Package'.length, ...rows.map((row) => row.package.length));
  const purposeWidth = Math.max('Purpose'.length, ...rows.map((row) => row.purpose.length));

  const lines = [
    '| ' +
      [
        pad('Namespace', namespaceWidth),
        pad('Package', packageWidth),
        pad('Purpose', purposeWidth),
      ].join(' | ') +
      ' |',
    '| ' +
      ['-'.repeat(namespaceWidth), '-'.repeat(packageWidth), '-'.repeat(purposeWidth)].join(
        ' | '
      ) +
      ' |',
    ...rows.map(
      (row) =>
        `| ${pad(row.namespace, namespaceWidth)} | ${pad(row.package, packageWidth)} | ${pad(row.purpose, purposeWidth)} |`
    ),
  ];

  return `${CORE_INCLUDED_BEGIN}\n${lines.join('\n')}\n${CORE_INCLUDED_END}`;
}

function replaceMarkedSection(
  content: string,
  begin: string,
  end: string,
  replacement: string
): string | null {
  const beginIndex = content.indexOf(begin);
  const endIndex = content.indexOf(end);

  if (beginIndex === -1 || endIndex === -1 || endIndex < beginIndex) {
    return null;
  }

  const afterEnd = endIndex + end.length;
  const after = content.slice(afterEnd).replace(/^\n*/, '\n\n');
  return content.slice(0, beginIndex) + replacement.replace(/\n*$/, '') + after;
}

function insertRelatedBeforeLicense(content: string, section: string): string | null {
  const licenseHeading = '\n## License\n';
  const licenseIndex = content.indexOf(licenseHeading);
  if (licenseIndex === -1) {
    return null;
  }

  const before = content.slice(0, licenseIndex).replace(/\s*$/, '\n\n');
  const after = content.slice(licenseIndex + 1);
  return `${before}${section}\n\n${after}`;
}

function syncRelatedPackages(content: string, section: string): { content: string; ok: boolean } {
  const replaced = replaceMarkedSection(content, RELATED_BEGIN, RELATED_END, section);
  if (replaced !== null) {
    return { content: replaced, ok: true };
  }

  const inserted = insertRelatedBeforeLicense(content, section);
  if (inserted !== null) {
    return { content: inserted, ok: true };
  }

  return { content, ok: false };
}

function syncCoreIncluded(content: string, section: string): { content: string; ok: boolean } {
  const replaced = replaceMarkedSection(content, CORE_INCLUDED_BEGIN, CORE_INCLUDED_END, section);
  if (replaced !== null) {
    return { content: replaced, ok: true };
  }

  const tableStart = content.indexOf('| Namespace');
  if (tableStart === -1) {
    return { content, ok: false };
  }

  const afterWhatsIncluded = content.indexOf('\n## ', tableStart);
  if (afterWhatsIncluded === -1) {
    return { content, ok: false };
  }

  const before = content.slice(0, tableStart);
  const after = content.slice(afterWhatsIncluded);
  return { content: `${before}${section}${after}`, ok: true };
}

async function main(): Promise<void> {
  const checkOnly = process.argv.includes('--check');
  const relatedSection = relatedPackagesSection();
  const coreIncluded = coreIncludedSection();

  const packageDirs = readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  let failed = false;

  for (const packageId of packageDirs) {
    const readmePath = join(PACKAGES_DIR, packageId, 'README.md');
    const file = Bun.file(readmePath);
    if (!(await file.exists())) {
      console.warn(`skip ${packageId}: no README.md`);
      continue;
    }

    let next = await file.text();
    const relatedResult = syncRelatedPackages(next, relatedSection);
    if (!relatedResult.ok) {
      console.error(`failed ${packageId}: could not insert Related Packages section`);
      failed = true;
      continue;
    }
    next = relatedResult.content;

    if (packageId === 'core') {
      const includedResult = syncCoreIncluded(next, coreIncluded);
      if (!includedResult.ok) {
        console.error(`failed core: could not sync What's Included table`);
        failed = true;
        continue;
      }
      next = includedResult.content;
    }

    if (next === (await file.text())) {
      console.log(`ok    ${packageId}`);
      continue;
    }

    if (checkOnly) {
      console.error(`drift ${packageId}: README package tables are out of sync`);
      failed = true;
      continue;
    }

    await Bun.write(readmePath, next);
    console.log(`wrote ${packageId}`);
  }

  if (failed) {
    process.exit(1);
  }
}

await main();
