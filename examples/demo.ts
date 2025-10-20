#!/usr/bin/env bun

/**
 * Example: WebP encoding and resize pipeline
 * 
 * This example demonstrates:
 * 1. Creating a simple RGBA image
 * 2. Encoding it to WebP
 * 3. Creating another image and resizing it
 * 4. Encoding the resized image to WebP
 */

import { createWebpEncoder } from '../src/features/webp/index.ts';
import { createResizer } from '../src/features/resize/index.ts';

console.log('=== @squoosh-lite/core Example ===\n');

// Create encoder and resizer in client mode (faster for Bun)
const encoder = createWebpEncoder('client');
const resizer = createResizer('client');
const controller = new AbortController();

// Example 1: Create a simple gradient image and encode to WebP
async function exampleWebPEncoding() {
  console.log('Example 1: WebP Encoding');
  console.log('-------------------------');

  const width = 400;
  const height = 300;
  const data = new Uint8Array(width * height * 4);

  // Create a simple gradient
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      data[i] = Math.floor((x / width) * 255);     // R: horizontal gradient
      data[i + 1] = Math.floor((y / height) * 255); // G: vertical gradient
      data[i + 2] = 128;                            // B: constant
      data[i + 3] = 255;                            // A: opaque
    }
  }

  console.log(`Created ${width}x${height} gradient image`);

  // Encode to WebP
  console.log('Encoding to WebP (quality: 85)...');
  const startTime = performance.now();
  
  const webpData = await encoder(
    controller.signal,
    { data, width, height },
    { quality: 85 }
  );

  const endTime = performance.now();
  
  console.log(`✓ Encoded to WebP in ${(endTime - startTime).toFixed(2)}ms`);
  console.log(`  Output size: ${webpData.length} bytes (${(webpData.length / 1024).toFixed(2)} KB)`);
  
  // Save the file
  await Bun.write('examples/output-gradient.webp', webpData);
  console.log('✓ Saved to examples/output-gradient.webp\n');
}

// Example 2: Resize an image and encode
async function exampleResizeAndEncode() {
  console.log('Example 2: Resize + WebP Encoding');
  console.log('----------------------------------');

  // Create a larger test image (checkerboard pattern)
  const originalWidth = 800;
  const originalHeight = 600;
  const originalData = new Uint8Array(originalWidth * originalHeight * 4);

  const squareSize = 50;
  for (let y = 0; y < originalHeight; y++) {
    for (let x = 0; x < originalWidth; x++) {
      const i = (y * originalWidth + x) * 4;
      const isWhite = (Math.floor(x / squareSize) + Math.floor(y / squareSize)) % 2 === 0;
      const color = isWhite ? 255 : 64;
      originalData[i] = color;     // R
      originalData[i + 1] = color; // G
      originalData[i + 2] = color; // B
      originalData[i + 3] = 255;   // A
    }
  }

  console.log(`Created ${originalWidth}x${originalHeight} checkerboard image`);

  // Resize to 400x300
  console.log('Resizing to 400x300...');
  const resizeStartTime = performance.now();
  
  const resized = await resizer(
    controller.signal,
    { data: originalData, width: originalWidth, height: originalHeight },
    { width: 400, height: 300 }
  );

  const resizeEndTime = performance.now();
  
  console.log(`✓ Resized in ${(resizeEndTime - resizeStartTime).toFixed(2)}ms`);
  console.log(`  Output dimensions: ${resized.width}x${resized.height}`);

  // Encode resized image to WebP
  console.log('Encoding resized image to WebP (quality: 90)...');
  const encodeStartTime = performance.now();
  
  const webpData = await encoder(
    controller.signal,
    resized,
    { quality: 90 }
  );

  const encodeEndTime = performance.now();
  
  console.log(`✓ Encoded in ${(encodeEndTime - encodeStartTime).toFixed(2)}ms`);
  console.log(`  Output size: ${webpData.length} bytes (${(webpData.length / 1024).toFixed(2)} KB)`);
  
  // Save the file
  await Bun.write('examples/output-resized.webp', webpData);
  console.log('✓ Saved to examples/output-resized.webp\n');
}

// Example 3: Aspect ratio preservation
async function exampleAspectRatio() {
  console.log('Example 3: Resize with Aspect Ratio');
  console.log('------------------------------------');

  const originalWidth = 1920;
  const originalHeight = 1080;
  const originalData = new Uint8Array(originalWidth * originalHeight * 4);

  // Create a simple colored image
  for (let i = 0; i < originalData.length; i += 4) {
    originalData[i] = 100;     // R
    originalData[i + 1] = 150; // G
    originalData[i + 2] = 200; // B
    originalData[i + 3] = 255; // A
  }

  console.log(`Original size: ${originalWidth}x${originalHeight}`);

  // Resize to width 800, height auto-calculated
  console.log('Resizing to width=800 (aspect ratio preserved)...');
  
  const resized = await resizer(
    controller.signal,
    { data: originalData, width: originalWidth, height: originalHeight },
    { width: 800 } // height will be calculated as 450
  );

  console.log(`✓ Result dimensions: ${resized.width}x${resized.height}`);
  console.log(`  Aspect ratio maintained: ${originalWidth}/${originalHeight} = ${resized.width}/${resized.height}\n`);
}

// Run all examples
async function main() {
  try {
    await exampleWebPEncoding();
    await exampleResizeAndEncode();
    await exampleAspectRatio();
    
    console.log('=== All examples completed successfully! ===');
  } catch (error) {
    console.error('Error running examples:', error);
    process.exit(1);
  }
}

main();
