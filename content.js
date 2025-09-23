// Advanced Snipping Tool Content Script
class SnippingTool {
  constructor() {
    this.isActive = false;
    this.isEnabled = true;
    this.overlay = null;
    this.selection = null;
    this.startX = 0;
    this.startY = 0;
    this.endX = 0;
    this.endY = 0;
    this.isSelecting = false;
    this.canvas = null;
    this.ctx = null;
    this.selectedColor = '#14b8a6'; // Default teal color
    this.history = [];
    this.eventsBound = false; // Track if events are already bound
    this.currentScreenshot = null; // Store current screenshot for reuse
    this.settings = {
      animationsEnabled: true,
      soundEnabled: true
    };
    
    this.init();
  }

  init() {
    console.log('Initializing snipping tool content script');
    
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true;
    });

    // Initialize overlay immediately if DOM is ready, otherwise wait
    this.initializeOverlay();
  }
  
  initializeOverlay() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.setupOverlay();
        this.signalReady();
      });
    } else {
      this.setupOverlay();
      this.signalReady();
    }
  }
  
  signalReady() {
    // Signal to background script that content script is ready
    try {
      chrome.runtime.sendMessage({
        action: 'content-script-ready'
      }).catch(() => {
        // Ignore errors - background script might not be listening
      });
    } catch (error) {
      // Ignore messaging errors during initialization
    }
  }
  
  setupOverlay() {
    // Check if already initialized to prevent duplicate overlays
    if (document.getElementById('snipping-tool-overlay')) {
      console.log('Snipping tool overlay already exists, using existing one');
      this.overlay = document.getElementById('snipping-tool-overlay');
      this.selection = this.overlay.querySelector('.snipping-selection');
      this.canvas = this.overlay.querySelector('.snipping-canvas');
      if (this.canvas) {
        this.ctx = this.canvas.getContext('2d');
      }
      // Make sure events are bound even for existing overlay
      this.bindEvents();
      return;
    }

    try {
      this.createOverlay();
      this.bindEvents();
      console.log('Snipping tool initialized successfully');
    } catch (error) {
      console.error('Failed to initialize snipping tool:', error);
      // Single retry with proper error handling
      setTimeout(() => {
        try {
          if (!document.getElementById('snipping-tool-overlay')) {
            this.createOverlay();
            this.bindEvents();
            console.log('Snipping tool initialized successfully on retry');
          }
        } catch (retryError) {
          console.error('Failed to initialize snipping tool on retry - giving up:', retryError);
        }
      }, 1000);
    }
  }

  handleMessage(request, sender, sendResponse) {
    console.log('Content script received message:', request.action);
    
    try {
      switch (request.action) {
        case 'activate-snipping':
          if (this.isEnabled) {
            console.log('Activating snipping tool');
            this.activate();
            sendResponse({ success: true });
          } else {
            console.log('Snipping tool is disabled');
            sendResponse({ success: false, reason: 'disabled' });
          }
          break;
        case 'toggle-state':
          this.isEnabled = request.isEnabled;
          console.log('Toggle state:', this.isEnabled);
          if (!this.isEnabled && this.isActive) {
            this.deactivate();
          }
          sendResponse({ success: true });
          break;
        case 'set-color':
          this.setSelectedColor(request.color);
          sendResponse({ success: true });
          break;
        case 'ping':
          // Verify overlay is properly initialized
          const overlayReady = this.overlay && document.getElementById('snipping-tool-overlay');
          sendResponse({ 
            success: true, 
            active: this.isActive, 
            enabled: this.isEnabled,
            overlayReady: !!overlayReady
          });
          break;
        case 'settings-updated':
          if (request.settings) {
            this.settings = { ...this.settings, ...request.settings };
            if (request.settings.selectedColor) {
              this.setSelectedColor(request.settings.selectedColor);
            }
          }
          sendResponse({ success: true });
          break;
        default:
          console.warn('Unknown message action:', request.action);
          sendResponse({ success: false, reason: 'unknown_action' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  createOverlay() {
    // Remove existing overlay if it exists
    const existingOverlay = document.getElementById('snipping-tool-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    // Create main overlay
    this.overlay = document.createElement('div');
    this.overlay.id = 'snipping-tool-overlay';
    this.overlay.className = 'snipping-overlay';
    
    // Create canvas for drawing selection (must be first for proper layering)
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'snipping-canvas';
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.overlay.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    
    // Create selection area
    this.selection = document.createElement('div');
    this.selection.className = 'snipping-selection';
    this.overlay.appendChild(this.selection);

    // Create toolbar
    this.createToolbar();

    // Ensure overlay is added to body
    if (document.body) {
      document.body.appendChild(this.overlay);
    } else {
      // If body is not ready, wait for it
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(this.overlay);
      });
    }
    
    console.log('Overlay created successfully');
  }

  createToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'snipping-toolbar';
    toolbar.innerHTML = `
      <div class="toolbar-buttons">
        <button class="toolbar-btn" id="save-download" title="Save to File">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h16c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
          </svg>
        </button>
        <button class="toolbar-btn" id="cancel-snip" title="Cancel">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
    `;

    this.overlay.appendChild(toolbar);
    this.bindToolbarEvents(toolbar);
  }

  bindToolbarEvents(toolbar) {
    toolbar.querySelector('#save-download').addEventListener('click', () => {
      this.downloadScreenshot();
    });

    toolbar.querySelector('#cancel-snip').addEventListener('click', () => {
      this.deactivate();
    });
  }

  bindEvents() {
    // Prevent duplicate event binding
    if (this.eventsBound) {
      return;
    }
    
    // Mouse events for selection
    this.overlay.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.overlay.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.overlay.addEventListener('mouseup', (e) => this.onMouseUp(e));

    // Keyboard events
    document.addEventListener('keydown', (e) => this.onKeyDown(e));

    // Prevent context menu on overlay
    this.overlay.addEventListener('contextmenu', (e) => e.preventDefault());
    
    this.eventsBound = true;
  }

  onMouseDown(e) {
    if (!this.isActive) return;
    
    this.isSelecting = true;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.endX = e.clientX;
    this.endY = e.clientY;
    
    this.updateSelection();
    e.preventDefault();
  }

  onMouseMove(e) {
    if (!this.isActive || !this.isSelecting) return;
    
    this.endX = e.clientX;
    this.endY = e.clientY;
    
    this.updateSelection();
    e.preventDefault();
  }

  onMouseUp(e) {
    if (!this.isActive || !this.isSelecting) return;
    
    this.isSelecting = false;
    
    // Auto-save to clipboard when selection is complete
    if (this.hasSelection()) {
      this.saveToClipboard();
    } else {
      this.showToolbar();
    }
    
    e.preventDefault();
  }

  onKeyDown(e) {
    if (!this.isActive) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      console.log('ESC key pressed, deactivating snipping tool');
      this.deactivate();
    } else if (e.key === 'Enter' && this.hasSelection()) {
      e.preventDefault();
      e.stopPropagation();
      this.downloadScreenshot();
    }
    
    // Handle advanced keyboard shortcuts
    this.handleAdvancedKeyboard(e);
  }

  updateSelection() {
    const left = Math.min(this.startX, this.endX);
    const top = Math.min(this.startY, this.endY);
    const width = Math.abs(this.endX - this.startX);
    const height = Math.abs(this.endY - this.startY);
    
    this.selection.style.left = left + 'px';
    this.selection.style.top = top + 'px';
    this.selection.style.width = width + 'px';
    this.selection.style.height = height + 'px';
    this.selection.style.display = 'block';

    // Only resize canvas if dimensions changed to avoid clearing
    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;
    if (this.canvas.width !== currentWidth || this.canvas.height !== currentHeight) {
      this.canvas.width = currentWidth;
      this.canvas.height = currentHeight;
    }
    
    this.drawOverlay(left, top, width, height);
  }

  drawOverlay(selLeft, selTop, selWidth, selHeight) {
    if (!this.ctx) {
      console.error('Canvas context not available');
      return;
    }
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw dark overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Clear selection area - only if we have valid dimensions
    if (selWidth > 0 && selHeight > 0) {
      this.ctx.clearRect(selLeft, selTop, selWidth, selHeight);
      
      // Draw selection border with selected color
      this.ctx.strokeStyle = this.selectedColor;
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(selLeft, selTop, selWidth, selHeight);
      
      // Add corner indicators for better visibility
      this.drawCornerIndicators(selLeft, selTop, selWidth, selHeight);
    }
  }
  
  drawCornerIndicators(selLeft, selTop, selWidth, selHeight) {
    const cornerSize = 10;
    const cornerThickness = 3;
    
    this.ctx.strokeStyle = this.selectedColor;
    this.ctx.lineWidth = cornerThickness;
    
    // Top-left corner
    this.ctx.beginPath();
    this.ctx.moveTo(selLeft, selTop + cornerSize);
    this.ctx.lineTo(selLeft, selTop);
    this.ctx.lineTo(selLeft + cornerSize, selTop);
    this.ctx.stroke();
    
    // Top-right corner
    this.ctx.beginPath();
    this.ctx.moveTo(selLeft + selWidth - cornerSize, selTop);
    this.ctx.lineTo(selLeft + selWidth, selTop);
    this.ctx.lineTo(selLeft + selWidth, selTop + cornerSize);
    this.ctx.stroke();
    
    // Bottom-left corner
    this.ctx.beginPath();
    this.ctx.moveTo(selLeft, selTop + selHeight - cornerSize);
    this.ctx.lineTo(selLeft, selTop + selHeight);
    this.ctx.lineTo(selLeft + cornerSize, selTop + selHeight);
    this.ctx.stroke();
    
    // Bottom-right corner
    this.ctx.beginPath();
    this.ctx.moveTo(selLeft + selWidth - cornerSize, selTop + selHeight);
    this.ctx.lineTo(selLeft + selWidth, selTop + selHeight);
    this.ctx.lineTo(selLeft + selWidth, selTop + selHeight - cornerSize);
    this.ctx.stroke();
  }

  showToolbar() {
    const toolbar = this.overlay.querySelector('.snipping-toolbar');
    if (this.hasSelection()) {
      toolbar.style.display = 'block';
      
      // Position toolbar near selection
      const left = Math.min(this.startX, this.endX);
      const top = Math.min(this.startY, this.endY);
      
      toolbar.style.left = (left + 10) + 'px';
      toolbar.style.top = (top - 50) + 'px';
    }
  }

  hasSelection() {
    const width = Math.abs(this.endX - this.startX);
    const height = Math.abs(this.endY - this.startY);
    const minSize = 5; // Minimum 5 pixels in each dimension
    const hasValidSelection = width > minSize && height > minSize;
    console.log('Selection check:', { width, height, hasValidSelection });
    return hasValidSelection;
  }

  activate() {
    console.log('Activate method called, current state:', { isActive: this.isActive, isEnabled: this.isEnabled });
    
    if (this.isActive) {
      console.log('Already active, skipping activation');
      return;
    }
    
    if (!this.overlay) {
      console.error('Overlay not created, reinitializing...');
      this.createOverlay();
    }
    
    // Verify overlay is in DOM
    if (!document.getElementById('snipping-tool-overlay')) {
      console.error('Overlay not found in DOM, recreating...');
      this.createOverlay();
    }
    
    // Ensure canvas is properly sized
    if (this.canvas) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    } else {
      console.error('Canvas not found, overlay may not be properly initialized');
      return;
    }
    
    this.isActive = true;
    this.overlay.style.display = 'block';
    this.overlay.style.visibility = 'visible';
    this.overlay.style.opacity = '1';
    document.body.style.cursor = 'crosshair';
    
    console.log('Overlay should now be visible');
    
    // Reset selection
    if (this.selection) {
      this.selection.style.display = 'none';
    }
    const toolbar = this.overlay.querySelector('.snipping-toolbar');
    if (toolbar) {
      toolbar.style.display = 'none';
    }
    
    // Show initial overlay
    if (this.ctx) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // Load settings and apply color
    this.loadSettings();
    
    console.log('Snipping tool activated successfully');
  }
  
  setSelectedColor(color) {
    this.selectedColor = color;
    console.log('Selection color changed to:', color);
    
    // Update selection border color in CSS
    const style = this.selection.style;
    style.borderColor = color;
    style.boxShadow = `0 0 20px ${color}33, inset 0 0 20px ${color}1a`;
  }

  deactivate() {
    this.isActive = false;
    this.isSelecting = false;
    this.overlay.style.display = 'none';
    document.body.style.cursor = '';
    
    // Reset selection and state
    this.selection.style.display = 'none';
    const toolbar = this.overlay.querySelector('.snipping-toolbar');
    if (toolbar) {
      toolbar.style.display = 'none';
    }
    
    // Clear current screenshot and selection coordinates for next use
    this.currentScreenshot = null;
    this.startX = 0;
    this.startY = 0;
    this.endX = 0;
    this.endY = 0;
    
    console.log('Snipping tool deactivated and reset for next use');
  }

  async captureScreenshot() {
    if (!this.hasSelection()) {
      console.log('No valid selection found');
      return null;
    }

    try {
      console.log('Hiding selection UI before screenshot...');
      // Hide all UI elements to prevent them from appearing in the screenshot
      const wasSelectionVisible = this.selection.style.display !== 'none';
      const wasOverlayVisible = this.overlay.style.display !== 'none';
      
      const toolbar = this.overlay.querySelector('.snipping-toolbar');
      const wasToolbarVisible = toolbar && toolbar.style.display !== 'none';
      
      this.selection.style.display = 'none';
      this.overlay.style.display = 'none';
      if (toolbar) {
        toolbar.style.display = 'none';
      }
      
      // Small delay to ensure UI is hidden
      await new Promise(resolve => setTimeout(resolve, 50));
      
      console.log('Requesting screenshot from background script...');
      // Request screenshot from background script
      const response = await chrome.runtime.sendMessage({
        action: 'capture-screenshot'
      });

      if (response.success) {
        console.log('Screenshot received, cropping...');
        const croppedImage = await this.cropScreenshot(response.screenshot);
        console.log('Screenshot cropped successfully');
        
        // Restore UI visibility if it was visible before
        if (wasSelectionVisible) {
          this.selection.style.display = 'block';
        }
        if (wasOverlayVisible) {
          this.overlay.style.display = 'block';
        }
        if (toolbar && wasToolbarVisible) {
          toolbar.style.display = 'block';
        }
        
        return croppedImage;
      } else {
        console.error('Screenshot capture failed:', response.error);
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      
      // Restore UI visibility on error
      this.selection.style.display = 'block';
      this.overlay.style.display = 'block';
      const toolbar = this.overlay.querySelector('.snipping-toolbar');
      if (toolbar) {
        toolbar.style.display = 'block';
      }
      
      this.showNotification('Failed to capture screenshot. Please try again.', 'error');
      return null;
    }
  }

  cropScreenshot(screenshotDataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const cropCanvas = document.createElement('canvas');
          const cropCtx = cropCanvas.getContext('2d');
          
          // Get selection coordinates without border
          const left = Math.min(this.startX, this.endX);
          const top = Math.min(this.startY, this.endY);
          const width = Math.abs(this.endX - this.startX);
          const height = Math.abs(this.endY - this.startY);
          
          console.log('Original crop dimensions:', { left, top, width, height });
          
          // Account for device pixel ratio for high DPI displays
          const devicePixelRatio = window.devicePixelRatio || 1;
          
          // Calculate the actual screenshot dimensions vs viewport dimensions
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          const screenshotScaleX = img.width / viewportWidth;
          const screenshotScaleY = img.height / viewportHeight;
          
          // Apply the correct scaling based on screenshot vs viewport ratio
          const scaledLeft = Math.round(left * screenshotScaleX);
          const scaledTop = Math.round(top * screenshotScaleY);
          const scaledWidth = Math.round(width * screenshotScaleX);
          const scaledHeight = Math.round(height * screenshotScaleY);
          
          console.log('Corrected dimensions:', { 
            scaledLeft, scaledTop, scaledWidth, scaledHeight, 
            devicePixelRatio, screenshotScaleX, screenshotScaleY,
            imgDimensions: { width: img.width, height: img.height },
            viewportDimensions: { width: viewportWidth, height: viewportHeight }
          });
          
          // Ensure dimensions are valid
          if (scaledWidth <= 0 || scaledHeight <= 0) {
            reject(new Error('Invalid crop dimensions'));
            return;
          }
          
          // Set canvas to match the desired output size (not scaled)
          cropCanvas.width = scaledWidth;
          cropCanvas.height = scaledHeight;
          
          // Disable image smoothing for crisp pixel-perfect cropping
          cropCtx.imageSmoothingEnabled = false;
          cropCtx.webkitImageSmoothingEnabled = false;
          cropCtx.mozImageSmoothingEnabled = false;
          cropCtx.msImageSmoothingEnabled = false;
          
          // Draw the cropped portion at full quality
          cropCtx.drawImage(
            img,
            scaledLeft, scaledTop, scaledWidth, scaledHeight,
            0, 0, scaledWidth, scaledHeight
          );
          
          // Export at maximum quality
          resolve(cropCanvas.toDataURL('image/png'));
        } catch (error) {
          console.error('Error during cropping:', error);
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load screenshot image'));
      };
      
      img.src = screenshotDataUrl;
    });
  }

  async saveToClipboard() {
    console.log('Starting clipboard save...');
    const screenshot = await this.captureScreenshot();
    if (!screenshot) {
      console.log('No screenshot to save');
      return;
    }

    // Store the screenshot for potential download later
    this.currentScreenshot = screenshot;

    try {
      // Try to use the Clipboard API directly in content script context
      if (navigator.clipboard && navigator.clipboard.write) {
        console.log('Using modern Clipboard API');
        // Convert base64 to blob
        const response = await fetch(screenshot);
        const blob = await response.blob();
        
        // Use the modern Clipboard API
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        
        // Show immediate notification like PowerToys
        this.showSystemNotification('Screenshot saved to clipboard!');
        this.showNotification('Screenshot saved to clipboard!');
        this.playSuccessAnimation();
        this.playSound('success');
        
        // Show toolbar to give user option to also save to file
        this.showToolbar();
      } else {
        // Fallback for browsers without Clipboard API
        console.log('Clipboard API not available, trying fallback');
        throw new Error('Clipboard API not available');
      }
    } catch (error) {
      console.error('Failed to save to clipboard:', error);
      
      // Try the background script approach as secondary fallback
      try {
        console.log('Trying background script clipboard fallback');
        const response = await chrome.runtime.sendMessage({
          action: 'save-to-clipboard',
          imageData: screenshot
        });

        if (response.success) {
          // Show immediate notification like PowerToys
          this.showSystemNotification('Screenshot saved to clipboard!');
          this.showNotification('Screenshot saved to clipboard!');
          this.playSuccessAnimation();
          this.playSound('success');
          
          // Show toolbar to give user option to also save to file
          this.showToolbar();
        } else {
          throw new Error(response.error);
        }
      } catch (fallbackError) {
        console.error('Background clipboard fallback failed:', fallbackError);
        this.showSystemNotification('Failed to save to clipboard. Try downloading instead.', 'error');
        this.showNotification('Failed to save to clipboard. Try downloading instead.', 'error');
        this.playSound('error');
        
        // Show toolbar even if clipboard failed, so user can still save to file
        this.showToolbar();
      }
    }

    // Don't deactivate immediately - let user choose to save to file if they want
  }

  async downloadScreenshot() {
    console.log('Starting download...');
    
    // Use stored screenshot if available, otherwise capture new one
    let screenshot = this.currentScreenshot;
    if (!screenshot) {
      console.log('No stored screenshot, capturing new one...');
      screenshot = await this.captureScreenshot();
      if (!screenshot) {
        console.log('No screenshot to download - captureScreenshot returned null/undefined');
        this.showNotification('No screenshot captured. Please select an area first.', 'error');
        return;
      }
      this.currentScreenshot = screenshot;
    }

    console.log('Screenshot ready for download, data length:', screenshot.length);

    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `snipping-tool-${timestamp}.png`;
      
      console.log('Requesting download via background script...');
      const response = await chrome.runtime.sendMessage({
        action: 'download-image',
        imageData: screenshot,
        filename: filename
      });

      console.log('Download response received:', response);

      if (response && response.success) {
        this.showSystemNotification('Screenshot downloaded!');
        this.showNotification('Screenshot downloaded!');
        this.playSuccessAnimation();
        this.playSound('success');
      } else {
        const errorMessage = response?.error || 'Unknown error occurred during download';
        console.error('Download failed:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Failed to download screenshot via background script:', error);
      console.log('Attempting fallback download method...');
      
      // Fallback: Try direct download using anchor element
      try {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `snipping-tool-${timestamp}.png`;
        await this.downloadScreenshotFallback(screenshot, filename);
        this.showSystemNotification('Screenshot downloaded!');
        this.showNotification('Screenshot downloaded!');
        this.playSuccessAnimation();
        this.playSound('success');
      } catch (fallbackError) {
        console.error('Fallback download also failed:', fallbackError);
        this.showSystemNotification('Failed to download screenshot. Please try again.', 'error');
        this.showNotification('Failed to download screenshot. Please try again.', 'error');
        this.playSound('error');
      }
    }

    this.deactivate();
  }

  // Fallback download method using anchor element
  async downloadScreenshotFallback(imageData, filename) {
    return new Promise((resolve, reject) => {
      try {
        const link = document.createElement('a');
        link.href = imageData;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('Fallback download initiated');
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `snipping-notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // PowerToys-style system notification
  showSystemNotification(message, type = 'success') {
    try {
      // Try background script notification first (more reliable)
      chrome.runtime.sendMessage({
        action: 'show-system-notification',
        title: 'Advanced Snipping Tool',
        message: message,
        type: type
      }).then(response => {
        if (response && response.success) {
          return; // Background notification succeeded
        }
        throw new Error('Background notification failed');
      }).catch(() => {
        // Fallback to browser notification API
        this.showBrowserNotification(message, type);
      });

    } catch (error) {
      console.log('System notification failed, using fallback:', error);
      this.showBrowserNotification(message, type);
    }
  }

  // Browser notification API fallback
  showBrowserNotification(message, type = 'success') {
    try {
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          const notification = new Notification('Advanced Snipping Tool', {
            body: message,
            icon: chrome.runtime.getURL('icons/icon48.png'),
            badge: chrome.runtime.getURL('icons/icon16.png'),
            tag: 'snipping-tool-notification',
            requireInteraction: false,
            silent: false
          });
          
          // Auto-close after 4 seconds
          setTimeout(() => {
            notification.close();
          }, 4000);
          
          return;
        } else if (Notification.permission !== 'denied') {
          // Request permission for future notifications
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              this.showBrowserNotification(message, type);
            } else {
              this.showPowerToysStyleToast(message, type);
            }
          });
          return;
        }
      }
      
      // Final fallback: Create a prominent toast-style notification
      this.showPowerToysStyleToast(message, type);
      
    } catch (error) {
      console.log('Browser notification failed, using toast:', error);
      this.showPowerToysStyleToast(message, type);
    }
  }

  // PowerToys-style toast notification as fallback
  showPowerToysStyleToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `snipping-toast ${type}`;
    
    const iconColor = type === 'error' ? '#ef4444' : '#10b981';
    const bgColor = type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)';
    
    toast.innerHTML = `
      <div class="toast-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="${iconColor}">
          ${type === 'error' 
            ? '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>' 
            : '<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>'}
        </svg>
      </div>
      <div class="toast-message">${message}</div>
    `;
    
    toast.style.cssText = `
      position: fixed;
      bottom: 30px;
      right: 30px;
      background: ${bgColor};
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 16px 20px;
      color: ${iconColor};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      z-index: 2147483647;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 300px;
      max-width: 400px;
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
    `;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    requestAnimationFrame(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    });
    
    // Auto-remove after 5 seconds with animation
    setTimeout(() => {
      toast.style.transform = 'translateY(100px)';
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 5000);
  }

  // Advanced feature: Screenshot history
  addToHistory(screenshot) {
    const historyItem = {
      id: Date.now(),
      screenshot: screenshot,
      timestamp: new Date().toISOString(),
      dimensions: this.getSelectionDimensions()
    };
    
    this.history.unshift(historyItem);
    
    // Keep only last 10 screenshots
    if (this.history.length > 10) {
      this.history = this.history.slice(0, 10);
    }
    
    // Store in local storage
    try {
      chrome.runtime.sendMessage({
        action: 'save-history',
        history: this.history
      });
    } catch (error) {
      console.warn('Could not save history:', error);
    }
  }

  // Advanced feature: Batch operations
  async saveToMultipleFormats() {
    const screenshot = await this.captureScreenshot();
    if (!screenshot) return;

    // Save as PNG
    await this.saveScreenshotAs(screenshot, 'png');
    
    // Save as JPEG
    await this.saveScreenshotAs(screenshot, 'jpeg', 0.9);
    
    this.showNotification('Saved in multiple formats!', 'success');
    this.deactivate();
  }

  async saveScreenshotAs(screenshot, format, quality = 1.0) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Disable image smoothing for crisp pixel-perfect output
        ctx.imageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
        
        ctx.drawImage(img, 0, 0);
        
        const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
        const dataUrl = canvas.toDataURL(mimeType, quality);
        
        const filename = `snipping-tool-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.${format}`;
        
        chrome.runtime.sendMessage({
          action: 'download-image',
          imageData: dataUrl,
          filename: filename
        }).then(resolve);
      };
      img.src = screenshot;
    });
  }

  // Advanced feature: OCR text extraction
  async extractTextFromSelection() {
    const screenshot = await this.captureScreenshot();
    if (!screenshot) return;

    try {
      // Simple OCR using Tesseract.js (would need to be included)
      this.showNotification('Text extraction feature coming soon!', 'info');
      
      // Since clipboard is automatic, no need to manually call saveToClipboard
      // The text would be processed and added to clipboard when OCR is implemented
    } catch (error) {
      console.error('OCR failed:', error);
      this.showNotification('Text extraction failed', 'error');
    }
  }

  // Advanced feature: Smart selection suggestions
  suggestSelection() {
    const elements = document.elementsFromPoint(
      (this.startX + this.endX) / 2,
      (this.startY + this.endY) / 2
    );
    
    // Find the most relevant element
    const relevantElement = elements.find(el => 
      el.tagName && !['HTML', 'BODY', 'DIV'].includes(el.tagName)
    ) || elements[0];
    
    if (relevantElement) {
      const rect = relevantElement.getBoundingClientRect();
      const scrollX = window.pageXOffset;
      const scrollY = window.pageYOffset;
      
      // Suggest better selection bounds
      this.startX = rect.left + scrollX - 5;
      this.startY = rect.top + scrollY - 5;
      this.endX = rect.right + scrollX + 5;
      this.endY = rect.bottom + scrollY + 5;
      
      this.updateSelection();
      this.showNotification('Selection optimized!', 'success');
    }
  }

  // Advanced feature: Selection dimensions display
  getSelectionDimensions() {
    const width = Math.abs(this.endX - this.startX);
    const height = Math.abs(this.endY - this.startY);
    return { width, height };
  }

  showDimensions() {
    const { width, height } = this.getSelectionDimensions();
    
    // Create or update dimensions display
    let dimensionsEl = document.getElementById('snipping-dimensions');
    if (!dimensionsEl) {
      dimensionsEl = document.createElement('div');
      dimensionsEl.id = 'snipping-dimensions';
      dimensionsEl.className = 'snipping-dimensions';
      this.overlay.appendChild(dimensionsEl);
    }
    
    dimensionsEl.textContent = `${Math.round(width)} × ${Math.round(height)}px`;
    dimensionsEl.style.left = Math.min(this.startX, this.endX) + 'px';
    dimensionsEl.style.top = (Math.min(this.startY, this.endY) - 30) + 'px';
    dimensionsEl.style.display = 'block';
  }

  // Advanced feature: Keyboard shortcuts enhancement
  handleAdvancedKeyboard(e) {
    if (!this.isActive) return;

    switch (e.key) {
      case 'c':
        // Ctrl+C no longer needed since clipboard is automatic
        // Could repurpose for copy additional info or leave empty
        break;
      case 'd':
        if (e.ctrlKey) {
          e.preventDefault();
          this.downloadScreenshot();
        }
        break;
      case 'b':
        if (e.ctrlKey) {
          e.preventDefault();
          this.saveToMultipleFormats();
        }
        break;
      case 'o':
        if (e.ctrlKey) {
          e.preventDefault();
          this.suggestSelection();
        }
        break;
      case 't':
        if (e.ctrlKey) {
          e.preventDefault();
          this.extractTextFromSelection();
        }
        break;
    }
  }

  // Advanced feature: Animation effects
  playSuccessAnimation() {
    if (!this.settings.animationsEnabled) return;

    const flash = document.createElement('div');
    flash.className = 'snipping-flash';
    flash.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(20, 184, 166, 0.3);
      z-index: 2147483646;
      pointer-events: none;
      animation: flashAnimation 0.3s ease-out;
    `;

    document.body.appendChild(flash);

    setTimeout(() => {
      flash.remove();
    }, 300);
  }

  // Advanced feature: Sound feedback
  playSound(type = 'capture') {
    if (!this.settings.soundEnabled) return;

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different sounds for different actions
      switch (type) {
        case 'capture':
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
          break;
        case 'error':
          oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
          break;
        case 'success':
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(900, audioContext.currentTime + 0.1);
          break;
      }

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      // Sound failed, continue silently
    }
  }

  // Load user settings
  async loadSettings() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'get-settings'
      });
      
      if (response.success) {
        this.settings = { ...this.settings, ...response.settings };
        
        // Apply selected color if available
        if (response.settings && response.settings.selectedColor) {
          this.setSelectedColor(response.settings.selectedColor);
        }
      }
    } catch (error) {
      console.warn('Could not load settings:', error);
    }
  }
}

// Initialize the snipping tool
try {
  if (!window.snippingTool) {
    console.log('Creating new snipping tool instance');
    window.snippingTool = new SnippingTool();
  } else {
    console.log('Snipping tool already exists');
  }
} catch (error) {
  console.error('Failed to initialize snipping tool:', error);
}