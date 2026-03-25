import { useState } from 'react';
import type { Dispatch } from 'react';
import type { AppState, Action, CodecId, ResizeOptions } from '../types';
import FormatSelector from './FormatSelector';
import OptionsPanel from './OptionsPanel';
import DownloadButton from './DownloadButton';
import ResizePanel from './ResizePanel';

// ── token helpers ──────────────────────────────────────────────────────────────

type Token = { text: string; color: string };

const kw = (t: string): Token => ({ text: t, color: '#c792ea' });
const fn = (t: string): Token => ({ text: t, color: '#82aaff' });
const str = (t: string): Token => ({ text: t, color: '#c3e88d' });
const num = (t: string): Token => ({ text: t, color: '#f78c6c' });
const pun = (t: string): Token => ({ text: t, color: '#89ddff' });
const prop = (t: string): Token => ({ text: t, color: '#f07178' });
const plain = (t: string): Token => ({ text: t, color: '#eeffff' });
const cmt = (t: string): Token => ({ text: t, color: '#546e7a' });

// ── codec metadata ─────────────────────────────────────────────────────────────

const FACTORY: Record<CodecId, string> = {
  webp: 'createWebpEncoder',
  avif: 'createAvifEncoder',
  mozjpeg: 'createMozjpegEncoder',
  jxl: 'createJxlEncoder',
  oxipng: 'createOxipngOptimizer',
  png: 'createPngEncoder',
};

const FN: Record<CodecId, string> = {
  webp: 'encode',
  avif: 'encode',
  mozjpeg: 'encode',
  jxl: 'encode',
  oxipng: 'optimize',
  png: 'encode',
};

// ── token builders ─────────────────────────────────────────────────────────────

function valToken(val: unknown): Token {
  if (typeof val === 'boolean') return num(String(val));
  if (typeof val === 'number') return num(String(val));
  return str(`'${String(val)}'`);
}

function optBlock(options: Record<string, unknown>, indent = '  '): Token[][] {
  const entries = Object.entries(options);
  if (entries.length === 0) return [];
  return entries.map(([key, val], i) => [
    plain(indent),
    prop(key),
    pun(': '),
    valToken(val),
    ...(i < entries.length - 1 ? [pun(',')] : []),
  ]);
}

function importLine(names: string[]): Token[] {
  const inner = names.join(', ');
  return [
    kw('import'),
    plain(' '),
    pun('{'),
    plain(` ${inner} `),
    pun('}'),
    plain(' '),
    kw('from'),
    plain(' '),
    str("'@squoosh-kit/core'"),
    pun(';'),
  ];
}

/** Lines for a resize step, used across all snippet types. */
function resizeLines(
  ro: ResizeOptions,
  inputVar: string,
  outputVar: string
): Token[][] {
  const entries = Object.entries(ro).filter(([, v]) => v !== undefined) as [
    string,
    unknown,
  ][];
  return [
    [
      kw('const'),
      plain(` ${outputVar} `),
      pun('='),
      plain(' '),
      kw('await'),
      plain(' '),
      fn('resize.resize'),
      pun('('),
      plain(inputVar),
      pun(', '),
      pun('{'),
    ],
    ...entries.map(([key, val], i) => [
      plain('  '),
      prop(key),
      pun(': '),
      valToken(val),
      ...(i < entries.length - 1 ? [pun(',')] : []),
    ]),
    [pun('}'), pun(')')],
  ];
}

// ── snippet builders ───────────────────────────────────────────────────────────

function buildSimple(
  codecId: CodecId,
  options: Record<string, unknown>,
  resizeEnabled: boolean,
  resizeOptions: ResizeOptions
): Token[][] {
  const hasPng = codecId === 'png';
  const hasOpts = !hasPng && Object.keys(options).length > 0;
  const imports = resizeEnabled ? ['resize', codecId] : [codecId];
  const encodeInput = resizeEnabled ? 'resized' : 'imageInput';

  const lines: Token[][] = [importLine(imports), []];

  if (resizeEnabled) {
    const ro = Object.fromEntries(
      Object.entries(resizeOptions).filter(([, v]) => v !== undefined)
    );
    lines.push(...resizeLines(ro as ResizeOptions, 'imageInput', 'resized'));
    lines[lines.length - 1] = [...(lines[lines.length - 1] ?? []), pun(';')];
    lines.push([]);
  }

  lines.push([
    kw('const'),
    plain(' result '),
    pun('='),
    plain(' '),
    kw('await'),
    plain(' '),
    fn(`${codecId}.${FN[codecId]}`),
    pun('('),
    plain(encodeInput),
    ...(hasOpts ? [pun(', '), pun('{')] : hasPng ? [] : [pun(')')]),
  ]);

  if (hasOpts) {
    lines.push(...optBlock(options));
    lines.push([pun('}'), pun(')')]);
  }

  lines[lines.length - 1] = [...(lines[lines.length - 1] ?? []), pun(';')];
  return lines;
}

