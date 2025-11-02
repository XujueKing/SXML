/**
 * 登录页日志集成示例
 * 展示如何在登录流程中使用日志系统
 */

// 在登录成功时记录日志
function handleLoginSuccess(userInfo) {
  // 记录登录成功事件
  Logger.logSecurityEvent(EventType.LOGIN_SUCCESS, {
    ipAddress: getUserIP(), // 需要从服务端获取真实IP
    loginMethod: this.data.codeStatus ? 'qrcode' : 'password',
    deviceInfo: navigator.userAgent,
    sessionDuration: 3600000 // 预期会话时长
  });
  
  // 记录会话开始时间（用于计算会话时长）
  sessionStorage.setItem('_session_start', Date.now().toString());
  
  // 保存用户信息
  sessionStorage.setItem('USERINFO', JSON.stringify(userInfo));
  
  // 跳转到主页
  window.location.href = userInfo.url || '/pages/index/index.html';
}

// 在登录失败时记录日志
function handleLoginFailed(reason, username) {
  // 增加失败计数
  this.loginAttempts = (this.loginAttempts || 0) + 1;
  
  // 记录登录失败事件
  Logger.logSecurityEvent(EventType.LOGIN_FAILED, {
    ipAddress: getUserIP(),
    username: username || sessionStorage.getItem('u'),
    reason: reason,
    attemptCount: this.loginAttempts,
    deviceInfo: navigator.userAgent
  });
  
  // 显示错误提示
  const message = i18n.t('login.failed', '登录失败: ') + reason;
  ShowToast(message);
}

// 登出时记录日志
function handleLogout(reason = 'user_initiated') {
  // 计算会话时长
  const sessionStart = sessionStorage.getItem('_session_start');
  const sessionDuration = sessionStart ? Date.now() - parseInt(sessionStart) : 0;
  
  // 记录登出事件
  Logger.logSecurityEvent(EventType.LOGOUT, {
    reason: reason, // user_initiated, timeout, forced
    sessionDuration: sessionDuration
  });
  
  // 清除会话
  sessionStorage.clear();
  
  // 跳转到登录页
  window.location.href = '/pages/login/login.html';
}

// 会话过期处理
function handleSessionExpired() {
  Logger.logSecurityEvent(EventType.SESSION_EXPIRED, {
    lastActivity: sessionStorage.getItem('_last_activity'),
    sessionDuration: Date.now() - parseInt(sessionStorage.getItem('_session_start') || 0)
  });
  
  sessionStorage.clear();
  ShowToast(i18n.t('session.expired', '会话已过期，请重新登录'));
  
  setTimeout(() => {
    window.location.href = '/pages/login/login.html';
  }, 2000);
}

// 获取用户 IP（需要调用服务端 API）
async function getUserIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Failed to get IP:', error);
    return 'unknown';
  }
}

// 监控可疑活动
function detectSuspiciousActivity() {
  // 检测 User-Agent 变化
  const lastUA = sessionStorage.getItem('_last_ua');
  const currentUA = navigator.userAgent;
  
  if (lastUA && lastUA !== currentUA) {
    Logger.logSecurityEvent(EventType.SUSPICIOUS_ACTIVITY, {
      activity: 'User-Agent changed within session',
      oldUA: lastUA,
      newUA: currentUA,
      severity: 'MEDIUM'
    });
  }
  
  sessionStorage.setItem('_last_ua', currentUA);
}

// 在页面加载时检测
window.addEventListener('load', () => {
  detectSuspiciousActivity();
  
  // 记录会话活动时间
  document.addEventListener('click', () => {
    sessionStorage.setItem('_last_activity', Date.now().toString());
  });
  
  document.addEventListener('keypress', () => {
    sessionStorage.setItem('_last_activity', Date.now().toString());
  });
});

// 导出函数供登录页使用
window.LoginLogger = {
  handleLoginSuccess,
  handleLoginFailed,
  handleLogout,
  handleSessionExpired,
  getUserIP,
  detectSuspiciousActivity
};
