// demoBack Page - demonstrates navigateBack and lifecycle

Page({
  data: {
    sourceMethod: 'unknown'
  },

  // Lifecycle: called when page loads with query parameters
  onLoad(options) {
    this.log('✅ onLoad - Page initialized with options:', options);
    console.log('[demoBack] onLoad called', options);
    
    // Parse query parameters from URL
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from') || 'unknown';
    
    this.setData({
      sourceMethod: from
    });
    
    this.log(`📍 Arrived from: ${from}`);
  },

  // Lifecycle: called when page DOM is ready
  onReady() {
    this.log('✅ onReady - Page DOM is ready');
    console.log('[demoBack] onReady called');
  },

  // Lifecycle: called when page becomes visible
  onShow() {
    this.log('✅ onShow - Page is now visible');
    console.log('[demoBack] onShow called');
  },

  // Lifecycle: called when page becomes hidden
  onHide() {
    this.log('⚠️ onHide - Page is now hidden');
    console.log('[demoBack] onHide called');
  },

  // Lifecycle: called when page is unloaded (destroyed)
  onUnload() {
    this.log('❌ onUnload - Page is being destroyed');
    console.log('[demoBack] onUnload called');
  },

  // Navigation: go back to previous page (only works if arrived via navigateTo)
  goBack() {
    this.log('⬅️ Calling wx.navigateBack()');
    console.log('[demoBack] navigateBack called');
    
    // Check if there's history
    if (window.history.length > 1) {
      wx.navigateBack();
    } else {
      this.log('⚠️ No history available - navigateBack has no effect');
      alert('No history available. You likely arrived via redirectTo or reLaunch.');
    }
  },

  // Navigation: clear history and go back to demoNav
  goHome() {
    this.log('🏠 Calling wx.reLaunch → ../demoNav/demoNav.html');
    console.log('[demoBack] reLaunch → demoNav');
    wx.reLaunch({
      url: '../demoNav/demoNav.html?from=reLaunch'
    });
  },

  // Helper: append log message to console and page
  log(message) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log(logEntry);
    
    // Also display in page for visual feedback
    const logContainer = document.getElementById('logContainer');
    if (logContainer) {
      const logItem = document.createElement('div');
      logItem.className = 'log-item';
      logItem.textContent = logEntry;
      logContainer.appendChild(logItem);
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  }
});
