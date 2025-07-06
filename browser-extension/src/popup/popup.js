/**
 * SpeakSync Browser Extension - Popup Script
 * Handles the extension popup interface and user interactions
 */

// Popup state
let currentSettings = {
  opacity: 0.8,
  fontSize: 24,
  fontFamily: 'Arial, sans-serif',
  color: '#ffffff',
  backgroundColor: '#000000',
  position: { x: 100, y: 100 },
  width: 400,
  height: 200
};

let connectionStatus = 'disconnected'; // disconnected, connecting, connected
let overlayActive = false;
let currentTab = null;

// DOM Elements
const elements = {
  connectionStatus: null,
  currentTab: null,
  toggleOverlay: null,
  connectApp: null,
  expandSettings: null,
  settingsContent: null,
  settingsHeader: null,
  
  // Settings controls
  opacitySlider: null,
  opacityValue: null,
  fontSizeSlider: null,
  fontSizeValue: null,
  fontFamilySelect: null,
  textColorPicker: null,
  backgroundColorPicker: null,
  resetSettings: null,
  
  // Support links
  helpLink: null,
  feedbackLink: null
};

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  initializeElements();
  setupEventListeners();
  loadSettings();
  updateUI();
  checkCurrentTab();
  checkConnectionStatus();
});

function initializeElements() {
  // Get all DOM elements
  Object.keys(elements).forEach(key => {
    const element = document.getElementById(key) || document.querySelector(`.${key}`);
    if (element) {
      elements[key] = element;
    } else {
      console.warn(`Element not found: ${key}`);
    }
  });
  
  // Special case for elements that might not have IDs
  elements.settingsHeader = document.querySelector('.settings-header');
  elements.settingsContent = document.querySelector('.settings-content');
}

function setupEventListeners() {
  // Main controls
  if (elements.toggleOverlay) {
    elements.toggleOverlay.addEventListener('click', toggleOverlay);
  }
  
  if (elements.connectApp) {
    elements.connectApp.addEventListener('click', connectToApp);
  }
  
  // Settings panel toggle
  if (elements.settingsHeader) {
    elements.settingsHeader.addEventListener('click', toggleSettings);
  }
  
  // Settings controls
  if (elements.opacitySlider) {
    elements.opacitySlider.addEventListener('input', updateOpacity);
  }
  
  if (elements.fontSizeSlider) {
    elements.fontSizeSlider.addEventListener('input', updateFontSize);
  }
  
  if (elements.fontFamilySelect) {
    elements.fontFamilySelect.addEventListener('change', updateFontFamily);
  }
  
  if (elements.textColorPicker) {
    elements.textColorPicker.addEventListener('change', updateTextColor);
  }
  
  if (elements.backgroundColorPicker) {
    elements.backgroundColorPicker.addEventListener('change', updateBackgroundColor);
  }
  
  if (elements.resetSettings) {
    elements.resetSettings.addEventListener('click', resetSettings);
  }
  
  // Color preset buttons
  document.querySelectorAll('.preset-button').forEach(button => {
    button.addEventListener('click', (e) => {
      const color = e.target.dataset.color;
      const bgColor = e.target.dataset.bg;
      
      if (color) {
        currentSettings.color = color;
        elements.textColorPicker.value = color;
        updateSettings();
      }
      
      if (bgColor) {
        currentSettings.backgroundColor = bgColor;
        elements.backgroundColorPicker.value = bgColor;
        updateSettings();
      }
    });
  });
  
  // Position preset buttons
  document.querySelectorAll('.position-button').forEach(button => {
    button.addEventListener('click', (e) => {
      const position = e.target.dataset.position;
      setPositionPreset(position);
      
      // Update active state
      document.querySelectorAll('.position-button').forEach(btn => {
        btn.classList.remove('active');
      });
      e.target.classList.add('active');
    });
  });
  
  // Support links
  if (elements.helpLink) {
    elements.helpLink.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: 'https://speaksync.app/help' });
    });
  }
  
  if (elements.feedbackLink) {
    elements.feedbackLink.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: 'https://speaksync.app/feedback' });
    });
  }
}

function loadSettings() {
  chrome.storage.local.get(['overlaySettings'], (result) => {
    if (result.overlaySettings) {
      currentSettings = { ...currentSettings, ...result.overlaySettings };
      updateSettingsUI();
    }
  });
}

