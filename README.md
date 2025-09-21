# Advanced Browser Snipping Tool 🎨✂️

A modern, advanced browser extension for taking screenshots with a beautiful dark teal glassy design. Capture any part of any webpage with precision and style.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Browser](https://img.shields.io/badge/browser-Chrome%20%7C%20Edge%20%7C%20Firefox-orange.svg)

## 🌟 Features

### ✨ **Advanced Screenshot Capture**
- **Universal Compatibility**: Works on any website, any tab, any browser
- **Precision Selection**: Click and drag to select exactly what you want to capture
- **High-Quality Output**: Captures at full resolution with crystal-clear quality
- **Real-time Preview**: See your selection with modern glassy overlay effects

### 🎨 **Modern Design**
- **Dark Teal Theme**: Beautiful gradient design with glassy blur effects
- **Smooth Animations**: Fluid transitions and hover effects
- **Responsive UI**: Adapts to different screen sizes and resolutions
- **Accessibility**: High contrast mode and reduced motion support

### ⚡ **Powerful Functionality**
- **Multiple Save Options**: 
  - Save to clipboard for instant pasting
  - Download as file to your computer
  - Save to both clipboard and file simultaneously
- **Keyboard Shortcuts**: Quick access with customizable hotkeys
- **Toggle On/Off**: Enable or disable the tool as needed
- **Settings Persistence**: Your preferences are saved automatically

### 🎯 **Smart Features**
- **Escape to Cancel**: Press ESC anytime to cancel selection
- **Enter to Save**: Quick save to clipboard with Enter key
- **Visual Feedback**: Clear indicators and notifications
- **Error Handling**: Graceful fallbacks and user-friendly error messages

## 🚀 Installation

### For Chrome/Edge (Chromium-based browsers):

1. **Download the Extension**
   ```bash
   git clone https://github.com/Archikainthebag/Snipping-Tool.git
   cd Snipping-Tool
   ```

2. **Load in Developer Mode**
   - Open Chrome/Edge and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked" and select the `Snipping-Tool` folder

3. **Pin the Extension**
   - Click the puzzle piece icon in your browser toolbar
   - Find "Advanced Snipping Tool" and click the pin icon

### For Firefox:

1. **Load Temporarily**
   - Open Firefox and go to `about:debugging`
   - Click "This Firefox" → "Load Temporary Add-on"
   - Select any file in the `Snipping-Tool` folder

2. **For Permanent Installation**
   - Package the extension as a `.xpi` file
   - Or submit to Firefox Add-ons store

## 🎮 Usage

### Quick Start:
1. **Activate**: Press `Ctrl+Shift+S` (or `Cmd+Shift+S` on Mac)
2. **Select**: Click and drag to select the area you want to capture
3. **Save**: Choose from the toolbar options:
   - 📋 Save to clipboard
   - 💾 Download as file
   - ❌ Cancel selection

### Keyboard Shortcuts:
| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+S` | Activate snipping tool |
| `Ctrl+Shift+T` | Toggle tool on/off |
| `Escape` | Cancel current selection |
| `Enter` | Save selection to clipboard |

### Extension Popup:
- Click the extension icon to access settings
- Toggle the tool on/off
- Configure save preferences
- View help and shortcuts

## ⚙️ Configuration

### Settings Options:
- **Save Location**: Clipboard, Download, or Both
- **Image Format**: PNG, JPG, or WebP
- **Image Quality**: High, Medium, or Low
- **Theme**: Dark teal (with future theme options planned)

### Advanced Features:
- **Multi-monitor Support**: Works across multiple displays
- **High DPI Support**: Perfect quality on retina/4K displays
- **Memory Efficient**: Minimal resource usage
- **Privacy Focused**: No data collection or external requests

## 🛠️ Development

### Prerequisites:
- Node.js (for icon generation)
- Modern browser with extension support
- Basic knowledge of JavaScript/CSS

### File Structure:
```
Snipping-Tool/
├── manifest.json          # Extension configuration
├── background.js           # Service worker (main logic)
├── content.js             # Content script (UI overlay)
├── styles.css             # Modern glassy styles
├── popup.html             # Settings popup
├── popup.css              # Popup styles
├── popup.js               # Popup functionality
├── icons/                 # Extension icons
├── create-icons.js        # Icon generation script
└── README.md              # This file
```

### Key Components:

#### 🎯 **Background Script** (`background.js`)
- Handles keyboard shortcuts and commands
- Manages screenshot capture via Chrome APIs
- Coordinates clipboard and download operations
- Stores user settings and preferences

#### 🎨 **Content Script** (`content.js`)
- Creates the beautiful overlay interface
- Handles mouse selection interactions
- Manages the glassy toolbar UI
- Processes user actions and coordinates with background

#### 💎 **Modern Styling** (`styles.css`)
- Dark teal gradient theme with glassmorphism effects
- Smooth animations and transitions
- Responsive design for all screen sizes
- Accessibility features (high contrast, reduced motion)

## 🎨 Design Philosophy

This extension embraces modern web design trends:

- **Glassmorphism**: Translucent backgrounds with blur effects
- **Dark Theme**: Easy on the eyes with teal accent colors
- **Micro-interactions**: Subtle animations that provide feedback
- **Minimalism**: Clean interface that doesn't distract from content
- **Accessibility**: Respects user preferences for motion and contrast

## 🤝 Contributing

We welcome contributions! Please feel free to:

1. **Report Bugs**: Open an issue with details
2. **Suggest Features**: Share your ideas for improvements
3. **Submit PRs**: Follow our coding standards
4. **Improve Documentation**: Help make instructions clearer

### Development Setup:
```bash
git clone https://github.com/Archikainthebag/Snipping-Tool.git
cd Snipping-Tool
# Load as unpacked extension in browser
# Make changes and test
# Submit pull request
```

## 📋 Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 88+ | ✅ Fully Supported |
| Edge | 88+ | ✅ Fully Supported |
| Firefox | 90+ | ✅ Supported |
| Safari | 14+ | 🔄 In Development |
| Opera | 74+ | ✅ Supported |

## 🔒 Privacy & Security

- **No Data Collection**: We don't collect any personal information
- **Local Storage Only**: Settings stored locally on your device
- **No External Requests**: Everything runs locally in your browser
- **Minimal Permissions**: Only requests necessary permissions
- **Open Source**: Full transparency with public code

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the Windows Snipping Tool
- Built with modern web technologies
- Designed for the community, by the community

## 📞 Support

Need help? Here's how to get support:

- 📧 **Email**: [Create an issue](https://github.com/Archikainthebag/Snipping-Tool/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/Archikainthebag/Snipping-Tool/discussions)
- 🐛 **Bug Reports**: [Issue Tracker](https://github.com/Archikainthebag/Snipping-Tool/issues)
- ⭐ **Feature Requests**: [Feature Request Template](https://github.com/Archikainthebag/Snipping-Tool/issues/new)

---

**Made with ❤️ for the web community**

*Capture the web, beautifully.* ✨