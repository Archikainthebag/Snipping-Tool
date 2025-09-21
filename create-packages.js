#!/usr/bin/env node

/**
 * Advanced Snipping Tool - Package Creator
 * Creates downloadable extension packages for Chrome and Firefox
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

class PackageCreator {
  constructor() {
    this.sourceDir = __dirname;
    this.outputDir = path.join(__dirname, 'packages');
    this.tempDir = path.join(__dirname, 'temp');
    
    // Files to include in packages
    this.coreFiles = [
      'manifest.json',
      'background.js',
      'content.js',
      'styles.css',
      'popup.html',
      'popup.css',
      'popup.js',
      'icons/icon16.png',
      'icons/icon32.png',
      'icons/icon48.png',
      'icons/icon128.png',
      'LICENSE',
      'README.md'
    ];
  }

  async init() {
    console.log('🚀 Creating Advanced Snipping Tool packages...\n');
    
    // Create directories
    this.ensureDirectories();
    
    // Create packages
    await this.createChromePackage();
    await this.createFirefoxPackage();
    
    // Create installation guides
    this.createInstallationGuides();
    
    console.log('\n✅ All packages created successfully!');
    console.log(`📁 Output directory: ${this.outputDir}`);
  }

  ensureDirectories() {
    [this.outputDir, this.tempDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async createChromePackage() {
    console.log('📦 Creating Chrome/Edge package...');
    
    const packagePath = path.join(this.outputDir, 'advanced-snipping-tool-chrome.zip');
    const output = fs.createWriteStream(packagePath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    return new Promise((resolve, reject) => {
      output.on('close', () => {
        console.log(`   ✓ Chrome package: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
        resolve();
      });
      
      archive.on('error', reject);
      archive.pipe(output);
      
      // Add core files
      this.coreFiles.forEach(file => {
        const filePath = path.join(this.sourceDir, file);
        if (fs.existsSync(filePath)) {
          if (fs.statSync(filePath).isDirectory()) {
            archive.directory(filePath, file);
          } else {
            archive.file(filePath, { name: file });
          }
        }
      });
      
      // Add Chrome-specific installation guide
      archive.append(this.getChromeInstallGuide(), { name: 'INSTALLATION-GUIDE.txt' });
      
      archive.finalize();
    });
  }

  async createFirefoxPackage() {
    console.log('📦 Creating Firefox package...');
    
    const packagePath = path.join(this.outputDir, 'advanced-snipping-tool-firefox.zip');
    const output = fs.createWriteStream(packagePath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    return new Promise((resolve, reject) => {
      output.on('close', () => {
        console.log(`   ✓ Firefox package: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
        resolve();
      });
      
      archive.on('error', reject);
      archive.pipe(output);
      
      // Add core files (except manifest.json which we'll modify)
      this.coreFiles.forEach(file => {
        if (file === 'manifest.json') return; // Handle separately
        
        const filePath = path.join(this.sourceDir, file);
        if (fs.existsSync(filePath)) {
          if (fs.statSync(filePath).isDirectory()) {
            archive.directory(filePath, file);
          } else {
            archive.file(filePath, { name: file });
          }
        }
      });
      
      // Add Firefox-specific manifest
      const firefoxManifest = this.createFirefoxManifest();
      archive.append(JSON.stringify(firefoxManifest, null, 2), { name: 'manifest.json' });
      
      // Add Firefox-specific installation guide
      archive.append(this.getFirefoxInstallGuide(), { name: 'INSTALLATION-GUIDE.txt' });
      
      archive.finalize();
    });
  }

  createFirefoxManifest() {
    const originalManifest = JSON.parse(
      fs.readFileSync(path.join(this.sourceDir, 'manifest.json'), 'utf8')
    );
    
    // Firefox-specific modifications
    const firefoxManifest = {
      ...originalManifest,
      browser_specific_settings: {
        gecko: {
          id: "advanced-snipping-tool@extension.com",
          strict_min_version: "109.0"
        }
      }
    };
    
    return firefoxManifest;
  }

  getChromeInstallGuide() {
    return `Advanced Snipping Tool - Chrome/Edge Installation Guide
=======================================================

🚀 EASY INSTALLATION (No technical skills required!)

STEP 1: Extract Files
   1. Right-click the downloaded ZIP file
   2. Select "Extract All" or "Extract Here"
   3. Choose a folder on your computer (e.g., Desktop/SnippingTool)

STEP 2: Install Extension
   1. Open Chrome or Edge browser
   2. Type chrome://extensions/ in the address bar (or edge://extensions/)
   3. Press Enter
   4. Turn ON "Developer mode" (toggle switch in top-right corner)
   5. Click "Load unpacked" button
   6. Select the folder where you extracted the files
   7. Click "Select Folder"

STEP 3: Pin Extension (Recommended)
   1. Click the puzzle piece icon (🧩) in your browser toolbar
   2. Find "Advanced Snipping Tool"
   3. Click the pin icon to keep it visible

🎉 DONE! You can now use the snipping tool!

HOW TO USE:
   • Press Ctrl+Shift+S to start snipping
   • Click and drag to select an area
   • Choose to save to clipboard or download

NEED HELP?
   Visit: https://github.com/Archikainthebag/Snipping-Tool

🛡️ SAFETY GUARANTEE:
   ✓ 100% safe and secure
   ✓ No data collection or tracking
   ✓ All processing happens locally on your computer
   ✓ Open source code available for review
`;
  }

  getFirefoxInstallGuide() {
    return `Advanced Snipping Tool - Firefox Installation Guide
====================================================

🚀 EASY INSTALLATION (No technical skills required!)

STEP 1: Extract Files
   1. Right-click the downloaded ZIP file
   2. Select "Extract All" or "Extract Here"
   3. Choose a folder on your computer (e.g., Desktop/SnippingTool)

STEP 2: Install Extension (Temporary)
   1. Open Firefox browser
   2. Type about:debugging in the address bar
   3. Press Enter
   4. Click "This Firefox" on the left side
   5. Click "Load Temporary Add-on" button
   6. Navigate to the extracted folder
   7. Select ANY file from the folder (e.g., manifest.json)
   8. Click "Open"

IMPORTANT NOTE:
   This is a temporary installation that will be removed when Firefox restarts.
   For permanent installation, contact us for a signed version.

STEP 3: Using the Extension
   The extension icon will appear in your toolbar automatically.

🎉 DONE! You can now use the snipping tool!

HOW TO USE:
   • Press Ctrl+Shift+S to start snipping
   • Click and drag to select an area
   • Choose to save to clipboard or download

NEED HELP?
   Visit: https://github.com/Archikainthebag/Snipping-Tool

🛡️ SAFETY GUARANTEE:
   ✓ 100% safe and secure
   ✓ No data collection or tracking
   ✓ All processing happens locally on your computer
   ✓ Open source code available for review
`;
  }

  createInstallationGuides() {
    console.log('📝 Creating installation guides...');
    
    // Create a standalone installation guide
    const guideContent = `Advanced Snipping Tool - Complete Installation Guide
=====================================================

Choose your browser below for specific instructions:

🌐 CHROME & EDGE USERS:
${this.getChromeInstallGuide()}

🦊 FIREFOX USERS:
${this.getFirefoxInstallGuide()}

📞 SUPPORT:
   If you need help, visit: https://github.com/Archikainthebag/Snipping-Tool/issues
   Or check our website: https://archikainthebag.github.io/Snipping-Tool/

Made with ❤️ for the web community
`;
    
    fs.writeFileSync(path.join(this.outputDir, 'COMPLETE-INSTALLATION-GUIDE.txt'), guideContent);
    console.log('   ✓ Complete installation guide created');
  }
}

// Check if running as script
if (require.main === module) {
  // Install required dependencies if not available
  try {
    require('archiver');
  } catch (error) {
    console.log('📦 Installing required dependencies...');
    const { execSync } = require('child_process');
    execSync('npm install archiver', { stdio: 'inherit' });
    console.log('✅ Dependencies installed!\n');
  }
  
  // Create packages
  const creator = new PackageCreator();
  creator.init().catch(console.error);
}

module.exports = PackageCreator;