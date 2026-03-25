import Slider from './Slider';

type OxipngOpts = {
  level: number;
  interlace: boolean;
};

type Props = {
  options: OxipngOpts;
  onChange: (patch: Partial<OxipngOpts>) => void;
};

export default function OxipngOptions({ options, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <Slider
        label="Optimization level"
        min={0}
        max={6}
        value={options.level}
        onChange={(v) => onChange({ level: v })}
      />
      <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
        <input
          type="checkbox"
          checked={options.interlace}
          onChange={(e) => onChange({ interlace: e.target.checked })}
          className="accent-white"
        />
        Interlace
      </label>
    </div>
  );
}
