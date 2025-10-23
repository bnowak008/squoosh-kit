#!/usr/bin/env bun

/**
 * Performance test to demonstrate the optimizations
 */

import { encode, resize } from '../../packages/core/dist/index.js';

// Create a test image (1080x1920 RGBA)
const width = 1080;
const height = 1920;
const testImageData = new Uint8ClampedArray(width * height * 4);

// Fill with some test pattern
for (let i = 0; i < testImageData.length; i += 4) {
  const x = (i / 4) % width;
  const y = Math.floor((i / 4) / width);
  
  // Create a gradient pattern
  testImageData[i] = Math.floor((x / width) * 255);     // R
  testImageData[i + 1] = Math.floor((y / height) * 255); // G
  testImageData[i + 2] = Math.floor(((x + y) / (width + height)) * 255); // B
  testImageData[i + 3] = 255; // A
}

const testImage = {
  data: testImageData,
  width,
  height
};

console.log('🚀 Performance Test - Squoosh Lite Optimizations');
console.log('================================================');
console.log(`Test image: ${width}x${height} (${(testImageData.length / 1024 / 1024).toFixed(2)} MB)`);
console.log('');

async function runTest() {
  const controller = new AbortController();
  
  try {
    // Test resize performance
    console.log('📏 Testing resize performance...');
    const resizeStart = performance.now();
    
    const resized = await resize(controller.signal, testImage, {
      width: 1080,
      height: 1920,
      premultiply: false,
      linearRGB: false
    });
    
    const resizeEnd = performance.now();
    const resizeTime = resizeEnd - resizeStart;
    
    console.log(`✅ Resize completed in ${resizeTime.toFixed(2)}ms`);
    console.log(`   Output: ${resized.width}x${resized.height} (${(resized.data.length / 1024 / 1024).toFixed(2)} MB)`);
    console.log('');
    
    // Test WebP encoding performance
    console.log('🖼️  Testing WebP encoding performance...');
    const webpStart = performance.now();
    
    const webpData = await encode(controller.signal, resized, {
      quality: 85,
      lossless: false
    });
    
    const webpEnd = performance.now();
    const webpTime = webpEnd - webpStart;
    
    console.log(`✅ WebP encoding completed in ${webpTime.toFixed(2)}ms`);
    console.log(`   Output: ${(webpData.length / 1024).toFixed(2)} KB WebP`);
    console.log('');
    
    // Performance summary
    console.log('📊 Performance Summary');
    console.log('=====================');
    console.log(`Resize: ${resizeTime.toFixed(2)}ms`);
    console.log(`WebP encode: ${webpTime.toFixed(2)}ms`);
    console.log(`Total: ${(resizeTime + webpTime).toFixed(2)}ms`);
    console.log('');
    
    // Compression ratio
    const originalSize = testImageData.length;
    const compressedSize = webpData.length;
    const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
    
    console.log(`Compression: ${compressionRatio}% smaller than original`);
    console.log(`Size reduction: ${(originalSize / 1024 / 1024).toFixed(2)} MB → ${(compressedSize / 1024).toFixed(2)} KB`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTest();
