import Slider from './Slider';

type AvifOpts = {
  quality: number;
  speed: number;
};

type Props = {
  options: AvifOpts;
  onChange: (patch: Partial<AvifOpts>) => void;
};

export default function AvifOptions({ options, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <Slider
        label="Quality"
        min={1}
        max={63}
        value={options.quality}
        onChange={(v) => onChange({ quality: v })}
      />
      <Slider
        label="Speed"
        min={0}
        max={10}
        value={options.speed}
        onChange={(v) => onChange({ speed: v })}
      />
    </div>
  );
}
