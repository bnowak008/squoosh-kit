import type { EncodeResult, CodecId } from '../types';
import { useSplitPane } from '../hooks/useSplitPane';
import ImagePane from './ImagePane';
import DragHandle from './DragHandle';

type Props = {
  sourceObjectUrl: string | null;
  encodeResult: EncodeResult | null;
  codecId: CodecId;
  isEncoding: boolean;
};

export default function SplitView({
  sourceObjectUrl,
  encodeResult,
  codecId,
  isEncoding,
}: Props) {
  const { containerRef, splitPercent, handlePointerDown } =
    useSplitPane(50);

  return (
    <div
      ref={containerRef}
      className="relative flex h-full overflow-hidden select-none"
      style={{ '--split': `${splitPercent}%` } as React.CSSProperties}
    >
      {/* Left pane — original */}
      <div
        className="flex-shrink-0 overflow-hidden"
        style={{ width: 'var(--split, 50%)' }}
      >
        <ImagePane
          objectUrl={sourceObjectUrl}
          label="Original"
          side="left"
        />
      </div>

      {/* Right pane — compressed */}
      <div className="flex-1 overflow-hidden">
        <ImagePane
          objectUrl={encodeResult?.objectUrl ?? null}
          codecId={codecId}
          encodedBytes={encodeResult?.bytes ?? null}
          label="Compressed"
          side="right"
          isEncoding={isEncoding}
        />
      </div>

      <DragHandle onPointerDown={handlePointerDown} />
    </div>
  );
}
