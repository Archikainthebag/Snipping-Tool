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
    
    this.init();
  }

  init() {
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true;
    });

    // Check if already initialized to prevent duplicate overlays
    if (document.getElementById('snipping-tool-overlay')) {
      return;
    }

    this.createOverlay();
    this.bindEvents();
  }

  handleMessage(request, sender, sendResponse) {
    console.log('Content script received message:', request.action);
    switch (request.action) {
      case 'activate-snipping':
        if (this.isEnabled) {
          console.log('Activating snipping tool');
          this.activate();
        } else {
          console.log('Snipping tool is disabled');
        }
        sendResponse({ success: true });
        break;
      case 'toggle-state':
        this.isEnabled = request.isEnabled;
        console.log('Toggle state:', this.isEnabled);
        if (!this.isEnabled && this.isActive) {
          this.deactivate();
        }
        sendResponse({ success: true });
        break;
      case 'ping':
        sendResponse({ success: true, active: this.isActive, enabled: this.isEnabled });
        break;
    }
  }

  createOverlay() {
    // Create main overlay
    this.overlay = document.createElement('div');
    this.overlay.id = 'snipping-tool-overlay';
    this.overlay.className = 'snipping-overlay';
    
    // Create selection area
    this.selection = document.createElement('div');
    this.selection.className = 'snipping-selection';
    this.overlay.appendChild(this.selection);

    // Create toolbar
    this.createToolbar();

    // Create canvas for drawing selection
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'snipping-canvas';
    this.overlay.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    document.body.appendChild(this.overlay);
  }

  createToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'snipping-toolbar';
    toolbar.innerHTML = `
      <div class="toolbar-buttons">
        <button class="toolbar-btn" id="save-clipboard" title="Save to Clipboard">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
          </svg>
        </button>
        <button class="toolbar-btn" id="save-download" title="Download">
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
    toolbar.querySelector('#save-clipboard').addEventListener('click', () => {
      this.saveToClipboard();
    });

    toolbar.querySelector('#save-download').addEventListener('click', () => {
      this.downloadScreenshot();
    });

    toolbar.querySelector('#cancel-snip').addEventListener('click', () => {
      this.deactivate();
    });
  }

  bindEvents() {
    // Mouse events for selection
    this.overlay.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.overlay.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.overlay.addEventListener('mouseup', (e) => this.onMouseUp(e));

    // Keyboard events
    document.addEventListener('keydown', (e) => this.onKeyDown(e));

    // Prevent context menu on overlay
    this.overlay.addEventListener('contextmenu', (e) => e.preventDefault());
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
    this.showToolbar();
    e.preventDefault();
  }

  onKeyDown(e) {
    if (!this.isActive) return;
    
    if (e.key === 'Escape') {
      this.deactivate();
    } else if (e.key === 'Enter' && this.hasSelection()) {
      this.saveToClipboard();
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

    // Update canvas size and draw selection
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    this.drawOverlay(left, top, width, height);
  }

  drawOverlay(selLeft, selTop, selWidth, selHeight) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw dark overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Clear selection area
    this.ctx.clearRect(selLeft, selTop, selWidth, selHeight);
    
    // Draw selection border
    this.ctx.strokeStyle = '#14b8a6'; // Teal color
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(selLeft, selTop, selWidth, selHeight);
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
    return Math.abs(this.endX - this.startX) > 10 && Math.abs(this.endY - this.startY) > 10;
  }

  activate() {
    if (this.isActive) return;
    
    this.isActive = true;
    this.overlay.style.display = 'block';
    document.body.style.cursor = 'crosshair';
    
    // Reset selection
    this.selection.style.display = 'none';
    this.overlay.querySelector('.snipping-toolbar').style.display = 'none';
    
    // Resize canvas
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    // Show initial overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  deactivate() {
    this.isActive = false;
    this.isSelecting = false;
    this.overlay.style.display = 'none';
    document.body.style.cursor = '';
    
    // Reset selection
    this.selection.style.display = 'none';
    this.overlay.querySelector('.snipping-toolbar').style.display = 'none';
  }

  async captureScreenshot() {
    if (!this.hasSelection()) return null;

    try {
      // Request screenshot from background script
      const response = await chrome.runtime.sendMessage({
        action: 'capture-screenshot'
      });

      if (response.success) {
        return this.cropScreenshot(response.screenshot);
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      return null;
    }
  }

  cropScreenshot(screenshotDataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const cropCanvas = document.createElement('canvas');
        const cropCtx = cropCanvas.getContext('2d');
        
        const left = Math.min(this.startX, this.endX);
        const top = Math.min(this.startY, this.endY);
        const width = Math.abs(this.endX - this.startX);
        const height = Math.abs(this.endY - this.startY);
        
        // Account for device pixel ratio
        const devicePixelRatio = window.devicePixelRatio || 1;
        const scaledLeft = left * devicePixelRatio;
        const scaledTop = top * devicePixelRatio;
        const scaledWidth = width * devicePixelRatio;
        const scaledHeight = height * devicePixelRatio;
        
        cropCanvas.width = scaledWidth;
        cropCanvas.height = scaledHeight;
        
        cropCtx.drawImage(
          img,
          scaledLeft, scaledTop, scaledWidth, scaledHeight,
          0, 0, scaledWidth, scaledHeight
        );
        
        resolve(cropCanvas.toDataURL('image/png'));
      };
      img.src = screenshotDataUrl;
    });
  }

  async saveToClipboard() {
    const screenshot = await this.captureScreenshot();
    if (!screenshot) return;

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'save-to-clipboard',
        imageData: screenshot
      });

      if (response.success) {
        this.showNotification('Screenshot saved to clipboard!');
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Failed to save to clipboard:', error);
      this.showNotification('Failed to save to clipboard', 'error');
    }

    this.deactivate();
  }

  async downloadScreenshot() {
    const screenshot = await this.captureScreenshot();
    if (!screenshot) return;

    try {
      const filename = `snipping-tool-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
      
      const response = await chrome.runtime.sendMessage({
        action: 'download-image',
        imageData: screenshot,
        filename: filename
      });

      if (response.success) {
        this.showNotification('Screenshot downloaded!');
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Failed to download screenshot:', error);
      this.showNotification('Failed to download screenshot', 'error');
    }

    this.deactivate();
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
      
      // For now, just copy the screenshot
      await this.saveToClipboard();
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
        if (e.ctrlKey) {
          e.preventDefault();
          this.saveToClipboard();
        }
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
      }
    } catch (error) {
      console.warn('Could not load settings:', error);
    }
  }
}

// Initialize the snipping tool
if (!window.snippingTool) {
  window.snippingTool = new SnippingTool();
}