// Advanced Snipping Tool Popup Script
class SnippingToolPopup {
  constructor() {
    this.isEnabled = true;
    this.settings = {
      saveLocation: 'clipboard',
      imageFormat: 'png',
      imageQuality: 'high'
    };
    
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.bindEvents();
    this.updateUI();
  }

  async loadSettings() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'get-settings'
      });

      if (response.success) {
        this.isEnabled = response.isEnabled;
        this.settings = { ...this.settings, ...response.settings };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  bindEvents() {
    // Quick action buttons
    document.getElementById('start-snipping').addEventListener('click', () => {
      this.startSnipping();
    });

    document.getElementById('toggle-tool').addEventListener('click', () => {
      this.toggleTool();
    });

    // Settings
    document.getElementById('save-location').addEventListener('change', (e) => {
      this.updateSetting('saveLocation', e.target.value);
    });

    document.getElementById('image-format').addEventListener('change', (e) => {
      this.updateSetting('imageFormat', e.target.value);
    });

    document.getElementById('image-quality').addEventListener('change', (e) => {
      this.updateSetting('imageQuality', e.target.value);
    });

    // Footer links
    document.getElementById('help-link').addEventListener('click', (e) => {
      e.preventDefault();
      this.showHelp();
    });

    document.getElementById('feedback-link').addEventListener('click', (e) => {
      e.preventDefault();
      this.showFeedback();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleKeyboard(e);
    });
  }

  updateUI() {
    // Update status indicator
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    const toggleButton = document.getElementById('toggle-tool');
    const toggleText = document.getElementById('toggle-text');

    if (this.isEnabled) {
      statusDot.classList.remove('inactive');
      statusText.textContent = 'Active';
      toggleText.textContent = 'Disable';
      toggleButton.classList.remove('disabled');
    } else {
      statusDot.classList.add('inactive');
      statusText.textContent = 'Disabled';
      toggleText.textContent = 'Enable';
      toggleButton.classList.add('disabled');
    }

    // Update settings UI
    document.getElementById('save-location').value = this.settings.saveLocation || 'clipboard';
    document.getElementById('image-format').value = this.settings.imageFormat || 'png';
    document.getElementById('image-quality').value = this.settings.imageQuality || 'high';

    // Update start button state
    const startButton = document.getElementById('start-snipping');
    if (this.isEnabled) {
      startButton.disabled = false;
      startButton.style.opacity = '1';
    } else {
      startButton.disabled = true;
      startButton.style.opacity = '0.5';
    }
  }

  async startSnipping() {
    if (!this.isEnabled) return;

    try {
      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab) {
        // Send message to background script to activate snipping
        await chrome.runtime.sendMessage({
          action: 'activate-snipping'
        });

        // Close popup after starting snipping
        window.close();
      }
    } catch (error) {
      console.error('Failed to start snipping:', error);
      this.showNotification('Failed to start snipping', 'error');
    }
  }

  async toggleTool() {
    try {
      await chrome.runtime.sendMessage({
        action: 'toggle-snipping'
      });

      this.isEnabled = !this.isEnabled;
      this.updateUI();

      const message = this.isEnabled ? 'Snipping tool enabled' : 'Snipping tool disabled';
      this.showNotification(message);
    } catch (error) {
      console.error('Failed to toggle tool:', error);
      this.showNotification('Failed to toggle tool', 'error');
    }
  }

  async updateSetting(key, value) {
    this.settings[key] = value;

    try {
      await chrome.runtime.sendMessage({
        action: 'update-settings',
        settings: this.settings
      });

      this.showNotification('Settings updated');
    } catch (error) {
      console.error('Failed to update settings:', error);
      this.showNotification('Failed to update settings', 'error');
    }
  }

  handleKeyboard(e) {
    // Handle keyboard shortcuts in popup
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 's':
          if (e.shiftKey) {
            e.preventDefault();
            this.startSnipping();
          }
          break;
        case 't':
          if (e.shiftKey) {
            e.preventDefault();
            this.toggleTool();
          }
          break;
      }
    }

    // Close popup on Escape
    if (e.key === 'Escape') {
      window.close();
    }
  }

  showHelp() {
    // Create help modal or redirect to help page
    const helpContent = `
      <div class="help-modal">
        <h3>How to Use Advanced Snipping Tool</h3>
        <div class="help-content">
          <h4>Getting Started:</h4>
          <ul>
            <li>Click the extension icon or press <kbd>Ctrl+Shift+S</kbd> to start snipping</li>
            <li>Click and drag to select the area you want to capture</li>
            <li>Use the toolbar buttons to save or cancel</li>
          </ul>
          
          <h4>Keyboard Shortcuts:</h4>
          <ul>
            <li><kbd>Ctrl+Shift+S</kbd> - Activate snipping tool</li>
            <li><kbd>Ctrl+Shift+T</kbd> - Toggle tool on/off</li>
            <li><kbd>Escape</kbd> - Cancel current selection</li>
            <li><kbd>Enter</kbd> - Save selection to clipboard</li>
          </ul>
          
          <h4>Save Options:</h4>
          <ul>
            <li><strong>Clipboard:</strong> Instantly copy to clipboard for pasting</li>
            <li><strong>Download:</strong> Save as file to your Downloads folder</li>
            <li><strong>Both:</strong> Copy to clipboard and download file</li>
          </ul>
          
          <h4>Tips:</h4>
          <ul>
            <li>Works on any website or web page</li>
            <li>Captures exactly what you see on screen</li>
            <li>Modern glassy design with smooth animations</li>
            <li>Supports high-resolution displays</li>
          </ul>
        </div>
        <button class="close-help">Close</button>
      </div>
    `;

    this.showModal(helpContent);
  }

  showFeedback() {
    // Create feedback modal
    const feedbackContent = `
      <div class="feedback-modal">
        <h3>Send Feedback</h3>
        <div class="feedback-content">
          <p>We'd love to hear from you! Your feedback helps us improve the Advanced Snipping Tool.</p>
          
          <div class="feedback-options">
            <a href="mailto:feedback@snippingtool.com?subject=Advanced Snipping Tool Feedback" class="feedback-btn">
              📧 Send Email
            </a>
            <a href="https://github.com/Archikainthebag/Snipping-Tool/issues" target="_blank" class="feedback-btn">
              🐛 Report Bug
            </a>
            <a href="https://github.com/Archikainthebag/Snipping-Tool/discussions" target="_blank" class="feedback-btn">
              💡 Feature Request
            </a>
          </div>
          
          <div class="rating-section">
            <p>Rate your experience:</p>
            <div class="star-rating">
              <span class="star" data-rating="1">⭐</span>
              <span class="star" data-rating="2">⭐</span>
              <span class="star" data-rating="3">⭐</span>
              <span class="star" data-rating="4">⭐</span>
              <span class="star" data-rating="5">⭐</span>
            </div>
          </div>
        </div>
        <button class="close-feedback">Close</button>
      </div>
    `;

    this.showModal(feedbackContent);
  }

  showModal(content) {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = content;

    // Add modal styles
    const modalStyles = `
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        backdrop-filter: blur(10px);
      }
      
      .help-modal, .feedback-modal {
        background: linear-gradient(135deg, #0f172a, #1e293b);
        border: 1px solid rgba(20, 184, 166, 0.3);
        border-radius: 12px;
        padding: 24px;
        max-width: 400px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      }
      
      .help-modal h3, .feedback-modal h3 {
        color: #14b8a6;
        margin-bottom: 16px;
        text-align: center;
      }
      
      .help-content, .feedback-content {
        color: #e2e8f0;
        font-size: 13px;
        line-height: 1.5;
      }
      
      .help-content h4 {
        color: #14b8a6;
        margin: 16px 0 8px 0;
        font-size: 14px;
      }
      
      .help-content ul {
        margin-left: 16px;
        margin-bottom: 12px;
      }
      
      .help-content kbd {
        background: rgba(20, 184, 166, 0.2);
        border: 1px solid rgba(20, 184, 166, 0.3);
        border-radius: 3px;
        padding: 2px 6px;
        font-size: 11px;
        color: #14b8a6;
      }
      
      .feedback-options {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin: 16px 0;
      }
      
      .feedback-btn {
        background: linear-gradient(135deg, rgba(20, 184, 166, 0.1), rgba(6, 182, 212, 0.1));
        border: 1px solid rgba(20, 184, 166, 0.3);
        border-radius: 8px;
        padding: 12px;
        color: #14b8a6;
        text-decoration: none;
        text-align: center;
        transition: all 0.3s ease;
      }
      
      .feedback-btn:hover {
        background: linear-gradient(135deg, rgba(20, 184, 166, 0.2), rgba(6, 182, 212, 0.2));
        transform: translateY(-1px);
      }
      
      .star-rating {
        display: flex;
        gap: 4px;
        justify-content: center;
        margin-top: 8px;
      }
      
      .star {
        cursor: pointer;
        font-size: 20px;
        transition: transform 0.2s ease;
      }
      
      .star:hover {
        transform: scale(1.2);
      }
      
      .close-help, .close-feedback {
        background: linear-gradient(135deg, #14b8a6, #06b6d4);
        border: none;
        border-radius: 8px;
        color: white;
        padding: 10px 20px;
        cursor: pointer;
        margin-top: 16px;
        width: 100%;
        transition: all 0.3s ease;
      }
      
      .close-help:hover, .close-feedback:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
      }
    `;

    // Add styles to head
    const styleSheet = document.createElement('style');
    styleSheet.textContent = modalStyles;
    document.head.appendChild(styleSheet);

    document.body.appendChild(modal);

    // Bind close events
    const closeBtn = modal.querySelector('.close-help, .close-feedback');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.remove();
        styleSheet.remove();
      });
    }

    // Close on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
        styleSheet.remove();
      }
    });

    // Bind star rating events
    const stars = modal.querySelectorAll('.star');
    stars.forEach((star, index) => {
      star.addEventListener('click', () => {
        const rating = index + 1;
        this.submitRating(rating);
        this.showNotification(`Thanks for rating us ${rating} stars!`);
      });
    });
  }

  async submitRating(rating) {
    // Store rating in local storage or send to analytics
    try {
      await chrome.storage.local.set({ userRating: rating });
    } catch (error) {
      console.error('Failed to save rating:', error);
    }
  }

  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `popup-notification ${type}`;
    notification.textContent = message;

    // Add notification styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #0f172a, #1e293b);
      border: 1px solid rgba(20, 184, 166, 0.3);
      border-radius: 8px;
      padding: 12px 16px;
      color: ${type === 'error' ? '#ef4444' : '#14b8a6'};
      font-size: 12px;
      z-index: 10000;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      animation: slideInNotification 0.3s ease;
    `;

    // Add animation
    const notificationStyles = `
      @keyframes slideInNotification {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = notificationStyles;
    document.head.appendChild(styleSheet);

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
      styleSheet.remove();
    }, 3000);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new SnippingToolPopup();
});