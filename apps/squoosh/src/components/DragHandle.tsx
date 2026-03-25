type Props = {
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
};

export default function DragHandle({ onPointerDown }: Props) {
  return (
    <div
      className="absolute top-0 bottom-0 z-10 flex items-center justify-center cursor-col-resize group"
      style={{
        left: 'calc(var(--split, 50%) - 12px)',
        width: '24px',
        touchAction: 'none',
      }}
      onPointerDown={onPointerDown}
    >
      {/* Visible bar */}
      <div className="w-1 h-full bg-white/20 group-hover:bg-white/40 group-active:bg-white/60 transition-colors" />

      {/* Handle grip */}
      <div className="absolute flex flex-col gap-1 items-center">
        <div className="w-6 h-6 rounded-full bg-white/90 shadow-lg flex items-center justify-center">
          <svg
            className="w-3.5 h-3.5 text-gray-700"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M7 4a1 1 0 011-1h1a1 1 0 010 2H8a1 1 0 01-1-1zM7 10a1 1 0 011-1h1a1 1 0 010 2H8a1 1 0 01-1-1zM7 16a1 1 0 011-1h1a1 1 0 010 2H8a1 1 0 01-1-1zM11 4a1 1 0 011-1h1a1 1 0 010 2h-1a1 1 0 01-1-1zM11 10a1 1 0 011-1h1a1 1 0 010 2h-1a1 1 0 01-1-1zM11 16a1 1 0 011-1h1a1 1 0 010 2h-1a1 1 0 01-1-1z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