function updateSettingsUI() {
  if (elements.opacitySlider) {
    elements.opacitySlider.value = currentSettings.opacity;
    elements.opacityValue.textContent = Math.round(currentSettings.opacity * 100) + '%';
  }
  
  if (elements.fontSizeSlider) {
    elements.fontSizeSlider.value = currentSettings.fontSize;
    elements.fontSizeValue.textContent = currentSettings.fontSize + 'px';
  }
  
  if (elements.fontFamilySelect) {
    elements.fontFamilySelect.value = currentSettings.fontFamily;
  }
  
  if (elements.textColorPicker) {
    elements.textColorPicker.value = currentSettings.color;
  }
  
  if (elements.backgroundColorPicker) {
    elements.backgroundColorPicker.value = currentSettings.backgroundColor;
  }
}

function toggleOverlay() {
  overlayActive = !overlayActive;
  
  // Send message to background script
  chrome.runtime.sendMessage({
    type: 'OVERLAY_TOGGLE',
    enabled: overlayActive
  });
  
  updateUI();
}

function connectToApp() {
  connectionStatus = 'connecting';
  updateUI();
  
  // Attempt to connect to SpeakSync app
  // This would involve checking if the app is running and establishing connection
  setTimeout(() => {
    // Simulate connection attempt
    connectionStatus = 'connected'; // or 'disconnected' if failed
    updateUI();
  }, 2000);
}

function toggleSettings() {
  const isExpanded = elements.settingsContent.classList.contains('expanded');
  
  if (isExpanded) {
    elements.settingsContent.classList.remove('expanded');
    elements.settingsHeader.classList.remove('expanded');
  } else {
    elements.settingsContent.classList.add('expanded');
    elements.settingsHeader.classList.add('expanded');
  }
}

function updateOpacity() {
  const value = parseFloat(elements.opacitySlider.value);
  currentSettings.opacity = value;
  elements.opacityValue.textContent = Math.round(value * 100) + '%';
  updateSettings();
}

function updateFontSize() {
  const value = parseInt(elements.fontSizeSlider.value);
  currentSettings.fontSize = value;
  elements.fontSizeValue.textContent = value + 'px';
  updateSettings();
}

function updateFontFamily() {
  currentSettings.fontFamily = elements.fontFamilySelect.value;
  updateSettings();
}

function updateTextColor() {
  currentSettings.color = elements.textColorPicker.value;
  updateSettings();
}

function updateBackgroundColor() {
  currentSettings.backgroundColor = elements.backgroundColorPicker.value;
  updateSettings();
}

function setPositionPreset(position) {
  const viewport = { width: 1920, height: 1080 }; // Default viewport size
  const overlaySize = { width: currentSettings.width, height: currentSettings.height };
  
  let x, y;
  
  switch (position) {
    case 'top-left':
      x = 20;
      y = 20;
      break;
    case 'top-center':
      x = (viewport.width - overlaySize.width) / 2;
      y = 20;
      break;
    case 'top-right':
      x = viewport.width - overlaySize.width - 20;
      y = 20;
      break;
    case 'center-left':
      x = 20;
      y = (viewport.height - overlaySize.height) / 2;
      break;
    case 'center':
      x = (viewport.width - overlaySize.width) / 2;
      y = (viewport.height - overlaySize.height) / 2;
      break;
    case 'center-right':
      x = viewport.width - overlaySize.width - 20;
      y = (viewport.height - overlaySize.height) / 2;
      break;
    case 'bottom-left':
      x = 20;
      y = viewport.height - overlaySize.height - 20;
      break;
    case 'bottom-center':
      x = (viewport.width - overlaySize.width) / 2;
      y = viewport.height - overlaySize.height - 20;
      break;
    case 'bottom-right':
      x = viewport.width - overlaySize.width - 20;
      y = viewport.height - overlaySize.height - 20;
      break;
    default:
      return;
  }
  
  currentSettings.position = { x, y };
  updateSettings();
}

