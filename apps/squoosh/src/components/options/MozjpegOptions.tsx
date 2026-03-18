import Slider from './Slider';

type MozjpegOpts = {
  quality: number;
  progressive: boolean;
};

type Props = {
  options: MozjpegOpts;
  onChange: (patch: Partial<MozjpegOpts>) => void;
};

export default function MozjpegOptions({ options, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <Slider
        label="Quality"
        min={0}
        max={100}
        value={options.quality}
        onChange={(v) => onChange({ quality: v })}
      />
      <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
        <input
          type="checkbox"
          checked={options.progressive}
          onChange={(e) => onChange({ progressive: e.target.checked })}
          className="accent-blue-500"
        />
        Progressive
      </label>
    </div>
  );
}
