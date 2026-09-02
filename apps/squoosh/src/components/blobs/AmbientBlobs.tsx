import { useMemo } from 'react';
import { AMBIENT_BLOB_COUNT, BLOB_COLOR, generateAmbientBlobs } from './config';

export default function AmbientBlobs() {
  const blobs = useMemo(() => generateAmbientBlobs(AMBIENT_BLOB_COUNT), []);

  return (
    <div style={{ pointerEvents: 'none' }}>
      {blobs.map((blob) => (
        <div
          key={blob.id}
          className="blob"
          style={{
            position: 'absolute',
            width: blob.size,
            height: blob.size,
            top: blob.top,
            left: blob.left,
            opacity: blob.opacity,
            animationDuration: blob.duration,
            animationDelay: blob.delay,
            backgroundColor: BLOB_COLOR,
            zIndex: 0,
          }}
        />
      ))}
    </div>
  );
}