function resetSettings() {
  currentSettings = {
    opacity: 0.8,
    fontSize: 24,
    fontFamily: 'Arial, sans-serif',
    color: '#ffffff',
    backgroundColor: '#000000',
    position: { x: 100, y: 100 },
    width: 400,
    height: 200
  };
  
  updateSettingsUI();
  updateSettings();
  
  // Reset position button states
  document.querySelectorAll('.position-button').forEach(btn => {
    btn.classList.remove('active');
  });
}

function updateSettings() {
  // Save to storage
  chrome.storage.local.set({
    overlaySettings: currentSettings
  });
  
  // Send to background script
  chrome.runtime.sendMessage({
    type: 'SETTINGS_UPDATE',
    settings: currentSettings
  });
}

function checkCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      currentTab = tabs[0];
      updateTabInfo();
    }
  });
}

function updateTabInfo() {
  if (!currentTab || !elements.currentTab) return;
  
  const url = currentTab.url;
  let platform = 'Unknown';
  let supported = false;
  
  if (url.includes('meet.google.com')) {
    platform = 'Google Meet';
    supported = true;
  } else if (url.includes('zoom.us')) {
    platform = 'Zoom';
    supported = true;
  } else if (url.includes('teams.microsoft.com')) {
    platform = 'Microsoft Teams';
    supported = true;
  } else {
    platform = 'Not supported';
  }
  
  elements.currentTab.textContent = supported ? 
    `Ready on ${platform}` : 
    'No supported platform detected';
  
  // Enable/disable overlay button based on platform support
  if (elements.toggleOverlay) {
    elements.toggleOverlay.disabled = !supported;
  }
}

function checkConnectionStatus() {
  // Check if SpeakSync app is connected
  // This would involve checking the connection to the main app
  chrome.runtime.sendMessage({ type: 'CHECK_CONNECTION' }, (response) => {
    if (response && response.connected) {
      connectionStatus = 'connected';
    } else {
      connectionStatus = 'disconnected';
    }
    updateUI();
  });
}

function updateUI() {
  // Update connection status
  if (elements.connectionStatus) {
    const statusDot = elements.connectionStatus.querySelector('.status-dot');
    const statusText = elements.connectionStatus.querySelector('.status-text');
    
    if (statusDot && statusText) {
      statusDot.className = `status-dot ${connectionStatus}`;
      
      switch (connectionStatus) {
        case 'connected':
          statusText.textContent = 'Connected to SpeakSync';
          break;
        case 'connecting':
          statusText.textContent = 'Connecting...';
          break;
        default:
          statusText.textContent = 'Disconnected';
      }
    }
  }
  
  // Update overlay toggle button
  if (elements.toggleOverlay) {
    const buttonIcon = elements.toggleOverlay.querySelector('.button-icon');
    const buttonText = elements.toggleOverlay.querySelector('.button-text');
    
    if (overlayActive) {
      elements.toggleOverlay.classList.add('active');
      if (buttonIcon) buttonIcon.textContent = '⏹️';
      if (buttonText) buttonText.textContent = 'Stop Overlay';
    } else {
      elements.toggleOverlay.classList.remove('active');
      if (buttonIcon) buttonIcon.textContent = '▶️';
      if (buttonText) buttonText.textContent = 'Start Overlay';
    }
  }
  
  // Update connect button based on connection status
  if (elements.connectApp) {
    const buttonText = elements.connectApp.querySelector('.button-text');
    
    switch (connectionStatus) {
      case 'connected':
        if (buttonText) buttonText.textContent = 'Connected';
        elements.connectApp.disabled = true;
        break;
      case 'connecting':
        if (buttonText) buttonText.textContent = 'Connecting...';
        elements.connectApp.disabled = true;
        break;
      default:
        if (buttonText) buttonText.textContent = 'Connect to SpeakSync App';
        elements.connectApp.disabled = false;
    }
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'OVERLAY_STATE_CHANGED':
      overlayActive = message.enabled;
      updateUI();
      break;
      
    case 'CONNECTION_STATUS_CHANGED':
      connectionStatus = message.status;
      updateUI();
      break;
      
    default:
      console.log('Unknown popup message:', message.type);
  }
});

// Handle tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.active && changeInfo.status === 'complete') {
    currentTab = tab;
    updateTabInfo();
  }
});

// Handle tab activation
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    currentTab = tab;
    updateTabInfo();
  });
});
