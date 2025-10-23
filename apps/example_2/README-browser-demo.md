# @squoosh-kit/core Browser Demo

This HTML demo showcases the @squoosh-kit/core library running in a browser environment, demonstrating both WebP encoding and image resizing capabilities.

## Features

- **File Upload**: Select any image file (JPEG, PNG, WebP, etc.)
- **Real-time Processing**: Resize and encode images with live preview
- **Mode Selection**: Choose between Web Worker mode (recommended) and Client mode
- **Customizable Options**:
  - WebP quality (1-100)
  - Lossless encoding option
  - Resize dimensions (width/height)
  - Premultiply alpha option
  - Linear RGB option
- **Performance Metrics**: View processing times and compression ratios
- **Download**: Save processed WebP files

## Browser Compatibility

The demo requires:

- Modern browser with WebAssembly support
- ES modules support (ESM)
- Web Workers support (for worker mode)

Tested browsers:

- Chrome 80+
- Firefox 78+
- Safari 14+
- Edge 80+

## Usage

### Quick Start

1. **Build the project** (required for the demo to work):

   ```bash
   bun run build
   ```

2. **Start the development server**:

   ```bash
   # Using the custom Bun server (recommended)
   bun examples/browser.ts

   # Alternative: Using Python 3
   python3 -m http.server 8000

   # Alternative: Using Node.js
   npx serve .
   ```

3. **Open the demo** in your browser:
   ```
   http://localhost:8000
   ```

### Important Notes

- **Don't run `bun examples/browser-demo.html`** - HTML files aren't scripts and Bun can't execute them directly
- **Use an HTTP server** - The WebAssembly modules require proper HTTP serving for CORS and module loading
- **Build first** - The `dist/` folder must exist before running the demo

### Troubleshooting

**MIME Type Errors** (`text/html` instead of JavaScript):

- **Custom Bun server**: Use `bun examples/browser.ts` (handles MIME types correctly)
- **Python**: Use `python3 -m http.server 8000` (default is usually correct)
- **Node.js serve**: Install with `npm install -g serve` then run `serve -s .`
- **Alternative**: Use a proper development server like Vite or Parcel

**Import/CORS Errors**:

- Ensure you're accessing via `http://` not `file://`
- Check that the `dist/` folder exists (run `bun run build` if not)
- Verify all files in `wasm/` directory are accessible
- Try a different port if 8000 is blocked

## How It Works

### Processing Pipeline

1. **Image Selection**: User selects an image file
2. **Canvas Extraction**: Image is drawn to a canvas to extract raw pixel data
3. **Resize Operation**: Image is resized using the specified dimensions and options
4. **WebP Encoding**: Resized image is encoded to WebP format
5. **Preview & Download**: Results are displayed and can be downloaded

### Execution Modes

#### Worker Mode (Recommended)

- Processing happens in a background Web Worker
- UI remains responsive during heavy processing
- Better performance for large images
- Requires WebAssembly modules to be served with proper MIME types

#### Client Mode

- Processing happens in the main thread
- May block the UI during processing
- Useful for debugging or when Web Workers aren't available
- Simpler setup but less performant

## API Usage Example

The demo uses the same API as the Node.js/Bun example:

```javascript
import { createWebpEncoder, createResizer } from '@squoosh-kit/core';

// Create encoders
const encoder = createWebpEncoder('worker'); // or 'client'
const resizer = createResizer('worker'); // or 'client'

// Process an image
const controller = new AbortController();

try {
  // Resize image
  const resized = await resizer(controller.signal, imageData, {
    width: 400,
    height: 300,
  });

  // Encode to WebP
  const webpData = await encoder(controller.signal, resized, { quality: 85 });

  console.log(`WebP size: ${webpData.length} bytes`);
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Operation was cancelled');
  } else {
    console.error('Processing error:', error);
  }
}
```

## Troubleshooting

### WebAssembly Loading Issues

If you see errors related to WebAssembly loading:

- Ensure you're serving files through HTTP/HTTPS (not file://)
- Check that the server sets proper MIME types for .wasm files
- Verify all files in the `wasm/` directory are accessible

### Worker Creation Errors

If Web Worker creation fails:

- Switch to 'client' mode in the demo
- Ensure your server supports module workers
- Check browser console for detailed error messages

### Large Image Processing

For very large images:

- Use Worker mode for better performance
- Consider reducing resize dimensions
- Monitor browser memory usage

## Performance Tips

1. **Use Worker Mode**: Offloads processing to background threads
2. **Optimize Resize Dimensions**: Smaller outputs process faster
3. **Batch Operations**: Process multiple images in sequence rather than parallel
4. **Monitor Memory**: Large images may require significant memory

## License

This demo is part of the @squoosh-kit/core project and follows the same license terms.
