import { useState, useCallback } from 'react';

const FEATURES = [
  'Same WASM codecs that power squoosh.app',
  'Pick only the codecs your app needs',
  'Runs in Bun, Node.js, and the browser',
  'Non-blocking — codec work lives in a Worker',
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
    <div className="h-full w-1/2 shrink-0 flex flex-col items-center justify-center px-6 z-10">
      <div className="w-full max-w-[360px] flex flex-col items-start">
        {/* Logo row */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">🧰</span>
          <span className="text-3xl font-bold tracking-tight text-gray-900">Squoosh Kit</span>
        </div>

        {/* Tagline */}
        <p className="font-semibold text-gray-500 text-sm leading-relaxed mb-8">
          The battle-tested image codecs from Google Squoosh — packaged as a modular library
          that works in any JavaScript app.
        </p>

        {/* Feature list */}
        <ul className="flex flex-col gap-2 mb-8">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-pink-500 mt-0.5 shrink-0">●</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>

        {/* Install block */}
        <div className="bg-white/70 border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between gap-2 mb-6 backdrop-blur-sm">
          <span className="font-mono text-sm text-gray-800 select-all">bun add @squoosh-kit/core</span>
          <button
            onClick={handleCopy}
            className="shrink-0 text-gray-400 hover:text-gray-900 transition-colors"
            title="Copy"
          >
            {copied ? (
              <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>

        {/* Links */}
        <div className="flex gap-5 text-sm">
          <a
            href="https://www.npmjs.com/package/@squoosh-kit/core"
            target="_blank"
            rel="noreferrer"
            className="text-gray-400 hover:text-gray-900 transition-colors"
          >
            npm
          </a>
          <a
            href="https://github.com/bnowak008/squoosh-kit"
            target="_blank"
            rel="noreferrer"
            className="text-gray-400 hover:text-gray-900 transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
