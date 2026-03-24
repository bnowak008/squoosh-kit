import type { CodecId } from '../types';
import { getCodec } from '../codec/registry';

type Props = {
  bytes: Uint8Array | null;
  codecId: CodecId;
  sourceFileName: string | null;
};

export default function DownloadButton({
  bytes,
  codecId,
  sourceFileName,
}: Props) {
  function handleDownload() {
    if (!bytes || !sourceFileName) return;

    const codec = getCodec(codecId);
    const blob = new Blob([bytes.buffer as ArrayBuffer], {
      type: codec.mimeType,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = sourceFileName.replace(/\.[^.]+$/, codec.ext);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleDownload}
      disabled={!bytes}
      className="
        flex items-center gap-2 px-4 py-2 rounded-lg
        bg-white hover:bg-white/90 active:bg-white/80
        text-[#09f] text-sm font-semibold
        disabled:opacity-40 disabled:cursor-not-allowed
        transition-colors
      "
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
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      Download
    </button>
  );
}