function buildAdvanced(
  codecId: CodecId,
  options: Record<string, unknown>,
  resizeEnabled: boolean,
  resizeOptions: ResizeOptions
): Token[][] {
  const factory = FACTORY[codecId];
  const hasPng = codecId === 'png';
  const hasOpts = !hasPng && Object.keys(options).length > 0;
  const imports = resizeEnabled ? ['resize', codecId] : [codecId];
  const encodeInput = resizeEnabled ? 'resized' : 'imageInput';

  const lines: Token[][] = [importLine(imports), []];

  if (resizeEnabled) {
    lines.push([
      kw('const'),
      plain(' resizer '),
      pun('='),
      plain(' '),
      fn('resize.createResizer'),
      pun("('worker',"),
      plain(' '),
      pun('{'),
      plain(' '),
      prop('assetPath'),
      pun(': '),
      str("'/squoosh-kit'"),
      plain(' '),
      pun('});'),
    ]);
  }

  lines.push(
    [
      kw('const'),
      plain(' encoder '),
      pun('='),
      plain(' '),
      fn(`${codecId}.${factory}`),
      pun("('worker',"),
      plain(' '),
      pun('{'),
      plain(' '),
      prop('assetPath'),
      pun(': '),
      str("'/squoosh-kit'"),
      plain(' '),
      pun('});'),
    ],
    [],
    [
      kw('const'),
      plain(' controller '),
      pun('='),
      plain(' '),
      kw('new'),
      plain(' '),
      fn('AbortController'),
      pun('();'),
    ],
    []
  );

  if (resizeEnabled) {
    const ro = Object.fromEntries(
      Object.entries(resizeOptions).filter(([, v]) => v !== undefined)
    );
    const resLines = resizeLines(ro as ResizeOptions, 'imageInput', 'resized');
    resLines[0] = [
      kw('const'),
      plain(' resized '),
      pun('='),
      plain(' '),
      kw('await'),
      plain(' '),
      fn('resizer'),
      pun('('),
      plain('imageInput'),
      pun(', '),
      pun('{'),
    ];
    resLines.push([pun('},'), plain(' controller.signal'), pun(')')]);
    resLines[resLines.length - 1] = [
      ...(resLines[resLines.length - 1] ?? []),
      pun(';'),
    ];
    lines.push(...resLines, []);
  }

  lines.push([
    kw('const'),
    plain(' result '),
    pun('='),
    plain(' '),
    kw('await'),
    plain(' '),
    fn('encoder'),
    pun('('),
    plain(encodeInput),
    ...(hasOpts
      ? [pun(', '), pun('{')]
      : hasPng
        ? [pun(', '), plain('controller.signal'), pun(')')]
        : [pun(', '), plain('controller.signal'), pun(')')]),
  ]);

  if (hasOpts) {
    lines.push(...optBlock(options));
    lines.push([pun('},'), plain(' controller.signal'), pun(')')]);
  }
  lines[lines.length - 1] = [...(lines[lines.length - 1] ?? []), pun(';')];

  lines.push(
    [],
    [cmt('// reuse for multiple images, then clean up:')],
    ...((resizeEnabled
      ? [[kw('await'), plain(' '), fn('resizer.terminate'), pun('();')]]
      : []) as Token[][]),
    [kw('await'), plain(' '), fn('encoder.terminate'), pun('();')]
  );

  return lines;
}

