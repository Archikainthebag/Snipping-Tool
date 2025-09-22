// Advanced Snipping Tool Background Script
class SnippingToolBackground {
  constructor() {
    this.isEnabled = true;
    this.init();
  }

  init() {
    // Listen for command shortcuts
    chrome.commands.onCommand.addListener((command) => {
      this.handleCommand(command);
    });

    // Listen for extension icon clicks
    chrome.action.onClicked.addListener((tab) => {
      this.activateSnipping(tab);
    });

    // Handle messages from content scripts
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });

    // Initialize storage
    this.initializeStorage();
  }

  async initializeStorage() {
    const result = await chrome.storage.sync.get(['isEnabled', 'settings']);
    this.isEnabled = result.isEnabled !== false; // Default to true
    
    if (!result.settings) {
      await chrome.storage.sync.set({
        settings: {
          theme: 'dark-teal',
          saveLocation: 'download',
          quality: 'high',
          format: 'png'
        }
      });
    }
  }

  handleCommand(command) {
    switch (command) {
      case 'activate-snipping':
        this.activateSnippingOnCurrentTab();
        break;
      case 'toggle-snipping':
        this.toggleSnipping();
        break;
    }
  }

  async activateSnippingOnCurrentTab() {
    if (!this.isEnabled) return;

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        this.activateSnipping(tab);
      }
    } catch (error) {
      console.error('Error activating snipping:', error);
    }
  }

  async activateSnipping(tab) {
    if (!this.isEnabled) return;

    try {
      // Try to send activation message first
      // If content script is already loaded, this will work
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'activate-snipping'
        });
      } catch (messageError) {
        // If message fails, try to inject content script and CSS, then send message
        console.log('Content script not found, injecting...');
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        
        // Also inject CSS to ensure overlay styles are available
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['styles.css']
        });
        
        // Wait a bit for the script to initialize
        setTimeout(async () => {
          try {
            await chrome.tabs.sendMessage(tab.id, {
              action: 'activate-snipping'
            });
          } catch (retryError) {
            console.error('Failed to activate snipping after injection:', retryError);
          }
        }, 200); // Increased timeout slightly for CSS injection
      }
    } catch (error) {
      console.error('Error activating snipping:', error);
    }
  }

  async toggleSnipping() {
    this.isEnabled = !this.isEnabled;
    await chrome.storage.sync.set({ isEnabled: this.isEnabled });
    
    // Update icon to reflect state (using regular icon since disabled icon doesn't exist)
    const iconPath = 'icons/icon32.png';
    chrome.action.setIcon({ path: iconPath });

    // Notify all tabs
    const tabs = await chrome.tabs.query({});
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'toggle-state',
        isEnabled: this.isEnabled
      }).catch(() => {}); // Ignore errors for tabs without content script
    });
  }

  async handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'activate-snipping':
        await this.activateSnippingOnCurrentTab();
        sendResponse({ success: true });
        break;
      case 'toggle-snipping':
        await this.toggleSnipping();
        sendResponse({ success: true });
        break;
      case 'capture-screenshot':
        await this.captureScreenshot(request, sender, sendResponse);
        await this.trackUsage('capture'); // Track usage
        break;
      case 'save-to-clipboard':
        await this.saveToClipboard(request.imageData, sendResponse);
        await this.trackUsage('clipboard'); // Track usage
        break;
      case 'download-image':
        await this.downloadImage(request.imageData, request.filename, sendResponse);
        await this.trackUsage('download'); // Track usage
        break;
      case 'get-settings':
        await this.getSettings(sendResponse);
        break;
      case 'update-settings':
        await this.updateSettings(request.settings, sendResponse);
        break;
      case 'save-history':
        await this.saveHistory(request.history, sendResponse);
        break;
      case 'get-history':
        await this.getHistory(sendResponse);
        break;
      case 'get-download-links':
        try {
          const links = await this.createDownloadLinks();
          sendResponse({ success: true, links });
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
        break;
      case 'get-usage-stats':
        try {
          const result = await chrome.storage.local.get(['usageStats']);
          sendResponse({ 
            success: true, 
            stats: result.usageStats || {
              totalCaptures: 0,
              clipboardSaves: 0,
              fileSaves: 0,
              lastUsed: null,
              installDate: new Date().toISOString()
            }
          });
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
        break;
    }
  }

  async captureScreenshot(request, sender, sendResponse) {
    try {
      const screenshot = await chrome.tabs.captureVisibleTab(
        sender.tab.windowId,
        { format: 'png', quality: 100 }
      );
      sendResponse({ success: true, screenshot });
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async saveToClipboard(imageData, sendResponse) {
    try {
      // For Manifest V3 service workers, we need to handle clipboard operations differently
      // We'll send the image data back to the content script to handle clipboard operations
      sendResponse({ 
        success: true, 
        action: 'handle-clipboard-in-content',
        imageData: imageData 
      });
    } catch (error) {
      console.error('Clipboard save preparation failed:', error);
      sendResponse({ 
        success: false, 
        error: 'Failed to prepare clipboard save. This may be due to browser security restrictions.' 
      });
    }
  }

  async downloadImage(imageData, filename, sendResponse) {
    try {
      const url = chrome.runtime.getURL('data:image/png;base64,' + imageData.split(',')[1]);
      
      await chrome.downloads.download({
        url: imageData,
        filename: filename || `snipping-tool-${Date.now()}.png`,
        saveAs: false
      });
      
      sendResponse({ success: true });
    } catch (error) {
      console.error('Download failed:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async getSettings(sendResponse) {
    try {
      const result = await chrome.storage.sync.get(['settings', 'isEnabled']);
      sendResponse({ 
        success: true, 
        settings: result.settings,
        isEnabled: result.isEnabled !== false
      });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  async updateSettings(settings, sendResponse) {
    try {
      await chrome.storage.sync.set({ settings });
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  // Advanced feature: Save screenshot history
  async saveHistory(history, sendResponse) {
    try {
      // Store only metadata to prevent storage overflow
      const limitedHistory = history.slice(0, 5).map(item => ({
        id: item.id,
        timestamp: item.timestamp,
        dimensions: item.dimensions
      }));
      
      await chrome.storage.local.set({
        screenshotHistory: limitedHistory
      });
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  // Advanced feature: Get screenshot history
  async getHistory(sendResponse) {
    try {
      const result = await chrome.storage.local.get(['screenshotHistory']);
      sendResponse({
        success: true,
        history: result.screenshotHistory || []
      });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  // Usage analytics (privacy-focused, no personal data)
  async trackUsage(action) {
    try {
      const result = await chrome.storage.local.get(['usageStats']);
      const stats = result.usageStats || {
        totalCaptures: 0,
        clipboardSaves: 0,
        fileSaves: 0,
        lastUsed: null,
        installDate: new Date().toISOString()
      };
      
      switch (action) {
        case 'capture':
          stats.totalCaptures++;
          break;
        case 'clipboard':
          stats.clipboardSaves++;
          break;
        case 'download':
          stats.fileSaves++;
          break;
      }
      
      stats.lastUsed = new Date().toISOString();
      
      await chrome.storage.local.set({ usageStats: stats });
    } catch (error) {
      console.warn('Failed to track usage:', error);
    }
  }

  // Enhanced settings management with validation
  async validateAndUpdateSettings(newSettings) {
    const allowedFormats = ['png', 'jpeg'];
    const allowedQualities = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
    
    const validatedSettings = {
      saveFormat: allowedFormats.includes(newSettings.saveFormat) ? newSettings.saveFormat : 'png',
      quality: allowedQualities.includes(newSettings.quality) ? newSettings.quality : 0.9,
      showPreview: Boolean(newSettings.showPreview),
      autoSave: Boolean(newSettings.autoSave),
      soundEnabled: Boolean(newSettings.soundEnabled),
      animationsEnabled: Boolean(newSettings.animationsEnabled)
    };
    
    try {
      const result = await chrome.storage.sync.get(['settings']);
      const currentSettings = result.settings || {};
      const updatedSettings = { ...currentSettings, ...validatedSettings };
      
      await chrome.storage.sync.set({ settings: updatedSettings });
      
      // Notify all tabs of settings change
      const tabs = await chrome.tabs.query({});
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'settings-updated',
          settings: updatedSettings
        }).catch(() => {}); // Ignore errors for tabs without content script
      });
      
      return updatedSettings;
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  }

  // Create downloadable extension package URLs
  async createDownloadLinks() {
    const baseUrl = 'https://github.com/Archikainthebag/Snipping-Tool';
    
    return {
      chrome: `${baseUrl}/releases/latest/download/advanced-snipping-tool-chrome.zip`,
      firefox: `${baseUrl}/releases/latest/download/advanced-snipping-tool-firefox.zip`,
      source: `${baseUrl}/archive/refs/heads/main.zip`,
      releases: `${baseUrl}/releases`
    };
  }
}

// Initialize the background script
new SnippingToolBackground();