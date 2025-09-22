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
          format: 'png',
          selectedColor: '#14b8a6'
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
      // First try to ping existing content script
      const contentScriptReady = await this.checkContentScriptReady(tab.id);
      
      if (contentScriptReady) {
        // Content script is already loaded and ready
        await chrome.tabs.sendMessage(tab.id, {
          action: 'activate-snipping'
        });
        console.log('Activated snipping on existing content script');
        return;
      }

      // Content script not ready, inject it
      console.log('Content script not ready, injecting...');
      await this.injectAndActivate(tab.id);
      
    } catch (error) {
      console.error('Error activating snipping:', error);
      // Optionally notify user of failure
      this.notifyActivationFailure(tab.id);
    }
  }

  async checkContentScriptReady(tabId) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, {
        action: 'ping'
      });
      return response && response.success;
    } catch (error) {
      return false;
    }
  }

  async injectAndActivate(tabId) {
    try {
      // First inject CSS to ensure overlay styles are available
      await chrome.scripting.insertCSS({
        target: { tabId: tabId },
        files: ['styles.css']
      });
      
      // Then inject the content script
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      });
      
      // Wait for content script to initialize and verify it's ready
      const maxAttempts = 10;
      const delayMs = 200;
      
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
        
        try {
          const response = await chrome.tabs.sendMessage(tabId, {
            action: 'ping'
          });
          
          if (response && response.success) {
            // Content script is ready, now activate
            await chrome.tabs.sendMessage(tabId, {
              action: 'activate-snipping'
            });
            console.log(`Activated snipping after ${attempt} attempts`);
            return;
          }
        } catch (pingError) {
          // Continue trying
          console.log(`Attempt ${attempt}/${maxAttempts}: Content script not ready yet`);
        }
      }
      
      throw new Error('Content script failed to initialize after maximum attempts');
      
    } catch (error) {
      console.error('Failed to inject and activate content script:', error);
      throw error;
    }
  }

  async notifyActivationFailure(tabId) {
    try {
      // Try to inject a simple notification script
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
          const notification = document.createElement('div');
          notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 14px;
            z-index: 2147483647;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
          `;
          notification.textContent = 'Failed to activate snipping tool. Please try again.';
          document.body.appendChild(notification);
          
          setTimeout(() => {
            notification.remove();
          }, 3000);
        }
      });
    } catch (notificationError) {
      console.warn('Could not show activation failure notification:', notificationError);
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
    try {
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
          return; // Don't call sendResponse again as captureScreenshot handles it
        case 'save-to-clipboard':
          await this.saveToClipboard(request.imageData, sendResponse);
          await this.trackUsage('clipboard'); // Track usage
          return; // Don't call sendResponse again as saveToClipboard handles it
        case 'download-image':
          const downloadResult = await this.downloadImageAsync(request.imageData, request.filename);
          await this.trackUsage('download'); // Track usage
          sendResponse(downloadResult);
          break;
        case 'get-settings':
          await this.getSettings(sendResponse);
          return; // getSettings handles the response
        case 'update-settings':
          await this.updateSettings(request.settings, sendResponse);
          return; // updateSettings handles the response
        case 'save-history':
          await this.saveHistory(request.history, sendResponse);
          return; // saveHistory handles the response
        case 'get-history':
          await this.getHistory(sendResponse);
          return; // getHistory handles the response
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
        default:
          sendResponse({ success: false, error: 'Unknown action: ' + request.action });
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
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
      console.log('Download requested with filename:', filename);
      console.log('Image data format:', imageData.substring(0, 50) + '...');
      
      // Ensure the filename is safe for download
      const safeFilename = filename.replace(/[<>:"/\\|?*]/g, '_');
      
      // For Manifest V3, we need to ensure the data URL is properly formatted
      if (!imageData.startsWith('data:image/')) {
        throw new Error('Invalid image data format');
      }
      
      const downloadOptions = {
        url: imageData,
        filename: safeFilename || `snipping-tool-${Date.now()}.png`,
        saveAs: false,
        conflictAction: 'uniquify' // Automatically rename if file exists
      };
      
      console.log('Download options:', downloadOptions);
      
      const downloadId = await chrome.downloads.download(downloadOptions);
      
      console.log('Download initiated with ID:', downloadId);
      sendResponse({ success: true, downloadId });
    } catch (error) {
      console.error('Download failed:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  // New async version that returns a promise instead of using callback
  async downloadImageAsync(imageData, filename) {
    try {
      console.log('Download requested with filename:', filename);
      console.log('Image data format:', imageData.substring(0, 50) + '...');
      console.log('Image data length:', imageData.length);
      
      // Validate input parameters
      if (!imageData) {
        throw new Error('No image data provided');
      }
      
      if (!filename) {
        throw new Error('No filename provided');
      }
      
      // Ensure the filename is safe for download
      const safeFilename = filename.replace(/[<>:"/\\|?*]/g, '_');
      
      // For Manifest V3, we need to ensure the data URL is properly formatted
      if (!imageData.startsWith('data:image/')) {
        throw new Error('Invalid image data format - must be a data URL starting with data:image/');
      }
      
      // Check if the data URL seems to have actual image data
      if (imageData.length < 100) {
        throw new Error('Image data appears to be too small or empty');
      }
      
      // Verify we have downloads permission
      const permissions = await chrome.permissions.getAll();
      if (!permissions.permissions.includes('downloads')) {
        throw new Error('Downloads permission not granted');
      }
      
      const downloadOptions = {
        url: imageData,
        filename: safeFilename || `snipping-tool-${Date.now()}.png`,
        saveAs: false,
        conflictAction: 'uniquify' // Automatically rename if file exists
      };
      
      console.log('Download options:', downloadOptions);
      
      const downloadId = await chrome.downloads.download(downloadOptions);
      
      console.log('Download initiated with ID:', downloadId);
      
      // Optionally listen for download completion
      return new Promise((resolve) => {
        const downloadListener = (delta) => {
          if (delta.id === downloadId && delta.state) {
            if (delta.state.current === 'complete') {
              chrome.downloads.onChanged.removeListener(downloadListener);
              resolve({ success: true, downloadId, status: 'completed' });
            } else if (delta.state.current === 'interrupted') {
              chrome.downloads.onChanged.removeListener(downloadListener);
              resolve({ success: false, error: 'Download was interrupted', downloadId });
            }
          }
        };
        
        chrome.downloads.onChanged.addListener(downloadListener);
        
        // Fallback timeout - resolve with basic success after 5 seconds if no status update
        setTimeout(() => {
          chrome.downloads.onChanged.removeListener(downloadListener);
          resolve({ success: true, downloadId, status: 'initiated' });
        }, 5000);
      });
      
    } catch (error) {
      console.error('Download failed:', error);
      return { success: false, error: error.message };
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