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
        bg-gray-800 text-white border border-gray-600 rounded-lg
        px-3 py-2 text-sm font-medium
        focus:outline-none focus:border-blue-500
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
