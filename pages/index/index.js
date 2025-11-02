// 首页逻辑
Page({
  data: {
    APP_NAME: (window.APP_CONFIG && window.APP_CONFIG.app && window.APP_CONFIG.app.name) || 'Your App',
    APP_TITLE: (window.APP_CONFIG && window.APP_CONFIG.app && window.APP_CONFIG.app.title) || 'Your App Management Entrance',
    APP_SUBTITLE: (window.APP_CONFIG && window.APP_CONFIG.app && window.APP_CONFIG.app.subtitle) || 'Management System',
    APP_DESC: (window.APP_CONFIG && window.APP_CONFIG.app && window.APP_CONFIG.app.description) || '',
    APP_LOGO: (window.APP_CONFIG && window.APP_CONFIG.branding && window.APP_CONFIG.branding.logoPath) || '',
    CURRENT_YEAR: new Date().getFullYear()
  },

  onLoad() {
    this.updateTitle();
  },

  updateTitle() {
    try {
      document.title = this.data.APP_TITLE || document.title;
    } catch (_) {}
  },

  goLogin() {
    wx.navigateTo({ url: '../login/login.html' });
  },

  goMyInfo() {
    wx.navigateTo({ url: '../myInfo/myInfo.html' });
  }
});
