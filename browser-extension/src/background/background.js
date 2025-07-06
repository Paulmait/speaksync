/**
 * SpeakSync Browser Extension - Background Service Worker
 * Handles communication between extension components and main SpeakSync app
 */

// Extension state management
let overlayState = {
  isActive: false,
  scriptContent: '',
  currentPosition: 0,
  settings: {
    opacity: 0.8,
    fontSize: 24,
    fontFamily: 'Arial, sans-serif',
    color: '#ffffff',
    backgroundColor: '#000000',
    position: { x: 100, y: 100 },
    width: 400,
    height: 200,
    scrollSpeed: 50,
    isScrolling: false
  }
};

// Connection to main SpeakSync app
let speakSyncConnection = null;
let connectedTabs = new Set();

// Service worker event listeners
chrome.runtime.onInstalled.addListener(() => {
  console.log('SpeakSync Overlay extension installed');
  
  // Initialize extension storage
  chrome.storage.local.set({
    overlaySettings: overlayState.settings,
    isFirstInstall: true
  });
});

chrome.runtime.onStartup.addListener(() => {
  console.log('SpeakSync Overlay extension started');
  
  // Restore previous state
  restoreExtensionState();
});

// Handle messages from content scripts, popup, and external sources
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  switch (message.type) {
    case 'OVERLAY_TOGGLE':
      handleOverlayToggle(message.enabled, sender.tab.id);
      break;
      
    case 'SCRIPT_UPDATE':
      handleScriptUpdate(message.script, message.position);
      break;
      
    case 'SETTINGS_UPDATE':
      handleSettingsUpdate(message.settings);
      break;
      
    case 'SYNC_REQUEST':
      handleSyncRequest(sender.tab.id);
      break;
      
    case 'POSITION_UPDATE':
      handlePositionUpdate(message.position);
      break;
      
    case 'CONTENT_SCRIPT_READY':
      handleContentScriptReady(sender.tab.id);
      break;
      
    default:
      console.log('Unknown message type:', message.type);
  }
  
  // Keep message channel open for async responses
  return true;
});

// Handle external connections (from main SpeakSync app)
chrome.runtime.onConnectExternal.addListener((port) => {
  console.log('External connection established:', port.name);
  
  if (port.name === 'speaksync-app') {
    speakSyncConnection = port;
    
    port.onMessage.addListener((message) => {
      handleSpeakSyncMessage(message);
    });
    
    port.onDisconnect.addListener(() => {
      console.log('SpeakSync app disconnected');
      speakSyncConnection = null;
    });
  }
});

// Tab management
chrome.tabs.onRemoved.addListener((tabId) => {
  connectedTabs.delete(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && isVideoConferencingTab(tab.url)) {
    // Check if overlay should be activated on this tab
    if (overlayState.isActive) {
      activateOverlayOnTab(tabId);
    }
  }
});

// Core functionality
async function handleOverlayToggle(enabled, tabId) {
  overlayState.isActive = enabled;
  
  if (enabled) {
    await activateOverlayOnTab(tabId);
  } else {
    await deactivateOverlayOnTab(tabId);
  }
  
  // Notify SpeakSync app
  if (speakSyncConnection) {
    speakSyncConnection.postMessage({
      type: 'OVERLAY_STATE_CHANGED',
      enabled: enabled
    });
  }
}

async function activateOverlayOnTab(tabId) {
  try {
    // Inject overlay into tab
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['src/overlay/overlay.js']
    });
    
    // Apply overlay styles
    await chrome.scripting.insertCSS({
      target: { tabId: tabId },
      files: ['src/overlay/overlay.css']
    });
    
    // Send current state to overlay
    chrome.tabs.sendMessage(tabId, {
      type: 'OVERLAY_INITIALIZE',
      script: overlayState.scriptContent,
      position: overlayState.currentPosition,
      settings: overlayState.settings
    });
    
    connectedTabs.add(tabId);
    console.log('Overlay activated on tab:', tabId);
    
  } catch (error) {
    console.error('Failed to activate overlay on tab:', tabId, error);
  }
}

async function deactivateOverlayOnTab(tabId) {
  try {
    chrome.tabs.sendMessage(tabId, {
      type: 'OVERLAY_DESTROY'
    });
    
    connectedTabs.delete(tabId);
    console.log('Overlay deactivated on tab:', tabId);
    
  } catch (error) {
    console.error('Failed to deactivate overlay on tab:', tabId, error);
  }
}

