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
      // Inject content script if not already injected
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });

      // Send activation message
      await chrome.tabs.sendMessage(tab.id, {
        action: 'activate-snipping'
      });
    } catch (error) {
      console.error('Error injecting content script:', error);
    }
  }

  async toggleSnipping() {
    this.isEnabled = !this.isEnabled;
    await chrome.storage.sync.set({ isEnabled: this.isEnabled });
    
    // Update icon to reflect state
    const iconPath = this.isEnabled ? 'icons/icon32.png' : 'icons/icon32-disabled.png';
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
      case 'capture-screenshot':
        await this.captureScreenshot(request, sender, sendResponse);
        break;
      case 'save-to-clipboard':
        await this.saveToClipboard(request.imageData, sendResponse);
        break;
      case 'download-image':
        await this.downloadImage(request.imageData, request.filename, sendResponse);
        break;
      case 'get-settings':
        await this.getSettings(sendResponse);
        break;
      case 'update-settings':
        await this.updateSettings(request.settings, sendResponse);
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
      // Check if clipboard API is available
      if (!navigator.clipboard || !navigator.clipboard.write) {
        throw new Error('Clipboard API not available in this browser');
      }

      // Convert base64 to blob
      const response = await fetch(imageData);
      const blob = await response.blob();
      
      // Use the Clipboard API
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      
      sendResponse({ success: true });
    } catch (error) {
      console.error('Clipboard save failed:', error);
      
      // Fallback: Create a temporary textarea with the data URL
      try {
        const textarea = document.createElement('textarea');
        textarea.value = imageData;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        sendResponse({ success: true, method: 'fallback' });
      } catch (fallbackError) {
        sendResponse({ 
          success: false, 
          error: 'Failed to save to clipboard. Please try downloading instead.',
          details: error.message 
        });
      }
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
}

// Initialize the background script
new SnippingToolBackground();