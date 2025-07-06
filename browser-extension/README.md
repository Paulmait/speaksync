# SpeakSync Browser Extension

A cross-platform browser extension that provides a draggable, customizable, semi-transparent overlay teleprompter for video conferencing and presentations.

## Features

### Core Functionality
- **Draggable Overlay**: Semi-transparent teleprompter that can be positioned anywhere on screen
- **Video Conferencing Integration**: Works seamlessly with Google Meet, Zoom, Microsoft Teams
- **Real-time Synchronization**: Stays synchronized with the main SpeakSync web application
- **Cross-platform Support**: Compatible with Chrome, Edge, and Firefox

### Overlay Features
- **Customizable Appearance**: Adjustable opacity, font size, colors, and fonts
- **Flexible Positioning**: Drag to any position or use preset locations
- **Resizable Window**: Resize handles for optimal viewing
- **Auto-scroll Highlighting**: Current paragraph highlighting with smooth transitions
- **Responsive Design**: Adapts to different screen sizes and resolutions

### Smart Integration
- **Platform Detection**: Automatically detects supported video conferencing platforms
- **Layout Adaptation**: Adjusts positioning based on platform-specific UI changes
- **Viewport Constraints**: Prevents overlay from moving outside visible area
- **Accessibility Support**: High contrast mode, reduced motion support

## Installation

### Development Installation
1. Clone the repository and navigate to the browser extension directory
2. Open your browser's extension management page:
   - **Chrome**: `chrome://extensions/`
   - **Edge**: `edge://extensions/`
   - **Firefox**: `about:addons`
3. Enable "Developer mode" (Chrome/Edge) or "Debug add-ons" (Firefox)
4. Click "Load unpacked" and select the `browser-extension` folder

