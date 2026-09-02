import { useState, useCallback, useEffect, useRef, type SyntheticEvent, type ChangeEvent } from 'react';
import Logo from './Logo';
import { CODECS } from '../codec/registry';
import type { CodecId } from '../types';

const FEATURES = [
  'The real Squoosh WASM, byte for byte',
  'Install only the codecs you need',
  'Workers do the lifting — your UI stays buttery',
  'TypeScript types all the way down',
];

type InstallPackage = 'core' | 'resize' | CodecId;

const PACKAGE_OPTIONS: InstallPackage[] = [
  'core',
  'resize',
  ...CODECS.map((codec) => codec.id),
];

function pickRandomPackage(current: InstallPackage): InstallPackage {
  if (PACKAGE_OPTIONS.length <= 1) {
    return PACKAGE_OPTIONS[0] ?? 'core';
  }

  let next = current;
  while (next === current) {
    const candidate =
      PACKAGE_OPTIONS[Math.floor(Math.random() * PACKAGE_OPTIONS.length)];
    if (candidate !== undefined) {
      next = candidate;
    }
  }
  return next;
}

function randomPackage(): InstallPackage {
  return (
    PACKAGE_OPTIONS[Math.floor(Math.random() * PACKAGE_OPTIONS.length)] ??
    'core'
  );
}

type Props = {
  codecId: CodecId;
};

function buildInstallCommand(pkg: InstallPackage): string {
  return `bun add @squoosh-kit/${pkg}`;
}

const PACKAGE_SLOT_WIDTH = `${Math.max(...PACKAGE_OPTIONS.map((pkg) => pkg.length))}ch`;

type AnimatedPackageNameProps = {
  name: InstallPackage;
  animate: boolean;
};

function AnimatedPackageName({ name, animate }: AnimatedPackageNameProps) {
  const [displayed, setDisplayed] = useState(name);
  const [leaving, setLeaving] = useState<InstallPackage | null>(null);
  const displayedRef = useRef(name);

  useEffect(() => {
    if (!animate) {
      displayedRef.current = name;
      setDisplayed(name);
      setLeaving(null);
      return;
    }

    if (name === displayedRef.current) return;

    setLeaving(displayedRef.current);
    displayedRef.current = name;
    setDisplayed(name);

    const timeoutId = window.setTimeout(() => {
      setLeaving(null);
    }, 420);

    return () => window.clearTimeout(timeoutId);
  }, [animate, name]);

  return (
    <span
      className="install-package-slot"
      style={{ minWidth: PACKAGE_SLOT_WIDTH }}
      aria-hidden="true"
    >
      {leaving !== null && (
        <span className="install-package-slot-item install-package-slot-exit">
          {leaving}
        </span>
      )}
      <span
        className={`install-package-slot-item ${
          leaving !== null ? 'install-package-slot-enter' : ''
        }`}
      >
        {displayed}
      </span>
    </span>
  );
}

