import { useState, useCallback } from 'react';

const FEATURES = [
  'Same WASM codecs that power squoosh.app',
  'Pick only the codecs your app needs',
  'Runs in Bun, Node.js, and the browser',
  'Non-blocking - codec work lives in a Worker by default',
  'TypeScript-first with full type coverage',
];

export default function InfoPanel() {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText('bun add @squoosh-kit/core').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  return (
    <div className="h-full min-w-0 w-full shrink-0 flex flex-col items-center justify-center px-4 sm:px-6 z-10">
      <div className="w-full min-w-0 max-w-[400px] flex flex-col items-center lg:items-start">
        {/* Logo row */}
        <div className="flex items-center gap-3 mb-3 lg:mb-5 pt-3">
          <span className="text-3xl lg:text-4xl">🧰</span>
          <span className="text-3xl lg:text-4xl font-black tracking-tight text-gray-900">
            Squoosh <span style={{ color: '#ff2d78' }}>Kit</span>
          </span>
        </div>

        {/* Tagline */}
        <p className="text-gray-700 text-base leading-relaxed text-center lg:text-left mb-3 lg:mb-4 max-w-[340px]">
          The battle-tested image codecs from Google Squoosh, packaged as a
          modular library that works in any JavaScript app.
        </p>

        {/* Feature list */}
        <ul className="flex flex-col gap-2 lg:gap-3 mb-5 lg:mb-8">
          {FEATURES.map((f) => (
            <li
              key={f}
              className="flex items-start gap-3 text-sm lg:text-base text-gray-700"
            >
              <svg
                className="shrink-0 mt-0.5"
                width="17"
                height="17"
                viewBox="0 0 17 17"
                fill="none"
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

        {/* Install block — terminal style */}
        <div className="w-full min-w-0 bg-gray-950 rounded-xl overflow-hidden border border-gray-800 shadow-sm mb-2 lg:mb-6">
          <div className="flex min-w-0 items-center justify-between gap-2 px-4 py-2">
            <code className="min-w-0 font-mono text-sm text-green-400 select-all break-all">
              <span className="text-gray-500 mr-2 select-none">$</span>bun add
              @squoosh-kit/core
            </code>
            <button
              onClick={handleCopy}
              className="shrink-0 text-gray-500 hover:text-gray-200 transition-colors"
              title="Copy"
            >
              {copied ? (
                <svg
                  className="h-4 w-4 text-green-400"
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
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