### Production Installation
- **Chrome Web Store**: [Install SpeakSync Overlay](https://chrome.google.com/webstore) (coming soon)
- **Edge Add-ons**: [Install SpeakSync Overlay](https://microsoftedge.microsoft.com/addons) (coming soon)
- **Firefox Add-ons**: [Install SpeakSync Overlay](https://addons.mozilla.org) (coming soon)

## Usage

### Getting Started
1. Install the extension and navigate to a supported video conferencing platform
2. Click the SpeakSync extension icon in your browser toolbar
3. Click "Connect to SpeakSync App" to establish connection with the main application
4. Click "Start Overlay" to activate the teleprompter overlay

### Connecting to SpeakSync App
The extension needs to connect to your main SpeakSync web application to receive script content and synchronization data:

1. Open [SpeakSync Web App](https://app.speaksync.io) in another tab
2. Start a teleprompter session in the web app
3. Use the browser extension popup to connect and activate the overlay

### Customizing the Overlay
Access the settings panel in the extension popup to customize:

- **Opacity**: Adjust transparency (30% - 100%)
- **Font Size**: Change text size (12px - 48px)
- **Font Family**: Select from multiple font options
- **Colors**: Customize text and background colors
- **Position**: Use preset positions or drag manually
- **Size**: Resize the overlay window as needed

### Supported Platforms
- **Google Meet**: Full support with automatic layout detection
- **Zoom**: Web client support with UI adaptation
- **Microsoft Teams**: Web client support with iframe handling

## Technical Architecture

### Extension Components

#### Background Service Worker (`background.js`)
- Manages extension state and cross-tab communication
- Handles connections to the main SpeakSync application
- Coordinates script synchronization and settings updates
- Monitors tab changes and platform detection

#### Content Scripts (`content.js`)
- Injects overlay interface into video conferencing pages
- Handles platform-specific optimizations
- Manages overlay positioning and interaction
- Communicates with background script for state updates

#### Popup Interface (`popup.html/js/css`)
- Provides user interface for extension control
- Settings management and customization options
- Connection status and platform detection display
- Real-time overlay control and monitoring

### Communication Flow
1. **User Opens Extension**: Popup checks current tab and connection status
2. **Platform Detection**: Content script identifies video conferencing platform
3. **Connection Establishment**: Background script connects to SpeakSync web app
4. **Overlay Activation**: Content script injects customizable overlay
5. **Real-time Sync**: Continuous synchronization of script content and position

### Security & Privacy
- **Minimal Permissions**: Only requests necessary permissions for functionality
- **Secure Communication**: Uses Chrome's secure messaging APIs
- **No Data Storage**: Doesn't store personal or script data permanently
- **Local Processing**: All overlay rendering happens locally in the browser

## Development

### Project Structure
```
browser-extension/
├── manifest.json                 # Extension manifest (Manifest V3)
├── src/
│   ├── background/
│   │   └── background.js        # Service worker
│   ├── content/
│   │   ├── content.js          # Content script
│   │   └── content.css         # Overlay styles
│   ├── popup/
│   │   ├── popup.html          # Extension popup
│   │   ├── popup.js            # Popup logic
│   │   └── popup.css           # Popup styles
│   └── overlay/
│       └── overlay.js          # Overlay implementation
└── icons/
    ├── icon-16.png             # Extension icons
    ├── icon-32.png
    ├── icon-48.png
    └── icon-128.png
```

### Key Technologies
- **Manifest V3**: Latest Chrome extension format
- **Vanilla JavaScript**: No external dependencies
- **CSS Grid/Flexbox**: Modern layout techniques
- **Chrome APIs**: Storage, tabs, scripting, runtime
- **Web Standards**: Drag and drop, ResizeObserver, MutationObserver

### Building for Different Browsers

#### Chrome/Edge (Chromium-based)
- Uses Manifest V3 format
- Service Worker for background script
- Full Chrome extension API support

#### Firefox (Future Support)
- Will require Manifest V2 compatibility layer
- Background page instead of service worker
- WebExtensions API compatibility

### Development Commands
```bash
# Development mode
npm run dev

# Build for production
npm run build

# Package for store submission
npm run package

# Run tests
npm run test
```

## Platform-Specific Optimizations

### Google Meet
- Monitors for camera/screen share layout changes
- Adapts to Meet's responsive UI updates
- Avoids interference with Meet's overlay elements

### Zoom
- Handles Zoom's dynamic layout system
- Adapts to different view modes (speaker, gallery, etc.)
- Monitors for Zoom's UI state changes

### Microsoft Teams
- Navigates Teams' complex iframe structure
- Handles multiple nested document contexts
- Adapts to Teams' varying layout configurations

## Troubleshooting

### Common Issues

#### Overlay Not Appearing
1. Check if you're on a supported platform
2. Verify the extension is enabled
3. Refresh the video conferencing page
4. Check browser console for errors

#### Connection Issues
1. Ensure SpeakSync web app is open in another tab
2. Check that both extension and app are updated
3. Try refreshing both the extension and web app
4. Verify no firewall/security software is blocking connections

#### Performance Issues
1. Reduce overlay opacity if system is slow
2. Close unnecessary browser tabs
3. Check for browser updates
4. Restart the browser if memory usage is high

### Browser Compatibility

#### Chrome (Recommended)
- Full feature support
- Best performance
- Latest security features

#### Edge
- Full Chromium compatibility
- Enterprise-friendly features
- Enhanced security controls

#### Firefox (Coming Soon)
- WebExtensions compatibility
- Cross-platform consistency
- Enhanced privacy features

## Privacy Policy

### Data Collection
- **No Personal Data**: Extension doesn't collect or store personal information
- **Local Storage Only**: Settings stored locally in browser
- **No Analytics**: No usage tracking or analytics
- **Secure Communication**: All data transmission uses secure browser APIs

### Permissions Explained
- **activeTab**: Access current tab for overlay injection
- **storage**: Save user preferences locally
- **scripting**: Inject overlay code into video conferencing pages
- **tabs**: Detect platform changes and manage overlay state

## Roadmap

### Version 1.1 (Planned)
- [ ] Firefox compatibility
- [ ] Advanced positioning presets
- [ ] Overlay animations and transitions
- [ ] Voice control integration

### Version 1.2 (Planned)
- [ ] Multi-monitor support
- [ ] Advanced synchronization features
- [ ] Custom keyboard shortcuts
- [ ] Presentation mode enhancements

### Version 2.0 (Future)
- [ ] Mobile browser support
- [ ] AR/VR integration
- [ ] AI-powered positioning
- [ ] Advanced accessibility features

## Contributing

We welcome contributions! Please see our [Contributing Guide](../CONTRIBUTING.md) for details on:
- Code style and standards
- Development workflow
- Testing requirements
- Submission process

## Support

- **Documentation**: [SpeakSync Help Center](https://speaksync.app/help)
- **Bug Reports**: [GitHub Issues](https://github.com/speaksync/browser-extension/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/speaksync/browser-extension/discussions)
- **Email Support**: support@speaksync.app

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

**SpeakSync Browser Extension** - Empowering confident presentations through seamless teleprompter integration.