export default function InfoPanel({ codecId }: Props) {
  const [selectedPackage, setSelectedPackage] = useState<InstallPackage>(
    randomPackage
  );
  const [packageLocked, setPackageLocked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(true);

  const lockPackage = useCallback(() => {
    setPackageLocked(true);
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    setMotionEnabled(!reducedMotion);
  }, []);

  useEffect(() => {
    if (packageLocked) return;

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (reducedMotion) {
      setSelectedPackage(codecId);
      setPackageLocked(true);
      return;
    }

    const intervalId = window.setInterval(() => {
      setSelectedPackage((current) => pickRandomPackage(current));
    }, 2400);

    return () => window.clearInterval(intervalId);
  }, [packageLocked, codecId]);

  const installCommand = buildInstallCommand(selectedPackage);

  const handleCopy = useCallback(() => {
    lockPackage();
    void navigator.clipboard.writeText(installCommand).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [installCommand, lockPackage]);

  const stopSelectEvent = (event: SyntheticEvent) => {
    event.stopPropagation();
    lockPackage();
  };

  const handlePackageChange = (event: ChangeEvent<HTMLSelectElement>) => {
    lockPackage();
    setSelectedPackage(event.target.value as InstallPackage);
  };

  return (
    <div className="h-full min-w-0 w-full shrink-0 flex flex-col items-center justify-center px-4 sm:px-6 z-10">
      <div className="w-full min-w-0 max-w-[400px] lg:max-w-[480px] flex flex-col items-center lg:items-start">
        <div className="rise-in mb-4 lg:mb-6 pt-3">
          <Logo />
        </div>

        <h1
          className="rise-in text-[clamp(1.15rem,2.8vw,1.8rem)] whitespace-nowrap leading-[1.15] font-extrabold tracking-tight text-gray-900 text-center lg:text-left mb-3"
          style={{ animationDelay: '90ms' }}
        >
          Squoosh codecs,{' '}
          <span className="relative inline-block whitespace-nowrap">
            à la carte.
            <svg
              className="squiggle-underline absolute -bottom-1.5 left-0 h-[7px] w-full"
              viewBox="0 0 120 8"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M3 5.5 C 22 1.5, 42 6.5, 62 3.5 S 102 5.5, 117 2.5"
                fill="none"
                stroke="#ff2d78"
                strokeWidth="3"
                strokeLinecap="round"
                pathLength={1}
                className="squiggle-path"
              >
                <animate
                  attributeName="d"
                  dur="3.4s"
                  repeatCount="indefinite"
                  begin="1.6s"
                  calcMode="spline"
                  keyTimes="0;0.22;0.48;0.74;1"
                  keySplines="0.42 0 0.58 1;0.34 0.12 0.28 1;0.42 0 0.58 1;0.34 0.12 0.28 1"
                  values="
                    M3 5.5 C 22 1.5, 42 6.5, 62 3.5 S 102 5.5, 117 2.5;
                    M3 5.1 C 22 2.4, 42 5.6, 62 4.3 S 102 4.1, 117 3.4;
                    M3 4.7 C 22 3.6, 42 4.4, 62 5.1 S 102 5.2, 117 4.2;
                    M3 5.0 C 22 2.1, 42 6.1, 62 3.7 S 102 5.9, 117 3.1;
                    M3 5.5 C 22 1.5, 42 6.5, 62 3.5 S 102 5.5, 117 2.5
                  "
                />
              </path>
            </svg>
          </span>
        </h1>

        <p
          className="rise-in text-gray-700 text-[15px] lg:text-base leading-relaxed text-center lg:text-left mb-5 lg:mb-6 max-w-[36ch]"
          style={{ animationDelay: '180ms' }}
        >
          The same WASM engines that power{' '}
          <a
            href="https://squoosh.app"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-gray-900 underline decoration-[#ff2d78]/40 underline-offset-2 transition-colors hover:decoration-[#ff2d78]"
          >
            squoosh.app
          </a>
          , split into tidy little packages for Bun, Node, and the browser.
        </p>

        <ul className="flex flex-col gap-2.5 lg:gap-3 mb-6 lg:mb-8">
          {FEATURES.map((f, i) => (
            <li
              key={f}
              className="rise-in flex items-start gap-3 text-sm lg:text-[15px] text-gray-800"
              style={{ animationDelay: `${270 + i * 70}ms` }}
            >
              <svg
                className="shrink-0 mt-0.5"
                width="17"
                height="17"
                viewBox="0 0 17 17"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  cx="8.5"
                  cy="8.5"
                  r="8.5"
                  fill="#ff2d78"
                  fillOpacity="0.12"
                />
                <path
                  d="M5 8.5l2.5 2.5 4.5-5"
                  stroke="#ff2d78"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <div
          className="rise-in w-full min-w-0 mb-2 lg:mb-6"
          style={{ animationDelay: '560ms' }}
        >
          <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#ff2d78] mb-2 ml-2 text-center lg:text-left">
            - Get squooshed
          </span>
          <div
            role="button"
            tabIndex={0}
            onClick={handleCopy}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleCopy();
              }
            }}
            aria-label={`Copy install command: ${installCommand}`}
            className={`install-terminal w-full min-w-0 bg-gray-950 rounded-xl overflow-hidden border shadow-sm transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff2d78] ${
              copied
                ? 'border-green-500/60'
                : 'border-gray-800 hover:border-gray-700'
            }`}
          >
            <div className="flex min-w-0 items-center justify-between gap-2 px-4 py-2.5">
              <code className="min-w-0 font-mono text-sm leading-[1.25] text-green-400 break-all">
                <span className="install-terminal-line">
                  <span className="text-gray-500 mr-2">$</span>
                  <span>bun add @squoosh-kit/</span>
                  {packageLocked ? (
                    <select
                      value={selectedPackage}
                      onChange={handlePackageChange}
                      onClick={stopSelectEvent}
                      onMouseDown={stopSelectEvent}
                      onKeyDown={stopSelectEvent}
                      aria-label="Choose package to install"
                      className="install-package-select"
                      style={{ minWidth: PACKAGE_SLOT_WIDTH }}
                    >
                      <option value="core">core</option>
                      <option value="resize">resize</option>
                      {CODECS.map((codec) => (
                        <option key={codec.id} value={codec.id}>
                          {codec.id}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <button
                      type="button"
                      onClick={stopSelectEvent}
                      onMouseDown={stopSelectEvent}
                      onKeyDown={stopSelectEvent}
                      aria-label={`Choose package to install, currently ${selectedPackage}`}
                      className="install-package-display"
                      style={{ minWidth: PACKAGE_SLOT_WIDTH }}
                    >
                      <AnimatedPackageName
                        name={selectedPackage}
                        animate={motionEnabled}
                      />
                    </button>
                  )}
                  <span
                    className="cursor-blink ml-1.5 inline-block h-[1em] w-[7px] translate-y-[2px] bg-green-400/80"
                    aria-hidden="true"
                  />
                </span>
              </code>
              <span
                className={`shrink-0 transition-colors ${copied ? 'text-green-400' : 'text-gray-500'}`}
                aria-hidden="true"
              >
                {copied ? (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
