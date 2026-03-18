import Slider from './Slider';

type WebPOpts = {
  quality: number;
  lossless: number;
  method: number;
};

type Props = {
  options: WebPOpts;
  onChange: (patch: Partial<WebPOpts>) => void;
};

export default function WebPOptions({ options, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <Slider
        label="Quality"
        min={1}
        max={100}
        value={options.quality}
        onChange={(v) => onChange({ quality: v })}
      />
      <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
        <input
          type="checkbox"
          checked={options.lossless === 1}
          onChange={(e) => onChange({ lossless: e.target.checked ? 1 : 0 })}
          className="accent-blue-500"
        />
        Lossless
      </label>
      <Slider
        label="Method"
        min={0}
        max={6}
        value={options.method}
        onChange={(v) => onChange({ method: v })}
      />
    </div>
  );
}
