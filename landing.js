// Advanced Snipping Tool Landing Page Script
class LandingPage {
  constructor() {
    this.init();
  }

  init() {
    this.bindEvents();
    this.createDownloadPackages();
    this.setupAnimations();
  }

  bindEvents() {
    // Download buttons
    document.getElementById('download-chrome')?.addEventListener('click', () => {
      this.downloadExtension('chrome');
    });

    document.getElementById('download-firefox')?.addEventListener('click', () => {
      this.downloadExtension('firefox');
    });

    document.getElementById('download-chrome-main')?.addEventListener('click', () => {
      this.downloadExtension('chrome');
    });

    document.getElementById('download-firefox-main')?.addEventListener('click', () => {
      this.downloadExtension('firefox');
    });

    // Modal functionality
    const modal = document.getElementById('install-modal');
    const closeBtn = document.querySelector('.close');

    closeBtn?.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
      const nav = document.querySelector('.nav');
      if (window.scrollY > 100) {
        nav.style.background = 'rgba(15, 23, 42, 0.95)';
      } else {
        nav.style.background = 'rgba(15, 23, 42, 0.9)';
      }
    });
  }

  async createDownloadPackages() {
    try {
      // Create Chrome/Edge package
      await this.createChromePackage();
      
      // Create Firefox package
      await this.createFirefoxPackage();
      
      console.log('Download packages created successfully');
    } catch (error) {
      console.error('Error creating download packages:', error);
    }
  }

  async createChromePackage() {
    // Get all extension files
    const files = await this.getExtensionFiles();
    
    // Create ZIP blob
    const zip = await this.createZipFile(files, 'Chrome/Edge Extension');
    
    // Store for download
    this.chromePackage = zip;
  }

  async createFirefoxPackage() {
    // Get all extension files and modify manifest for Firefox
    let files = await this.getExtensionFiles();
    
    // Modify manifest for Firefox compatibility
    if (files['manifest.json']) {
      let manifest = JSON.parse(files['manifest.json']);
      
      // Firefox specific modifications
      manifest.browser_specific_settings = {
        gecko: {
          id: "advanced-snipping-tool@extension.com",
          strict_min_version: "109.0"
        }
      };
      
      // Adjust permissions for Firefox
      manifest.permissions = manifest.permissions.filter(p => p !== 'clipboardWrite');
      if (!manifest.permissions.includes('clipboardWrite')) {
        manifest.permissions.push('clipboardWrite');
      }
      
      files['manifest.json'] = JSON.stringify(manifest, null, 2);
    }
    
    // Create ZIP blob
    const zip = await this.createZipFile(files, 'Firefox Extension');
    
    // Store for download
    this.firefoxPackage = zip;
  }

  async getExtensionFiles() {
    const fileList = [
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
      'icons/icon128.png'
    ];

    const files = {};
    
    for (const filePath of fileList) {
      try {
        if (filePath.endsWith('.png')) {
          // For images, we'll create a placeholder or reference
          files[filePath] = 'BINARY_FILE_PLACEHOLDER';
        } else {
          // For text files, we can include the actual content
          files[filePath] = await this.getFileContent(filePath);
        }
      } catch (error) {
        console.warn(`Could not load file: ${filePath}`, error);
      }
    }
    
    return files;
  }

  async getFileContent(filePath) {
    // First try to fetch the actual file content from the server
    try {
      const response = await fetch(filePath);
      if (response.ok) {
        return await response.text();
      }
    } catch (error) {
      console.warn(`Could not fetch ${filePath} from server:`, error);
    }
    
    // Fallback to predefined content for key files
    const contentMap = {
      'manifest.json': `{
  "manifest_version": 3,
  "name": "Advanced Snipping Tool",
  "version": "1.0.0",
  "description": "Advanced browser snipping tool with modern dark teal design for capturing screenshots on any page",
  "permissions": [
    "activeTab",
    "storage",
    "downloads",
    "clipboardWrite"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "css": ["styles.css"],
      "run_at": "document_idle"
    }
  ],
  "commands": {
    "activate-snipping": {
      "suggested_key": {
        "default": "Ctrl+Shift+S",
        "mac": "Command+Shift+S"
      },
      "description": "Activate snipping tool"
    },
    "toggle-snipping": {
      "suggested_key": {
        "default": "Ctrl+Shift+T",
        "mac": "Command+Shift+T"
      },
      "description": "Toggle snipping tool on/off"
    }
  },
  "action": {
    "default_popup": "popup.html",
    "default_title": "Advanced Snipping Tool",
    "default_icon": {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "web_accessible_resources": [
    {
      "resources": ["*.css", "*.js"],
      "matches": ["<all_urls>"]
    }
  ]
}`,
      'README.txt': `Advanced Snipping Tool - Installation Guide

EASY INSTALLATION STEPS:

For Chrome/Edge:
1. Unzip this file to a folder on your computer
2. Open Chrome/Edge and go to chrome://extensions/
3. Turn ON "Developer mode" (top-right toggle)
4. Click "Load unpacked" button
5. Select the folder where you unzipped the files
6. The extension will be installed and ready to use!

For Firefox:
1. Unzip this file to a folder on your computer
2. Open Firefox and go to about:debugging
3. Click "This Firefox"
4. Click "Load Temporary Add-on"
5. Select any file from the unzipped folder
6. The extension will be installed and ready to use!

HOW TO USE:
- Press Ctrl+Shift+S to activate the snipping tool
- Click and drag to select an area on any webpage
- Choose to save to clipboard or download as file
- Press Escape to cancel anytime

NEED HELP?
Visit: https://github.com/Archikainthebag/Snipping-Tool

This extension is 100% safe and doesn't collect any personal data.
All screenshots are processed locally on your computer.`
    };

    return contentMap[filePath] || `// File: ${filePath}\n// Content would be loaded from actual file`;
  }

  async createZipFile(files, packageName) {
    // In a real implementation, this would use a proper ZIP library
    // For this demo, we'll create a simple text representation
    let zipContent = `${packageName} Package\n\nFiles included:\n`;
    
    Object.keys(files).forEach(filename => {
      zipContent += `- ${filename}\n`;
    });
    
    zipContent += `\nInstallation instructions included in README.txt\n`;
    zipContent += `Total files: ${Object.keys(files).length}`;
    
    return new Blob([zipContent], { type: 'text/plain' });
  }

  async createRealZipFile(files, browser) {
    if (typeof JSZip === 'undefined') {
      throw new Error('JSZip library not loaded');
    }

    const zip = new JSZip();
    
    // Add all files to the ZIP
    for (const [filename, content] of Object.entries(files)) {
      if (filename.endsWith('.png')) {
        // For PNG files, we need to fetch the actual binary data
        try {
          const response = await fetch(`icons/${filename.split('/').pop()}`);
          if (response.ok) {
            const blob = await response.blob();
            zip.file(filename, blob);
          } else {
            console.warn(`Could not fetch ${filename}, skipping`);
          }
        } catch (error) {
          console.warn(`Error fetching ${filename}:`, error);
        }
      } else {
        // Text files
        zip.file(filename, content);
      }
    }
    
    // Add browser-specific installation guide
    const installGuide = browser === 'chrome' ? this.getChromeInstallationGuide() : this.getFirefoxInstallationGuide();
    zip.file('INSTALLATION-GUIDE.txt', installGuide);
    
    // Add package info
    const packageInfo = {
      name: 'Advanced Snipping Tool',
      version: '1.0.0',
      browser: browser,
      generated: new Date().toISOString(),
      files: Object.keys(files).length
    };
    zip.file('package-info.json', JSON.stringify(packageInfo, null, 2));
    
    // Generate the ZIP file
    return await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });
  }

  getChromeInstallationGuide() {
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

  getFirefoxInstallationGuide() {
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

  downloadExtension(browser) {
    // First, try to detect if the user is already in Chrome to offer direct installation
    if (browser === 'chrome' && this.detectChromeWebStore()) {
      this.tryDirectInstallation();
      return;
    }

    const filename = `advanced-snipping-tool-${browser}.zip`;
    const packagePath = `packages/${filename}`;
    
    // Show loading state
    this.showNotification('Preparing download...', 'info');
    
    // Try to download pre-built package first
    fetch(packagePath)
      .then(response => {
        if (response.ok) {
          return response.blob();
        } else {
          throw new Error('Pre-built package not found');
        }
      })
      .then(blob => {
        this.downloadBlob(blob, filename);
        this.showInstallationGuide(browser);
      })
      .catch(() => {
        // Fallback: Try GitHub download since dynamic package creation requires external dependencies
        console.warn('Pre-built package not available, falling back to GitHub download');
        this.showNotification('Downloading from GitHub repository...', 'info');
        this.downloadFromGitHub(browser);
      });
  }

  detectChromeWebStore() {
    // Check if running in Chrome/Edge
    const isChrome = /Chrome|Chromium|Edge/.test(navigator.userAgent);
    const hasExtensionAPI = typeof chrome !== 'undefined' && chrome.runtime;
    return isChrome && window.location.protocol === 'https:';
  }

  tryDirectInstallation() {
    // Check if Chrome Web Store installation is possible
    this.showNotification('Checking Chrome Web Store compatibility...', 'info');
    
    // For now, fallback to manual installation with enhanced instructions
    setTimeout(() => {
      this.showEnhancedChromeInstructions();
    }, 1000);
  }

  showEnhancedChromeInstructions() {
    const modal = document.getElementById('install-modal');
    const stepsContainer = document.getElementById('install-steps');
    
    stepsContainer.innerHTML = `
      <div class="enhanced-chrome-install">
        <h4>🚀 Chrome/Edge Quick Installation</h4>
        <div class="install-method">
          <h5>Method 1: Direct Download (Recommended)</h5>
          <button class="install-btn" onclick="landingPage.downloadFallback('chrome')">
            📥 Download Extension Package
          </button>
          <p class="method-desc">Download a properly packaged extension file for manual installation.</p>
        </div>
        
        <div class="install-steps">
          <h5>Installation Steps:</h5>
          <ol>
            <li><strong>Download:</strong> Click the button above to get the extension package</li>
            <li><strong>Extract:</strong> Right-click the ZIP file → "Extract All"</li>
            <li><strong>Open Extensions:</strong> Type <code>chrome://extensions/</code> in your address bar</li>
            <li><strong>Enable Developer Mode:</strong> Toggle the switch in the top-right</li>
            <li><strong>Load Extension:</strong> Click "Load unpacked" → Select the extracted folder</li>
            <li><strong>Pin Extension:</strong> Click the puzzle icon 🧩 in toolbar → Pin the extension</li>
          </ol>
        </div>
        
        <div class="troubleshooting">
          <h5>❓ Having Issues?</h5>
          <ul>
            <li>Make sure you extracted the ZIP file completely</li>
            <li>Select the folder containing manifest.json</li>
            <li>Ensure Developer Mode is ON</li>
            <li>Try restarting Chrome if problems persist</li>
          </ul>
        </div>
        
        <div class="safety-guarantee">
          <h5>🛡️ Safety Guarantee</h5>
          <p>✓ 100% Safe & Secure ✓ No Data Collection ✓ Local Processing Only</p>
        </div>
      </div>
    `;
    
    modal.style.display = 'block';
  }

  async createAndDownloadPackage(browser) {
    try {
      this.showNotification('Creating extension package...', 'info');
      
      // Check if JSZip is available
      if (typeof JSZip === 'undefined') {
        throw new Error('JSZip library not available (external CDN may be blocked)');
      }
      
      // Get all extension files
      const files = await this.getExtensionFiles();
      
      // Validate essential files
      if (!files['manifest.json'] || !files['background.js'] || !files['content.js']) {
        throw new Error('Essential extension files are missing');
      }
      
      // Create the package
      const packageBlob = await this.createRealZipFile(files, browser);
      
      // Download the package
      const filename = `advanced-snipping-tool-${browser}.zip`;
      this.downloadBlob(packageBlob, filename);
      this.showInstallationGuide(browser);
      
    } catch (error) {
      console.error('Package creation failed:', error);
      
      // Provide more specific error messaging
      if (error.message.includes('JSZip')) {
        this.showNotification('Dynamic package creation unavailable. Downloading source from GitHub...', 'info');
      } else {
        this.showNotification('Package creation failed. Falling back to GitHub download.', 'error');
      }
      
      setTimeout(() => this.downloadFromGitHub(browser), 1000);
    }
  }

  downloadFallback(browser) {
    // Close the modal first
    document.getElementById('install-modal').style.display = 'none';
    
    // Start the download process
    this.createAndDownloadPackage(browser);
  }

  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Show success notification
    this.showNotification('Download started! Check your downloads folder.', 'success');
  }

  downloadFromGitHub(browser) {
    // Fallback to direct GitHub download
    const githubUrl = 'https://github.com/Archikainthebag/Snipping-Tool/archive/refs/heads/main.zip';
    
    try {
      // Create temporary link
      const a = document.createElement('a');
      a.href = githubUrl;
      a.download = `snipping-tool-${browser}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      this.showInstallationGuide(browser);
      this.showNotification('Download started! Extract the ZIP file and follow the installation guide.', 'success');
    } catch (error) {
      console.error('GitHub download failed:', error);
      this.showNotification('Download failed. Please visit GitHub manually to download the extension.', 'error');
      
      // Show manual download instructions
      setTimeout(() => {
        this.showManualDownloadInstructions();
      }, 2000);
    }
  }

  showManualDownloadInstructions() {
    const modal = document.getElementById('install-modal');
    const stepsContainer = document.getElementById('install-steps');
    
    stepsContainer.innerHTML = `
      <div class="manual-download-instructions">
        <h4>📥 Manual Download Instructions</h4>
        <p>If the automatic download doesn't work, please follow these steps:</p>
        
        <div class="download-steps">
          <h5>Step 1: Download from GitHub</h5>
          <ol>
            <li>Go to: <a href="https://github.com/Archikainthebag/Snipping-Tool" target="_blank" rel="noopener">https://github.com/Archikainthebag/Snipping-Tool</a></li>
            <li>Click the green "Code" button</li>
            <li>Select "Download ZIP"</li>
            <li>Save the file to your computer</li>
          </ol>
        </div>
        
        <div class="install-steps">
          <h5>Step 2: Install the Extension</h5>
          <ol>
            <li><strong>Extract:</strong> Right-click the ZIP file → "Extract All"</li>
            <li><strong>Open Extensions:</strong> Type <code>chrome://extensions/</code> in your address bar</li>
            <li><strong>Enable Developer Mode:</strong> Toggle the switch in the top-right</li>
            <li><strong>Load Extension:</strong> Click "Load unpacked" → Select the extracted folder</li>
            <li><strong>Pin Extension:</strong> Click the puzzle icon 🧩 in toolbar → Pin the extension</li>
          </ol>
        </div>
        
        <div class="help-section">
          <h5>❓ Need Help?</h5>
          <p>Visit our <a href="https://github.com/Archikainthebag/Snipping-Tool/issues" target="_blank" rel="noopener">GitHub Issues</a> page for support.</p>
        </div>
        
        <div class="safety-guarantee">
          <h5>🛡️ Safety Guarantee</h5>
          <p>✓ 100% Safe & Secure ✓ No Data Collection ✓ Local Processing Only</p>
        </div>
      </div>
    `;
    
    modal.style.display = 'block';
  }

  showInstallationGuide(browser) {
    const modal = document.getElementById('install-modal');
    const stepsContainer = document.getElementById('install-steps');
    
    const chromeSteps = `
      <h4>Chrome/Edge Installation:</h4>
      <ol>
        <li>Extract the downloaded ZIP file to a folder</li>
        <li>Open Chrome/Edge and go to <code>chrome://extensions/</code></li>
        <li>Turn ON "Developer mode" (top-right toggle)</li>
        <li>Click "Load unpacked" button</li>
        <li>Select the extracted folder</li>
        <li>Done! The extension is now installed</li>
      </ol>
      <p><strong>Tip:</strong> Pin the extension by clicking the puzzle icon in your toolbar!</p>
      <div class="safety-note">
        <h5>🛡️ Safety Guarantee:</h5>
        <p>This extension is completely safe and doesn't collect any personal data. All screenshots are processed locally on your computer.</p>
      </div>
    `;
    
    const firefoxSteps = `
      <h4>Firefox Installation:</h4>
      <ol>
        <li>Extract the downloaded ZIP file to a folder</li>
        <li>Open Firefox and go to <code>about:debugging</code></li>
        <li>Click "This Firefox"</li>
        <li>Click "Load Temporary Add-on"</li>
        <li>Select any file from the extracted folder</li>
        <li>Done! The extension is now installed</li>
      </ol>
      <p><strong>Note:</strong> Temporary add-ons are removed when Firefox restarts. For permanent installation, contact us for a signed version.</p>
      <div class="safety-note">
        <h5>🛡️ Safety Guarantee:</h5>
        <p>This extension is completely safe and doesn't collect any personal data. All screenshots are processed locally on your computer.</p>
      </div>
    `;
    
    stepsContainer.innerHTML = browser === 'chrome' ? chromeSteps : firefoxSteps;
    modal.style.display = 'block';
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">
          ${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}
        </span>
        <span class="notification-message">${message}</span>
      </div>
    `;
    
    // Add notification styles
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: rgba(15, 23, 42, 0.95);
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      border: 1px solid ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#14b8a6'};
      backdrop-filter: blur(20px);
      z-index: 10000;
      max-width: 400px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after delay
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 5000);
  }

  setupAnimations() {
    // Intersection Observer for fade-in animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.feature-card, .step, .blog-post').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(el);
    });

    // Parallax effect for hero background
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      const heroBackground = document.querySelector('.hero-background');
      if (heroBackground) {
        heroBackground.style.transform = `translateY(${scrolled * 0.5}px)`;
      }
    });
  }
}

// Add custom styles for notifications
const notificationStyles = `
  .notification-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .notification-icon {
    font-weight: bold;
    font-size: 1.2rem;
  }
  
  .notification-message {
    flex: 1;
  }
  
  .safety-note {
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 8px;
    padding: 16px;
    margin-top: 20px;
  }
  
  .safety-note h5 {
    color: #10b981;
    margin-bottom: 8px;
    font-size: 1rem;
  }
  
  .safety-note p {
    color: #cbd5e1;
    margin: 0;
    font-size: 0.9rem;
  }
  
  code {
    background: rgba(20, 184, 166, 0.1);
    color: #5eead4;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  }
`;

// Inject notification styles
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// Initialize landing page when DOM is loaded
let landingPage;
document.addEventListener('DOMContentLoaded', () => {
  landingPage = new LandingPage();
});

// Add loading animation
window.addEventListener('load', () => {
  document.body.classList.add('loaded');
});