function handleScriptUpdate(script, position) {
  overlayState.scriptContent = script;
  overlayState.currentPosition = position || 0;
  
  // Broadcast to all connected tabs
  connectedTabs.forEach(tabId => {
    chrome.tabs.sendMessage(tabId, {
      type: 'SCRIPT_UPDATE',
      script: script,
      position: position
    }).catch(error => {
      console.error('Failed to send script update to tab:', tabId, error);
      connectedTabs.delete(tabId);
    });
  });
}

function handleSettingsUpdate(settings) {
  overlayState.settings = { ...overlayState.settings, ...settings };
  
  // Save to storage
  chrome.storage.local.set({
    overlaySettings: overlayState.settings
  });
  
  // Broadcast to all connected tabs
  connectedTabs.forEach(tabId => {
    chrome.tabs.sendMessage(tabId, {
      type: 'SETTINGS_UPDATE',
      settings: overlayState.settings
    }).catch(error => {
      console.error('Failed to send settings update to tab:', tabId, error);
      connectedTabs.delete(tabId);
    });
  });
}

function handlePositionUpdate(position) {
  overlayState.currentPosition = position;
  
  // Broadcast to all connected tabs
  connectedTabs.forEach(tabId => {
    chrome.tabs.sendMessage(tabId, {
      type: 'POSITION_UPDATE',
      position: position
    }).catch(error => {
      console.error('Failed to send position update to tab:', tabId, error);
      connectedTabs.delete(tabId);
    });
  });
}

function handleSyncRequest(tabId) {
  // Send current state to requesting tab
  chrome.tabs.sendMessage(tabId, {
    type: 'SYNC_RESPONSE',
    script: overlayState.scriptContent,
    position: overlayState.currentPosition,
    settings: overlayState.settings,
    isActive: overlayState.isActive
  });
}

function handleContentScriptReady(tabId) {
  connectedTabs.add(tabId);
  
  // If overlay is active, initialize it on this tab
  if (overlayState.isActive) {
    chrome.tabs.sendMessage(tabId, {
      type: 'OVERLAY_INITIALIZE',
      script: overlayState.scriptContent,
      position: overlayState.currentPosition,
      settings: overlayState.settings
    });
  }
}

function handleSpeakSyncMessage(message) {
  console.log('Received message from SpeakSync app:', message);
  
  switch (message.type) {
    case 'SCRIPT_SYNC':
      handleScriptUpdate(message.script, message.position);
      break;
      
    case 'SETTINGS_SYNC':
      handleSettingsUpdate(message.settings);
      break;
      
    case 'POSITION_SYNC':
      handlePositionUpdate(message.position);
      break;
      
    case 'OVERLAY_CONTROL':
      // Handle overlay control from main app
      if (message.action === 'start') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0] && isVideoConferencingTab(tabs[0].url)) {
            handleOverlayToggle(true, tabs[0].id);
          }
        });
      } else if (message.action === 'stop') {
        connectedTabs.forEach(tabId => {
          handleOverlayToggle(false, tabId);
        });
      }
      break;
      
    default:
      console.log('Unknown SpeakSync message type:', message.type);
  }
}

async function restoreExtensionState() {
  try {
    const result = await chrome.storage.local.get(['overlaySettings', 'overlayState']);
    
    if (result.overlaySettings) {
      overlayState.settings = result.overlaySettings;
    }
    
    if (result.overlayState) {
      overlayState = { ...overlayState, ...result.overlayState };
    }
    
    console.log('Extension state restored:', overlayState);
  } catch (error) {
    console.error('Failed to restore extension state:', error);
  }
}

function isVideoConferencingTab(url) {
  if (!url) return false;
  
  const videoConferencingDomains = [
    'meet.google.com',
    'zoom.us',
    'teams.microsoft.com'
  ];
  
  return videoConferencingDomains.some(domain => 
    url.includes(domain)
  );
}

// Periodic cleanup
setInterval(() => {
  // Clean up disconnected tabs
  connectedTabs.forEach(tabId => {
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError) {
        connectedTabs.delete(tabId);
      }
    });
  });
}, 60000); // Check every minute

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    overlayState,
    handleOverlayToggle,
    handleScriptUpdate,
    handleSettingsUpdate,
    isVideoConferencingTab
  };
}
