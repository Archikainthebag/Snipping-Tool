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
    // In a real implementation, this would fetch the actual file content
    // For this demo, we'll return placeholder content or actual content for key files
    
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

  downloadExtension(browser) {
    const filename = `advanced-snipping-tool-${browser}.zip`;
    const packagePath = `packages/${filename}`;
    
    // Check if package exists locally, otherwise fallback to GitHub
    fetch(packagePath)
      .then(response => {
        if (response.ok) {
          return response.blob();
        } else {
          throw new Error('Package not found locally');
        }
      })
      .then(blob => {
        this.downloadBlob(blob, filename);
        this.showInstallationGuide(browser);
      })
      .catch(() => {
        // Fallback to GitHub download
        this.downloadFromGitHub(browser);
      });
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
    
    // Create temporary link
    const a = document.createElement('a');
    a.href = githubUrl;
    a.download = `snipping-tool-${browser}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    this.showInstallationGuide(browser);
    this.showNotification('Download started! Extract the ZIP file and follow the installation guide.', 'info');
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
document.addEventListener('DOMContentLoaded', () => {
  new LandingPage();
});

// Add loading animation
window.addEventListener('load', () => {
  document.body.classList.add('loaded');
});