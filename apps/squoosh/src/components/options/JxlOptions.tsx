import Slider from './Slider';

type JxlOpts = {
  quality: number;
  effort: number;
};

type Props = {
  options: JxlOpts;
  onChange: (patch: Partial<JxlOpts>) => void;
};

export default function JxlOptions({ options, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <Slider
        label="Quality"
        min={1}
        max={100}
        value={options.quality}
        onChange={(v) => onChange({ quality: v })}
      />
      <Slider
        label="Effort"
        min={1}
        max={9}
        value={options.effort}
        onChange={(v) => onChange({ effort: v })}
      />
    </div>
  );
}
