#!/usr/bin/env node

/**
 * Advanced Snipping Tool - Icon Generator
 * Converts SVG icons to PNG format in various sizes
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

class IconGenerator {
  constructor() {
    this.iconsDir = path.join(__dirname, 'icons');
    this.sizes = [16, 32, 48, 128];
  }

  async generateIcons() {
    console.log('🎨 Generating PNG icons from SVG...\n');

    // Base SVG content - modern snipping tool icon
    const baseSvg = `<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#14b8a6;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#0891b2;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#06b6d4;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.3"/>
    </filter>
  </defs>
  
  <!-- Main background circle -->
  <circle cx="64" cy="64" r="58" fill="url(#gradient)" stroke="#0f766e" stroke-width="2" filter="url(#shadow)"/>
  
  <!-- Scissors/Snipping tool icon -->
  <g transform="translate(64,64)">
    <!-- Scissors handles -->
    <circle cx="-15" cy="-15" r="8" fill="white" opacity="0.9"/>
    <circle cx="15" cy="-15" r="8" fill="white" opacity="0.9"/>
    
    <!-- Scissors blades -->
    <path d="M -15,-15 L 0,10 L 15,-15" stroke="white" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M -15,-15 L -5,0" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M 15,-15 L 5,0" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/>
    
    <!-- Screen/selection area -->
    <rect x="-20" y="5" width="40" height="25" rx="3" fill="white" opacity="0.8" stroke="#14b8a6" stroke-width="1"/>
    <rect x="-15" y="10" width="12" height="8" fill="#14b8a6" opacity="0.6"/>
    <rect x="3" y="10" width="12" height="8" fill="#0891b2" opacity="0.6"/>
    
    <!-- Dotted selection lines -->
    <path d="M -20,15 L 20,15" stroke="#0f766e" stroke-width="1" stroke-dasharray="2,2" opacity="0.7"/>
    <path d="M -20,20 L 20,20" stroke="#0f766e" stroke-width="1" stroke-dasharray="2,2" opacity="0.7"/>
  </g>
</svg>`;

    // Generate PNG files for each size
    for (const size of this.sizes) {
      try {
        const svgBuffer = Buffer.from(baseSvg);
        const pngPath = path.join(this.iconsDir, `icon${size}.png`);
        
        await sharp(svgBuffer)
          .resize(size, size)
          .png({
            quality: 100,
            compressionLevel: 9
          })
          .toFile(pngPath);
        
        console.log(`✓ Generated icon${size}.png (${size}x${size})`);
      } catch (error) {
        console.error(`✗ Failed to generate icon${size}.png:`, error.message);
      }
    }

    console.log('\n🎉 Icon generation complete!');
  }

  async validateIcons() {
    console.log('\n🔍 Validating generated icons...');
    
    for (const size of this.sizes) {
      const iconPath = path.join(this.iconsDir, `icon${size}.png`);
      
      if (fs.existsSync(iconPath)) {
        const stats = fs.statSync(iconPath);
        if (stats.size > 10) { // More than 10 bytes indicates a real PNG
          console.log(`✓ icon${size}.png - ${stats.size} bytes`);
        } else {
          console.log(`✗ icon${size}.png - File too small (${stats.size} bytes)`);
        }
      } else {
        console.log(`✗ icon${size}.png - File not found`);
      }
    }
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new IconGenerator();
  generator.generateIcons()
    .then(() => generator.validateIcons())
    .catch(console.error);
}

module.exports = IconGenerator;