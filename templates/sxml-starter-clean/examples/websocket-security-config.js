/**
 * WebSocket 安全配置示例
 * 根据安全审计报告 10.2 节要求实现
 */

// ==================== 生产环境配置 ====================

/**
 * 场景 1: 完整安全配置 (推荐)
 * 适用于: 生产环境、敏感业务系统
 */
const productionConfig = {
  url: 'wss://api.example.com/ws',
  
  // 1. WSS 强制 (传输层加密)
  enforceWSS: true,
  
  // 2. 身份验证
  requireAuth: true,
  authToken: sessionStorage.getItem('authToken'),
  
  // 3. 消息签名
  enableSignature: true,
  signatureSecret: window.APP_CONFIG?.ws?.signatureSecret,
  
  // 连接配置
  reconnect: true,
  reconnectInterval: 3000,
  reconnectMaxAttempts: 10,
  
  // 心跳检测
  heartbeat: true,
  heartbeatInterval: 30000,
  heartbeatTimeout: 5000,
  
  // 安全限制
  maxMessageSize: 1048576, // 1MB
  maxQueueSize: 100,
  
  // 调试
  debug: false
};

// 初始化
const wsapi = new WSAPIManager(productionConfig);

// 监听安全事件
wsapi.on('authenticated', () => {
  console.log('✅ WebSocket 认证成功');
  
  // 记录安全日志
  Logger.logSecurityEvent(EventType.LOGIN_SUCCESS, {
    method: 'websocket',
    url: wsapi.config.url
  });
});

wsapi.on('authFailed', (error) => {
  console.error('❌ WebSocket 认证失败:', error);
  
  // 记录失败日志
  Logger.logSecurityEvent(EventType.LOGIN_FAILED, {
    method: 'websocket',
    reason: error.message
  });
  
  // 跳转登录页
  if (error.message === 'INVALID_TOKEN' || error.message === 'AUTH_TIMEOUT') {
    window.location.href = '/login?reason=token_expired';
  }
});

wsapi.on('signatureError', (data) => {
  console.error('⚠️ 消息签名验证失败:', data);
  
  // 记录安全事件
  Logger.logSecurityEvent(EventType.CSRF_ATTEMPT, {
    source: 'websocket',
    timestamp: Date.now()
  });
});

wsapi.on('message', (data) => {
  console.log('📨 收到消息:', data);
  // 处理业务消息...
});

wsapi.on('error', (error) => {
  console.error('❌ WebSocket 错误:', error);
  
  // 记录错误日志
  Logger.logError(error, {
    context: 'WebSocket',
    url: wsapi.config.url
  });
});

// 连接
wsapi.connect();


// ==================== 开发环境配置 ====================

/**
 * 场景 2: 开发环境配置
 * 适用于: 本地开发、功能测试
 */
const developmentConfig = {
  url: 'ws://localhost:8080/ws',  // 本地开发服务器
  
  // 放宽安全限制 (仅开发环境)
  enforceWSS: false,      // 允许非加密连接
  requireAuth: false,     // 跳过身份验证
  enableSignature: false, // 跳过消息签名
  
  // 其他配置
  reconnect: true,
  heartbeat: true,
  debug: true  // 启用详细日志
};

// 根据环境选择配置
const isDevelopment = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';

const wsapiDev = new WSAPIManager(isDevelopment ? developmentConfig : productionConfig);


// ==================== 高级配置场景 ====================

/**
 * 场景 3: 动态令牌更新
 * 适用于: 长连接场景,需要定期刷新 token
 */
class SecureWSManager {
  constructor() {
    this.wsapi = new WSAPIManager({
      url: 'wss://api.example.com/ws',
      enforceWSS: true,
      requireAuth: true,
      enableSignature: true,
      signatureSecret: this._getSignatureSecret()
    });
    
    // 监听 token 刷新事件
    window.addEventListener('token-refreshed', this._onTokenRefreshed.bind(this));
  }
  
  _getSignatureSecret() {
    // 从服务端配置获取 (不要硬编码)
    return window.APP_CONFIG?.ws?.signatureSecret || '';
  }
  
  _onTokenRefreshed(event) {
    const newToken = event.detail.token;
    console.log('🔄 更新 WebSocket 认证令牌');
    
    // 更新令牌
    this.wsapi.setAuthToken(newToken);
    
    // 如果连接已断开,重新连接
    if (!this.wsapi.isConnected()) {
      this.wsapi.connect();
    }
  }
  
  connect() {
    return this.wsapi.connect();
  }
  
  send(data) {
    return this.wsapi.send(data);
  }
  
  on(event, callback) {
    return this.wsapi.on(event, callback);
  }
}

// 使用示例
const secureWS = new SecureWSManager();
secureWS.on('authenticated', () => {
  console.log('✅ 安全连接已建立');
});
secureWS.connect();


/**
 * 场景 4: 分级消息签名
 * 适用于: 只对敏感操作启用签名,减少性能开销
 */
const selectiveSignatureWS = new WSAPIManager({
  url: 'wss://api.example.com/ws',
  enforceWSS: true,
  requireAuth: true,
  
  // 默认不启用签名
  enableSignature: false,
  signatureSecret: window.APP_CONFIG?.ws?.signatureSecret
});

