/**
 * SpeakSync Browser Extension - Content Script
 * Manages overlay injection and communication with background script
 */

(function() {
  'use strict';
  
  // Prevent multiple injections
  if (window.speakSyncContentScript) {
    return;
  }
  window.speakSyncContentScript = true;
  
  console.log('SpeakSync content script loaded on:', window.location.hostname);
  
  // Content script state
  let overlayInjected = false;
  let currentScript = '';
  let currentPosition = 0;
  let overlaySettings = {};
  
  // Message listener for background script communication
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Content script received message:', message);
    
    switch (message.type) {
      case 'OVERLAY_INITIALIZE':
        initializeOverlay(message.script, message.position, message.settings);
        break;
        
      case 'OVERLAY_DESTROY':
        destroyOverlay();
        break;
        
      case 'SCRIPT_UPDATE':
        updateScript(message.script, message.position);
        break;
        
      case 'SETTINGS_UPDATE':
        updateSettings(message.settings);
        break;
        
      case 'POSITION_UPDATE':
        updatePosition(message.position);
        break;
        
      case 'SYNC_RESPONSE':
        handleSyncResponse(message);
        break;
        
      default:
        console.log('Unknown content script message:', message.type);
    }
    
    return true;
  });
  
  // Initialize content script
  function initialize() {
    // Detect video conferencing platform
    const platform = detectPlatform();
    console.log('Detected platform:', platform);
    
    // Set up platform-specific optimizations
    setupPlatformOptimizations(platform);
    
    // Notify background script that content script is ready
    chrome.runtime.sendMessage({
      type: 'CONTENT_SCRIPT_READY',
      platform: platform,
      url: window.location.href
    });
    
    // Request sync with current state
    requestSync();
  }
  
  function detectPlatform() {
    const hostname = window.location.hostname;
    
    if (hostname.includes('meet.google.com')) {
      return 'google-meet';
    } else if (hostname.includes('zoom.us')) {
      return 'zoom';
    } else if (hostname.includes('teams.microsoft.com')) {
      return 'microsoft-teams';
    } else {
      return 'unknown';
    }
  }
  
  function setupPlatformOptimizations(platform) {
    switch (platform) {
      case 'google-meet':
        setupGoogleMeetOptimizations();
        break;
        
      case 'zoom':
        setupZoomOptimizations();
        break;
        
      case 'microsoft-teams':
        setupTeamsOptimizations();
        break;
        
      default:
        console.log('No specific optimizations for platform:', platform);
    }
  }
  
  function setupGoogleMeetOptimizations() {
    // Google Meet specific optimizations
    console.log('Setting up Google Meet optimizations');
    
    // Monitor for camera/screen share changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Check for layout changes that might affect overlay positioning
          repositionOverlayIfNeeded();
        }
      });
    });
    
    // Observe main content area
    const contentArea = document.querySelector('[data-call-id]') || document.body;
    observer.observe(contentArea, {
      childList: true,
      subtree: true
    });
  }
  
  function setupZoomOptimizations() {
    // Zoom specific optimizations
    console.log('Setting up Zoom optimizations');
    
    // Monitor for Zoom's dynamic layout changes
    const observer = new MutationObserver(() => {
      repositionOverlayIfNeeded();
    });
    
    const zoomContent = document.querySelector('#zoom-ui') || document.body;
    observer.observe(zoomContent, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });
  }
  
  function setupTeamsOptimizations() {
    // Microsoft Teams specific optimizations
    console.log('Setting up Microsoft Teams optimizations');
    
    // Teams has complex iframe structure
    const observer = new MutationObserver(() => {
      repositionOverlayIfNeeded();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-tid']
    });
  }
  
  function initializeOverlay(script, position, settings) {
    if (overlayInjected) {
      console.log('Overlay already injected, updating instead');
      updateScript(script, position);
      updateSettings(settings);
      return;
    }
    
    currentScript = script;
    currentPosition = position;
    overlaySettings = settings;
    
    // Create overlay container
    const overlayContainer = createOverlayContainer();
    document.body.appendChild(overlayContainer);
    
    // Create overlay content
    createOverlayContent(overlayContainer);
    
    overlayInjected = true;
    console.log('SpeakSync overlay initialized');
  }
  
  function createOverlayContainer() {
    const container = document.createElement('div');
    container.id = 'speaksync-overlay-container';
    container.className = 'speaksync-overlay-container';
    
    // Apply initial styles
    Object.assign(container.style, {
      position: 'fixed',
      top: `${overlaySettings.position?.y || 100}px`,
      left: `${overlaySettings.position?.x || 100}px`,
      width: `${overlaySettings.width || 400}px`,
      height: `${overlaySettings.height || 200}px`,
      backgroundColor: overlaySettings.backgroundColor || '#000000',
      color: overlaySettings.color || '#ffffff',
      fontSize: `${overlaySettings.fontSize || 24}px`,
      fontFamily: overlaySettings.fontFamily || 'Arial, sans-serif',
      opacity: overlaySettings.opacity || 0.8,
      zIndex: '999999',
      borderRadius: '8px',
      border: '2px solid #333',
      overflow: 'hidden',
      cursor: 'move',
      userSelect: 'none',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      backdropFilter: 'blur(10px)'
    });
    
    // Make draggable
    makeDraggable(container);
    
    return container;
  }
  
  function createOverlayContent(container) {
    // Header with controls
    const header = document.createElement('div');
    header.className = 'speaksync-overlay-header';
    Object.assign(header.style, {
      padding: '8px 12px',
      backgroundColor: 'rgba(0,0,0,0.3)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #444',
      fontSize: '14px'
    });
    
    // Title
    const title = document.createElement('span');
    title.textContent = 'SpeakSync';
    title.style.fontWeight = 'bold';
    header.appendChild(title);
    
    // Controls
    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = '8px';
    
    // Settings button
    const settingsBtn = document.createElement('button');
    settingsBtn.textContent = '⚙️';
    settingsBtn.style.cssText = 'background:none;border:none;color:inherit;cursor:pointer;padding:4px;';
    settingsBtn.onclick = () => openOverlaySettings();
    controls.appendChild(settingsBtn);
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'background:none;border:none;color:inherit;cursor:pointer;padding:4px;';
    closeBtn.onclick = () => destroyOverlay();
    controls.appendChild(closeBtn);
    
    header.appendChild(controls);
    container.appendChild(header);
    
    // Script content area
    const content = document.createElement('div');
    content.id = 'speaksync-overlay-content';
    content.className = 'speaksync-overlay-content';
    Object.assign(content.style, {
      padding: '16px',
      height: 'calc(100% - 40px)',
      overflow: 'auto',
      lineHeight: '1.5',
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word'
    });
    
    // Add scroll bar styling
    content.style.cssText += `
      scrollbar-width: thin;
      scrollbar-color: #666 transparent;
    `;
    
    container.appendChild(content);
    
    // Update content
    updateOverlayContent();
    
    // Add resize handles
    addResizeHandles(container);
  }
  
  function makeDraggable(element) {
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;
    
    const header = element.querySelector('.speaksync-overlay-header');
    
    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
    
    function dragStart(e) {
      if (e.target.tagName === 'BUTTON') return; // Don't drag on buttons
      
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
      
      if (e.target === header || header.contains(e.target)) {
        isDragging = true;
        element.style.cursor = 'grabbing';
      }
    }
    
    function drag(e) {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        
        xOffset = currentX;
        yOffset = currentY;
        
        // Constrain to viewport
        const rect = element.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width;
        const maxY = window.innerHeight - rect.height;
        
        currentX = Math.max(0, Math.min(currentX, maxX));
        currentY = Math.max(0, Math.min(currentY, maxY));
        
        element.style.left = currentX + 'px';
        element.style.top = currentY + 'px';
        
        // Save position
        overlaySettings.position = { x: currentX, y: currentY };
        saveSettings();
      }
    }
    
    function dragEnd() {
      isDragging = false;
      element.style.cursor = 'move';
    }
  }
  
  function addResizeHandles(container) {
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'speaksync-resize-handle';
    Object.assign(resizeHandle.style, {
      position: 'absolute',
      bottom: '0',
      right: '0',
      width: '20px',
      height: '20px',
      backgroundColor: 'rgba(255,255,255,0.3)',
      cursor: 'se-resize',
      borderRadius: '0 0 8px 0'
    });
    
    // Add resize functionality
    let isResizing = false;
    
    resizeHandle.addEventListener('mousedown', (e) => {
      isResizing = true;
      e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      
      const rect = container.getBoundingClientRect();
      const newWidth = Math.max(300, e.clientX - rect.left);
      const newHeight = Math.max(150, e.clientY - rect.top);
      
      container.style.width = newWidth + 'px';
      container.style.height = newHeight + 'px';
      
      overlaySettings.width = newWidth;
      overlaySettings.height = newHeight;
    });
    
    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        saveSettings();
      }
    });
    
    container.appendChild(resizeHandle);
  }
  
  function updateOverlayContent() {
    const content = document.getElementById('speaksync-overlay-content');
    if (!content) return;
    
    // Format script content with current position highlighting
    const paragraphs = currentScript.split(/\n\s*\n/);
    let html = '';
    
    paragraphs.forEach((paragraph, index) => {
      const isActive = index === currentPosition;
      const className = isActive ? 'active-paragraph' : '';
      const style = isActive ? 'background-color: rgba(255,255,255,0.1); padding: 8px; border-radius: 4px; margin: 4px 0;' : 'margin: 4px 0;';
      
      html += `<div class="${className}" style="${style}">${paragraph}</div>`;
    });
    
    content.innerHTML = html;
    
    // Auto-scroll to active paragraph
    const activeParagraph = content.querySelector('.active-paragraph');
    if (activeParagraph) {
      activeParagraph.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
  
  function updateScript(script, position) {
    currentScript = script;
    currentPosition = position || 0;
    updateOverlayContent();
  }
  
  function updateSettings(settings) {
    overlaySettings = { ...overlaySettings, ...settings };
    
    const container = document.getElementById('speaksync-overlay-container');
    if (!container) return;
    
    // Apply visual settings
    if (settings.opacity !== undefined) {
      container.style.opacity = settings.opacity;
    }
    if (settings.fontSize !== undefined) {
      container.style.fontSize = `${settings.fontSize}px`;
    }
    if (settings.fontFamily !== undefined) {
      container.style.fontFamily = settings.fontFamily;
    }
    if (settings.color !== undefined) {
      container.style.color = settings.color;
    }
    if (settings.backgroundColor !== undefined) {
      container.style.backgroundColor = settings.backgroundColor;
    }
    if (settings.position !== undefined) {
      container.style.left = `${settings.position.x}px`;
      container.style.top = `${settings.position.y}px`;
    }
    if (settings.width !== undefined) {
      container.style.width = `${settings.width}px`;
    }
    if (settings.height !== undefined) {
      container.style.height = `${settings.height}px`;
    }
  }
  
  function updatePosition(position) {
    currentPosition = position;
    updateOverlayContent();
  }
  
  function destroyOverlay() {
    const container = document.getElementById('speaksync-overlay-container');
    if (container) {
      container.remove();
      overlayInjected = false;
      console.log('SpeakSync overlay destroyed');
    }
    
    // Notify background script
    chrome.runtime.sendMessage({
      type: 'OVERLAY_TOGGLE',
      enabled: false
    });
  }
  
  function openOverlaySettings() {
    // TODO: Implement overlay settings panel
    console.log('Opening overlay settings...');
  }
  
  function repositionOverlayIfNeeded() {
    const container = document.getElementById('speaksync-overlay-container');
    if (!container) return;
    
    // Check if overlay is still within viewport
    const rect = container.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    let needsRepositioning = false;
    let newX = parseFloat(container.style.left);
    let newY = parseFloat(container.style.top);
    
    if (rect.right > viewport.width) {
      newX = viewport.width - rect.width;
      needsRepositioning = true;
    }
    if (rect.bottom > viewport.height) {
      newY = viewport.height - rect.height;
      needsRepositioning = true;
    }
    if (rect.left < 0) {
      newX = 0;
      needsRepositioning = true;
    }
    if (rect.top < 0) {
      newY = 0;
      needsRepositioning = true;
    }
    
    if (needsRepositioning) {
      container.style.left = `${newX}px`;
      container.style.top = `${newY}px`;
      
      overlaySettings.position = { x: newX, y: newY };
      saveSettings();
    }
  }
  
  function requestSync() {
    chrome.runtime.sendMessage({
      type: 'SYNC_REQUEST'
    });
  }
  
  function handleSyncResponse(message) {
    if (message.isActive && message.script) {
      initializeOverlay(message.script, message.position, message.settings);
    }
  }
  
  function saveSettings() {
    chrome.runtime.sendMessage({
      type: 'SETTINGS_UPDATE',
      settings: overlaySettings
    });
  }
  
  // Handle page navigation
  window.addEventListener('beforeunload', () => {
    if (overlayInjected) {
      destroyOverlay();
    }
  });
  
  // Handle window resize
  window.addEventListener('resize', () => {
    repositionOverlayIfNeeded();
  });
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
})();
