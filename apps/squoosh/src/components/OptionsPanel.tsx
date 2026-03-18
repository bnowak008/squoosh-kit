import type { CodecId } from '../types';
import WebPOptions from './options/WebPOptions';
import AvifOptions from './options/AvifOptions';
import MozjpegOptions from './options/MozjpegOptions';
import JxlOptions from './options/JxlOptions';
import OxipngOptions from './options/OxipngOptions';
import PngOptions from './options/PngOptions';

type Props = {
  codecId: CodecId;
  options: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
};

export default function OptionsPanel({ codecId, options, onChange }: Props) {
  switch (codecId) {
    case 'webp':
      return (
        <WebPOptions
          options={options as Parameters<typeof WebPOptions>[0]['options']}
          onChange={onChange}
        />
      );
    case 'avif':
      return (
        <AvifOptions
          options={options as Parameters<typeof AvifOptions>[0]['options']}
          onChange={onChange}
        />
      );
    case 'mozjpeg':
      return (
        <MozjpegOptions
          options={options as Parameters<typeof MozjpegOptions>[0]['options']}
          onChange={onChange}
        />
      );
    case 'jxl':
      return (
        <JxlOptions
          options={options as Parameters<typeof JxlOptions>[0]['options']}
          onChange={onChange}
        />
      );
    case 'oxipng':
      return (
        <OxipngOptions
          options={options as Parameters<typeof OxipngOptions>[0]['options']}
          onChange={onChange}
        />
      );
    case 'png':
      return <PngOptions />;
  }
}
