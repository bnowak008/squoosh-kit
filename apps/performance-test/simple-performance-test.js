#!/usr/bin/env bun

/**
 * Simple performance test using individual packages
 */

import { encode } from '@squoosh-kit/webp';
import { resize } from '@squoosh-kit/resize';
import curdisImage from './curdis.webp';

// Load the actual WebP file
const imageBuffer = await Bun.file(curdisImage).arrayBuffer();
const testImageData = new Uint8ClampedArray(imageBuffer);
const width = 1080;
const height = 1920;

console.log(`📁 Loaded WebP file: ${(imageBuffer.byteLength / 1024).toFixed(2)} KB`);

const testImage = {
  data: testImageData,
  width,
  height
};

console.log(`📊 Created test image with same dimensions as your WebP: ${width}x${height}`);

console.log('🚀 Simple Performance Test - Squoosh Lite Optimizations');
console.log('=======================================================');
console.log(`Test image: ${testImage.width}x${testImage.height} (${(testImage.data.length / 1024 / 1024).toFixed(2)} MB)`);
console.log('');

async function runTest() {
  const controller = new AbortController();
  
  try {
    // Test resize performance
    console.log('📏 Testing resize performance...');
    const resizeStart = performance.now();
  
    const resized = await resize(testImage, {
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
    const originalSize = testImage.data.length;
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
