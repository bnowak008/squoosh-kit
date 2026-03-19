import type { CodecId } from '../types';
import { CODECS } from '../codec/registry';

type Props = {
  value: CodecId;
  onChange: (id: CodecId) => void;
};

export default function FormatSelector({ value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as CodecId)}
      className="
        bg-white/20 text-white border border-white/30 rounded-lg
        px-3 py-2 text-sm font-semibold
        focus:outline-none focus:border-white/60
        cursor-pointer
      "
    >
      {CODECS.map((codec) => (
        <option key={codec.id} value={codec.id}>
          {codec.label}
        </option>
      ))}
    </select>
  );
}