function buildRuntimes(
  codecId: CodecId,
  options: Record<string, unknown>,
  resizeEnabled: boolean,
  resizeOptions: ResizeOptions
): Token[][] {
  const hasPng = codecId === 'png';
  const hasOpts = !hasPng && Object.keys(options).length > 0;
  const factory = FACTORY[codecId];
  const imports = resizeEnabled ? ['resize', codecId] : [codecId];
  const encodeInput = resizeEnabled ? 'resized' : 'imageInput';

  const ro = resizeEnabled
    ? (Object.fromEntries(
        Object.entries(resizeOptions).filter(([, v]) => v !== undefined)
      ) as ResizeOptions)
    : null;

  // ─ Node / Bun ──────────────────────────────────────────────────────────────
  const nodeLines: Token[][] = [
    [cmt('// ─── Node.js / Bun ──────────────────────────────────────')],
    importLine(imports),
    [],
  ];

  if (ro) {
    const rl = resizeLines(ro, 'imageInput', 'resized');
    rl[rl.length - 1] = [...(rl[rl.length - 1] ?? []), pun(';')];
    nodeLines.push(...rl, []);
  }

  nodeLines.push([
    kw('const'),
    plain(' result '),
    pun('='),
    plain(' '),
    kw('await'),
    plain(' '),
    fn(`${codecId}.${FN[codecId]}`),
    pun('('),
    plain(encodeInput),
    ...(hasOpts ? [pun(', '), pun('{')] : hasPng ? [] : [pun(')')]),
  ]);
  if (hasOpts) {
    nodeLines.push(...optBlock(options));
    nodeLines.push([pun('}'), pun(')')]);
  }
  nodeLines[nodeLines.length - 1] = [
    ...(nodeLines[nodeLines.length - 1] ?? []),
    pun(';'),
  ];

  // ─ Browser ─────────────────────────────────────────────────────────────────
  const browserLines: Token[][] = [
    [],
    [cmt('// ─── Browser (Vite) ─────────────────────────────────────')],
  ];

  if (ro) {
    browserLines.push([
      kw('const'),
      plain(' resizer '),
      pun('='),
      plain(' '),
      fn('resize.createResizer'),
      pun("('worker',"),
      plain(' '),
      pun('{'),
      plain(' '),
      prop('assetPath'),
      pun(': '),
      str("'/squoosh-kit'"),
      plain(' '),
      pun('});'),
    ]);
  }

  browserLines.push(
    [
      kw('const'),
      plain(' encoder '),
      pun('='),
      plain(' '),
      fn(`${codecId}.${factory}`),
      pun("('worker',"),
      plain(' '),
      pun('{'),
      plain(' '),
      prop('assetPath'),
      pun(': '),
      str("'/squoosh-kit'"),
      plain(' '),
      pun('});'),
    ],
    [
      kw('const'),
      plain(' signal '),
      pun('='),
      plain(' '),
      pun('('),
      kw('new'),
      plain(' '),
      fn('AbortController'),
      pun(')'),
      pun('.signal;'),
    ],
    []
  );

  if (ro) {
    const rl = resizeLines(ro, 'imageInput', 'resized');
    rl[0] = [
      kw('const'),
      plain(' resized '),
      pun('='),
      plain(' '),
      kw('await'),
      plain(' '),
      fn('resizer'),
      pun('('),
      plain('imageInput'),
      pun(', '),
      pun('{'),
    ];
    rl.push([pun('},'), plain(' signal'), pun(')')]);
    rl[rl.length - 1] = [...(rl[rl.length - 1] ?? []), pun(';')];
    browserLines.push(...rl, []);
  }

  browserLines.push([
    kw('const'),
    plain(' result '),
    pun('='),
    plain(' '),
    kw('await'),
    plain(' '),
    fn('encoder'),
    pun('('),
    plain(encodeInput),
    ...(hasOpts
      ? [pun(', '), pun('{')]
      : hasPng
        ? [pun(', '), plain('signal'), pun(')')]
        : [pun(', '), plain('signal'), pun(')')]),
  ]);

  if (hasOpts) {
    browserLines.push(...optBlock(options));
    browserLines.push([pun('},'), plain(' signal'), pun(')')]);
  }
  browserLines[browserLines.length - 1] = [
    ...(browserLines[browserLines.length - 1] ?? []),
    pun(';'),
  ];

  if (ro) {
    browserLines.push([
      kw('await'),
      plain(' '),
      fn('resizer.terminate'),
      pun('();'),
    ]);
  }
  browserLines.push([
    kw('await'),
    plain(' '),
    fn('encoder.terminate'),
    pun('();'),
  ]);

  return [...nodeLines, ...browserLines];
}

// ── tab types ──────────────────────────────────────────────────────────────────

type Tab = 'simple' | 'advanced' | 'runtimes';
const TABS: { id: Tab; label: string }[] = [
  { id: 'simple', label: 'Simple' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'runtimes', label: 'Runtimes' },
];

// ── component ──────────────────────────────────────────────────────────────────

