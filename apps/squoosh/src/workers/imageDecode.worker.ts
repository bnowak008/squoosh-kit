type DecodeRequest = {
  id: number;
  buffer: ArrayBuffer;
  mimeType: string;
};

type DecodeSuccess = {
  id: number;
  ok: true;
  width: number;
  height: number;
  pixelBuffer: ArrayBuffer;
};

type DecodeFailure = {
  id: number;
  ok: false;
  error: string;
};

function canUseCanvasDecode(): boolean {
  return (
    typeof createImageBitmap === 'function' &&
    typeof OffscreenCanvas !== 'undefined'
  );
}

async function createBitmapFromBuffer(
  buffer: ArrayBuffer,
  mimeType: string
): Promise<ImageBitmap> {
  const blobs = mimeType
    ? [new Blob([buffer], { type: mimeType }), new Blob([buffer])]
    : [new Blob([buffer])];

  let lastError: unknown = null;

  for (const blob of blobs) {
    try {
      return await createImageBitmap(blob);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

self.onmessage = async (event: MessageEvent<DecodeRequest>) => {
  const { id, buffer, mimeType } = event.data;

  if (!canUseCanvasDecode()) {
    const response: DecodeFailure = {
      id,
      ok: false,
      error: 'Worker canvas decode is not supported in this browser.',
    };
    self.postMessage(response);
    return;
  }

  try {
    const bitmap = await createBitmapFromBuffer(buffer, mimeType);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to create 2d context in decode worker.');
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixelBuffer = new ArrayBuffer(imageData.data.byteLength);
    new Uint8ClampedArray(pixelBuffer).set(imageData.data);
    const response: DecodeSuccess = {
      id,
      ok: true,
      width: imageData.width,
      height: imageData.height,
      pixelBuffer,
    };
    self.postMessage(response, { transfer: [pixelBuffer] });
  } catch (error) {
    const response: DecodeFailure = {
      id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(response);
  }
};
