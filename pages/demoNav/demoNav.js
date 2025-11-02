// demoNav Page - demonstrates Page() lifecycle and wx navigation APIs

Page({
  data: {
    logs: []
  },

  // Lifecycle: called when page loads with query parameters
  onLoad(options) {
    this.log('✅ onLoad - Page initialized with options:', options);
    console.log('[demoNav] onLoad called', options);
  },

  // Lifecycle: called when page DOM is ready
  onReady() {
    this.log('✅ onReady - Page DOM is ready');
    console.log('[demoNav] onReady called');
  },

  // Lifecycle: called when page becomes visible
  onShow() {
    this.log('✅ onShow - Page is now visible');
    console.log('[demoNav] onShow called');
  },

  // Lifecycle: called when page becomes hidden
  onHide() {
    this.log('⚠️ onHide - Page is now hidden');
    console.log('[demoNav] onHide called');
  },

  // Lifecycle: called when page is unloaded (destroyed)
  onUnload() {
    this.log('❌ onUnload - Page is being destroyed');
    console.log('[demoNav] onUnload called');
  },

  // Navigation: navigateTo (keeps current page in history stack)
  navigateToBack() {
    this.log('🧭 Calling wx.navigateTo → ../demoBack/demoBack.html');
    console.log('[demoNav] navigateTo → demoBack');
    wx.navigateTo({
      url: '../demoBack/demoBack.html?from=navigateTo'
    });
  },

  // Navigation: redirectTo (replaces current page, no back button)
  redirectToBack() {
    this.log('🧭 Calling wx.redirectTo → ../demoBack/demoBack.html');
    console.log('[demoNav] redirectTo → demoBack');
    wx.redirectTo({
      url: '../demoBack/demoBack.html?from=redirectTo'
    });
  },

  // Navigation: reLaunch (clear history stack and load new page)
  reLaunchToBack() {
    this.log('🧭 Calling wx.reLaunch → ../demoBack/demoBack.html');
    console.log('[demoNav] reLaunch → demoBack');
    wx.reLaunch({
      url: '../demoBack/demoBack.html?from=reLaunch'
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