type Props = {
  state: AppState;
  dispatch: Dispatch<Action>;
  onSetCodec: (codecId: CodecId) => void;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function compressionRatio(original: number, compressed: number): string {
  const ratio = ((original - compressed) / original) * 100;
  return ratio >= 0
    ? `↓${ratio.toFixed(1)}%`
    : `↑${Math.abs(ratio).toFixed(1)}%`;
}

// ── CodePanel ──────────────────────────────────────────────────────────────────

type CodePanelProps = {
  codecId: CodecId;
  codecOptions: Record<string, unknown>;
  resizeEnabled: boolean;
  resizeOptions: ResizeOptions;
  onReset: () => void;
};

export function CodePanel({
  codecId,
  codecOptions,
  resizeEnabled,
  resizeOptions,
  onReset,
}: CodePanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('simple');

  const lines =
    activeTab === 'simple'
      ? buildSimple(codecId, codecOptions, resizeEnabled, resizeOptions)
      : activeTab === 'advanced'
        ? buildAdvanced(codecId, codecOptions, resizeEnabled, resizeOptions)
        : buildRuntimes(codecId, codecOptions, resizeEnabled, resizeOptions);

  return (
    <div className="h-full md:h-[300px] flex flex-col md:grow min-w-0 md:max-w-200 border-r border-white/10 overflow-hidden bg-gray-900 md:rounded-lg">
      {/* Tab bar */}
      <div className="flex items-center border-b border-white/10 shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-4 py-2 text-xs font-mono transition-colors
              ${
                activeTab === tab.id
                  ? 'text-white border-b border-white -mb-px'
                  : 'text-white/40 hover:text-white/70'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
        <div className="ml-auto pr-2">
          <button
            onClick={onReset}
            title="Upload new image"
            className="p-1 rounded text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Code */}
      <div className="flex-1 overflow-hidden p-3 min-h-0">
        <pre
          key={activeTab}
          className="code-fade h-full overflow-y-auto text-xs font-mono leading-relaxed rounded-lg px-4 py-3 bg-gray-950"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.15) transparent',
          }}
        >
          {lines.map((line, li) => (
            <div key={li}>
              {line.length === 0
                ? '\u00a0'
                : line.map((tok, ti) => (
                    <span key={ti} style={{ color: tok.color }}>
                      {tok.text}
                    </span>
                  ))}
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

// ── SettingsPanel ──────────────────────────────────────────────────────────────

type SettingsPanelProps = {
  state: AppState;
  dispatch: Dispatch<Action>;
  onSetCodec: (codecId: CodecId) => void;
};

export function SettingsPanel({
  state,
  dispatch,
  onSetCodec,
}: SettingsPanelProps) {
  const {
    sourceFile,
    imageInput,
    encodeResult,
    encodeError,
    codecId,
    codecOptions,
    resizeEnabled,
    resizeOptions,
    phase,
  } = state;
  const isEncoding = phase === 'encoding';

  return (
    <div className="flex flex-col gap-3 px-5 py-4 w-full md:w-72 md:flex-shrink-0 overflow-y-auto">
      <div className="flex items-center gap-3">
        <FormatSelector value={codecId} onChange={onSetCodec} />

        <div className="ml-auto text-right">
          {isEncoding ? (
            <svg
              className="animate-spin h-5 w-5 text-white/80 ml-auto"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : encodeResult ? (
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-white">
                {formatBytes(encodeResult.sizeBytes)}
              </span>
              {sourceFile && (
                <span className="text-xs text-white/70">
                  {compressionRatio(sourceFile.size, encodeResult.sizeBytes)}
                </span>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <OptionsPanel
        codecId={codecId}
        options={codecOptions}
        onChange={(patch) => dispatch({ type: 'SET_OPTIONS', options: patch })}
      />

      <div className="border-t border-white/20 pt-3">
        <ResizePanel
          enabled={resizeEnabled}
          options={resizeOptions}
          originalWidth={imageInput?.width ?? 0}
          originalHeight={imageInput?.height ?? 0}
          onToggle={(enabled) =>
            dispatch({ type: 'SET_RESIZE_ENABLED', enabled })
          }
          onChange={(options) =>
            dispatch({ type: 'SET_RESIZE_OPTIONS', options })
          }
        />
      </div>

      {encodeError && (
        <div className="text-xs text-white bg-white/20 border border-white/30 rounded px-2 py-1.5 break-words">
          {encodeError}
        </div>
      )}

      <div className="mt-auto pt-1">
        <DownloadButton
          bytes={encodeResult?.bytes ?? null}
          codecId={codecId}
          sourceFileName={sourceFile?.name ?? null}
        />
      </div>
    </div>
  );
}

// ── BottomPanel (desktop) ──────────────────────────────────────────────────────

export default function BottomPanel({ state, dispatch, onSetCodec }: Props) {
  function handleReset() {
    dispatch({ type: 'RESET' });
  }

  return (
    <div
      className="flex gap-4 justify-center text-white p-4"
      style={{ background: '#09f' }}
    >
      <CodePanel
        codecId={state.codecId}
        codecOptions={state.codecOptions}
        resizeEnabled={state.resizeEnabled}
        resizeOptions={state.resizeOptions}
        onReset={handleReset}
      />
      <SettingsPanel state={state} dispatch={dispatch} onSetCodec={onSetCodec} />
    </div>
  );
}