// 敏感操作时启用签名
function sendSensitiveMessage(data) {
  // 临时启用签名
  selectiveSignatureWS.config.enableSignature = true;
  
  selectiveSignatureWS.send(data);
  
  // 发送后恢复
  selectiveSignatureWS.config.enableSignature = false;
}

// 普通消息不签名
function sendNormalMessage(data) {
  selectiveSignatureWS.send(data);
}

// 使用示例
selectiveSignatureWS.on('authenticated', () => {
  // 普通消息 (无签名)
  sendNormalMessage({ type: 'subscribe', channels: ['notifications'] });
  
  // 敏感操作 (有签名)
  sendSensitiveMessage({ 
    type: 'transfer', 
    amount: 10000, 
    to: 'account123' 
  });
});


/**
 * 场景 5: 消息大小限制与分块传输
 * 适用于: 需要传输大文件或大数据
 */
const largeDataWS = new WSAPIManager({
  url: 'wss://api.example.com/ws',
  enforceWSS: true,
  requireAuth: true,
  maxMessageSize: 102400  // 100KB 限制
});

// 分块传输大数据
function sendLargeData(largeData) {
  const chunkSize = 50 * 1024; // 50KB per chunk
  const chunks = [];
  
  // 分割数据
  for (let i = 0; i < largeData.length; i += chunkSize) {
    chunks.push(largeData.slice(i, i + chunkSize));
  }
  
  console.log(`📦 分 ${chunks.length} 块发送,总大小: ${largeData.length} bytes`);
  
  // 逐块发送
  chunks.forEach((chunk, index) => {
    largeDataWS.send({
      type: 'chunk',
      chunkIndex: index,
      totalChunks: chunks.length,
      data: chunk
    });
  });
}

// 使用示例
largeDataWS.on('authenticated', () => {
  const bigFile = 'x'.repeat(500 * 1024); // 500KB 数据
  sendLargeData(bigFile);
});


// ==================== 错误处理最佳实践 ====================

/**
 * 场景 6: 完善的错误处理
 */
const robustWS = new WSAPIManager({
  url: 'wss://api.example.com/ws',
  enforceWSS: true,
  requireAuth: true,
  enableSignature: true,
  signatureSecret: window.APP_CONFIG?.ws?.signatureSecret
});

// 监听所有可能的错误
robustWS.on('error', (error) => {
  console.error('WebSocket 错误:', error);
  
  // 记录错误日志
  Logger.logError(error, {
    context: 'WebSocket Connection',
    url: robustWS.config.url
  });
  
  // 用户友好提示
  if (error.message === 'WSS_REQUIRED') {
    showToast('安全连接失败,请使用 HTTPS 访问');
  } else {
    showToast('连接失败,请检查网络');
  }
});

robustWS.on('authFailed', (error) => {
  console.error('认证失败:', error);
  
  // 记录安全事件
  Logger.logSecurityEvent(EventType.UNAUTHORIZED_ACCESS, {
    source: 'websocket',
    reason: error.message
  });
  
  // 根据不同错误类型处理
  switch (error.message) {
    case 'NO_AUTH_TOKEN':
      window.location.href = '/login?reason=no_token';
      break;
    case 'INVALID_TOKEN':
      window.location.href = '/login?reason=invalid_token';
      break;
    case 'AUTH_TIMEOUT':
      showToast('认证超时,请重新登录');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      break;
    default:
      showToast('认证失败,请重新登录');
  }
});

robustWS.on('signatureError', (data) => {
  console.error('签名验证失败:', data);
  
  // 记录 CSRF 攻击尝试
  Logger.logSecurityEvent(EventType.CSRF_ATTEMPT, {
    source: 'websocket',
    data: JSON.stringify(data).substring(0, 200)
  });
  
  // 可能的中间人攻击,断开连接
  robustWS.disconnect();
  showToast('检测到异常,已断开连接');
});

robustWS.on('close', (event) => {
  console.log('连接关闭:', event.code, event.reason);
  
  // 记录审计日志
  Logger.logAudit(EventType.LOGOUT, {
    method: 'websocket',
    reason: event.reason || 'Connection closed',
    code: event.code
  });
  
  // 非正常关闭提示
  if (!event.wasClean) {
    showToast('连接意外断开,正在重连...');
  }
});

robustWS.on('reconnect', (attempt) => {
  console.log(`重连中... (${attempt}/10)`);
  
  // 多次重连失败后提示
  if (attempt === 5) {
    showToast('连接不稳定,请检查网络');
  } else if (attempt >= 10) {
    showToast('无法连接服务器,请刷新页面重试');
  }
});

robustWS.on('heartbeatTimeout', () => {
  console.warn('⚠️ 心跳超时,连接可能已断开');
  
  // 记录性能日志
  Logger.logPerformance(EventType.API_CALL, {
    url: robustWS.config.url,
    duration: robustWS.config.heartbeatTimeout,
    success: false
  });
});


// ==================== 导出配置 ====================

// 根据环境自动选择配置
export function createWebSocket() {
  const isProduction = process.env.NODE_ENV === 'production' ||
                       location.protocol === 'https:';
  
  if (isProduction) {
    return new WSAPIManager(productionConfig);
  } else {
    return new WSAPIManager(developmentConfig);
  }
}

// 默认导出
export default {
  productionConfig,
  developmentConfig,
  createWebSocket
};
