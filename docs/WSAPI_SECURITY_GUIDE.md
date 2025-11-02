# WebSocket 安全增强指南

## 📋 概述

根据安全审计报告 10.2 节的建议,`utils/wsapi.js` 已实现以下三大安全增强:

1. **WSS (WebSocket over TLS)** - 强制加密传输
2. **身份验证机制** - 连接时验证用户身份
3. **消息签名验证** - 防止消息篡改

---

## 🔒 安全功能详解

### 1. WSS 强制加密

#### 功能说明
- 自动将 `ws://` 升级为 `wss://` (HTTPS 环境)
- 阻止在 HTTPS 页面使用非加密 WebSocket 连接
- 确保所有 WebSocket 通信经过 TLS 加密

#### 配置示例

```javascript
// 方式一: 默认配置 (自动启用 WSS)
const wsapi = new WSAPIManager({
  url: 'wss://api.example.com/ws'  // 显式使用 WSS
});

// 方式二: 强制升级 HTTP 到 WSS
const wsapi = new WSAPIManager({
  enforceWSS: true,  // 默认已启用
  url: 'ws://api.example.com/ws'  // 会自动升级为 wss://
});

// 方式三: 开发环境临时禁用 (仅用于本地测试)
const wsapi = new WSAPIManager({
  enforceWSS: false,  // 允许 ws:// 连接
  url: 'ws://localhost:8080/ws'
});
```

#### 服务端配置

Nginx 反向代理配置:

```nginx
# WebSocket WSS 配置
location /ws {
    proxy_pass http://localhost:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # SSL 配置
    proxy_ssl_server_name on;
    proxy_ssl_protocols TLSv1.2 TLSv1.3;
}
```

---

### 2. 身份验证机制

#### 功能说明
- 连接建立后自动发送认证令牌
- 认证失败自动断开连接
- 支持认证超时检测 (默认 10 秒)
- 未认证状态禁止发送业务消息

#### 客户端配置

```javascript
// 方式一: 自动从 sessionStorage 获取 token
sessionStorage.setItem('authToken', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

const wsapi = new WSAPIManager({
  requireAuth: true,  // 默认启用
  url: 'wss://api.example.com/ws'
});

wsapi.on('authenticated', () => {
  console.log('WebSocket 认证成功');
  // 可以开始发送业务消息
});

wsapi.on('authFailed', (error) => {
  console.error('WebSocket 认证失败:', error);
  // 处理认证失败 (如跳转登录页)
  window.location.href = '/login';
});

wsapi.connect();
```

```javascript
// 方式二: 手动指定 token
const wsapi = new WSAPIManager({
  requireAuth: true,
  authToken: 'your-auth-token-here',
  url: 'wss://api.example.com/ws'
});

// 方式三: 动态更新 token
wsapi.setAuthToken('new-token-after-refresh');
```

#### 服务端实现

Node.js 示例:

```javascript
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  let authenticated = false;
  let authTimeout;

  // 设置认证超时
  authTimeout = setTimeout(() => {
    if (!authenticated) {
      ws.send(JSON.stringify({ 
        type: 'auth', 
        success: false, 
        error: 'AUTH_TIMEOUT' 
      }));
      ws.close();
    }
  }, 10000);

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);

      // 处理认证消息
      if (message.type === 'auth') {
        clearTimeout(authTimeout);

        // 验证 JWT Token
        jwt.verify(message.token, process.env.JWT_SECRET, (err, decoded) => {
          if (err) {
            ws.send(JSON.stringify({ 
              type: 'auth', 
              success: false, 
              error: 'INVALID_TOKEN' 
            }));
            ws.close();
          } else {
            authenticated = true;
            ws.userId = decoded.userId;
            ws.send(JSON.stringify({ 
              type: 'auth', 
              success: true 
            }));
          }
        });
        return;
      }

      // 业务消息需要认证
      if (!authenticated) {
        ws.send(JSON.stringify({ 
          error: 'NOT_AUTHENTICATED' 
        }));
        return;
      }

      // 处理业务消息...
      handleBusinessMessage(ws, message);

    } catch (error) {
      console.error('Message error:', error);
    }
  });
});
```

---

### 3. 消息签名验证

#### 功能说明
- 使用 HMAC 算法生成消息签名
- 防止消息在传输过程中被篡改
- 服务端验证签名确保消息完整性
- 签名失败消息自动丢弃

#### 客户端配置

```javascript
const wsapi = new WSAPIManager({
  url: 'wss://api.example.com/ws',
  enableSignature: true,  // 启用签名
  signatureSecret: 'your-shared-secret-key'  // 签名密钥
});

wsapi.on('signatureError', (data) => {
  console.error('签名验证失败:', data);
  // 记录安全事件
  Logger.logSecurityEvent(EventType.CSRF_ATTEMPT, {
    source: 'websocket',
    data: data
  });
});

wsapi.connect();

// 发送消息时自动添加签名
wsapi.send({
  type: 'update',
  data: { userId: 123, name: 'John' }
});
// 实际发送: {"data": "{...}", "signature": "ABC123...", "timestamp": 1699000000}
```

#### 服务端实现

Node.js 示例:

```javascript
const crypto = require('crypto');

// 生成 HMAC-SHA256 签名
function generateSignature(message, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex')
    .toUpperCase();
}

// 验证消息签名
function verifySignature(parsedData, secret) {
  if (!parsedData.signature || !parsedData.data) {
    return false;
  }

  const expectedSignature = generateSignature(parsedData.data, secret);
  return parsedData.signature === expectedSignature;
}

ws.on('message', (rawData) => {
  try {
    const parsedData = JSON.parse(rawData);

    // 验证签名
    if (!verifySignature(parsedData, process.env.SIGNATURE_SECRET)) {
      console.error('Signature verification failed');
      ws.send(JSON.stringify({ 
        error: 'INVALID_SIGNATURE' 
      }));
      return;
    }

    // 解析实际数据
    const actualData = JSON.parse(parsedData.data);
    
    // 处理业务逻辑...
    handleMessage(ws, actualData);

  } catch (error) {
    console.error('Message error:', error);
  }
});
```

---

## 🚀 完整使用示例

### 生产环境配置

```javascript
// 初始化 WebSocket (所有安全功能启用)
const wsapi = new WSAPIManager({
  url: 'wss://api.example.com/ws',
  
  // WSS 强制
  enforceWSS: true,
  
  // 身份验证
  requireAuth: true,
  authToken: sessionStorage.getItem('authToken'),
  
  // 消息签名
  enableSignature: true,
  signatureSecret: window.APP_CONFIG.ws.signatureSecret,
  
  // 其他配置
  reconnect: true,
  heartbeat: true,
  encrypt: false,  // 已使用 WSS，可选
  debug: false
});

// 监听事件
wsapi.on('open', () => {
  console.log('WebSocket 已连接');
});

wsapi.on('authenticated', () => {
  console.log('身份验证成功');
  
  // 订阅实时数据
  wsapi.send({
    type: 'subscribe',
    channels: ['orders', 'notifications']
  });
});

wsapi.on('authFailed', (error) => {
  console.error('认证失败:', error.message);
  
  // 跳转登录页
  if (error.message === 'INVALID_TOKEN') {
    window.location.href = '/login?reason=token_expired';
  }
});

wsapi.on('message', (data) => {
  console.log('收到消息:', data);
  
  // 处理不同类型消息
  switch (data.type) {
    case 'order_update':
      updateOrderUI(data.order);
      break;
    case 'notification':
      showNotification(data.message);
      break;
  }
});

wsapi.on('signatureError', (data) => {
  // 记录安全事件
  Logger.logSecurityEvent(EventType.CSRF_ATTEMPT, {
    source: 'websocket',
    timestamp: Date.now()
  });
});

wsapi.on('close', (event) => {
  console.log('连接关闭:', event.code);
});

wsapi.on('error', (error) => {
  console.error('WebSocket 错误:', error);
});

// 连接
wsapi.connect();
```

### 开发环境配置

```javascript
// 开发环境: 部分安全功能可选
const wsapi = new WSAPIManager({
  url: 'ws://localhost:8080/ws',  // 本地开发
  
  enforceWSS: false,     // 允许 ws://
  requireAuth: false,    // 跳过认证
  enableSignature: false, // 跳过签名
  
  debug: true  // 启用调试日志
});

wsapi.connect();
```

---

## 🛡️ 安全最佳实践

### 1. 密钥管理

```javascript
// ❌ 错误: 硬编码密钥
const wsapi = new WSAPIManager({
  signatureSecret: 'my-secret-key-123'
});

// ✅ 正确: 从配置读取
const wsapi = new WSAPIManager({
  signatureSecret: window.APP_CONFIG.ws.signatureSecret
});
```

### 2. 错误处理

```javascript
wsapi.on('error', (error) => {
  // 记录错误日志
  Logger.logError(error, {
    context: 'WebSocket Error',
    url: wsapi.config.url
  });

  // 不要暴露敏感信息给用户
  showToast('连接失败，请稍后重试');
});
```

### 3. 令牌刷新

```javascript
// 监听 token 刷新事件
window.addEventListener('token-refreshed', (event) => {
  const newToken = event.detail.token;
  
  // 更新 WebSocket 认证令牌
  wsapi.setAuthToken(newToken);
  
  // 如果连接已断开，重新连接
  if (!wsapi.isConnected()) {
    wsapi.connect();
  }
});
```

### 4. 消息大小限制

```javascript
const wsapi = new WSAPIManager({
  maxMessageSize: 1048576,  // 1MB 限制
  // ...
});

// 发送大文件时分块传输
function sendLargeData(data) {
  const chunks = splitIntoChunks(data, 100 * 1024); // 100KB per chunk
  
  chunks.forEach((chunk, index) => {
    wsapi.send({
      type: 'chunk',
      index: index,
      total: chunks.length,
      data: chunk
    });
  });
}
```

### 5. 断线重连策略

```javascript
const wsapi = new WSAPIManager({
  reconnect: true,
  reconnectInterval: 3000,      // 3秒后重连
  reconnectMaxAttempts: 10,     // 最多重连 10 次
  // ...
});

wsapi.on('reconnect', (attempt) => {
  console.log(`重连尝试 ${attempt}/10`);
  
  if (attempt === 5) {
    // 5 次失败后提示用户
    showToast('连接不稳定，正在重连...');
  }
});

wsapi.on('close', (event) => {
  if (wsapi.status.reconnectAttempts >= 10) {
    // 达到最大重连次数
    showToast('连接失败，请检查网络后手动刷新页面');
  }
});
```

---

## 🔍 安全状态检查

### 查看当前安全配置

```javascript
const status = wsapi.getStatus();

console.log('安全功能状态:', status.securityFeatures);
/*
{
  wss: true,                // 是否使用 WSS
  authRequired: true,       // 是否需要认证
  signatureEnabled: true,   // 是否启用签名
  encryptionEnabled: false  // 是否启用额外加密
}
*/

console.log('认证状态:', status.authenticated);  // true/false
console.log('连接 URL:', status.url);            // wss://...
```

### 动态配置安全选项

```javascript
// 运行时调整安全配置
wsapi.configureSecurity({
  enforceWSS: true,
  requireAuth: true,
  enableSignature: true,
  signatureSecret: 'new-secret'
});

// 更新认证令牌
wsapi.setAuthToken('new-jwt-token');

// 更新签名密钥
wsapi.setSignatureSecret('new-signature-secret');
```

---

## 📊 安全审计

### 与日志系统集成

```javascript
// 记录 WebSocket 安全事件
wsapi.on('open', () => {
  Logger.logSecurityEvent(EventType.LOGIN_SUCCESS, {
    method: 'websocket',
    url: wsapi.config.url,
    wss: wsapi.config.url.startsWith('wss://')
  });
});

wsapi.on('authFailed', (error) => {
  Logger.logSecurityEvent(EventType.LOGIN_FAILED, {
    method: 'websocket',
    reason: error.message,
    url: wsapi.config.url
  });
});

wsapi.on('signatureError', (data) => {
  Logger.logSecurityEvent(EventType.CSRF_ATTEMPT, {
    source: 'websocket',
    message: 'Signature verification failed',
    data: data
  });
});

wsapi.on('error', (error) => {
  Logger.logError(error, {
    context: 'WebSocket',
    url: wsapi.config.url
  });
});
```

---

## 🧪 测试

### 测试 WSS 强制

```javascript
// 测试: HTTPS 下禁止 ws://
if (location.protocol === 'https:') {
  const wsapi = new WSAPIManager({
    enforceWSS: true,
    url: 'ws://api.example.com/ws'  // 应该报错
  });
  
  wsapi.on('error', (error) => {
    console.assert(error.message === 'WSS_REQUIRED', '应强制使用 WSS');
  });
  
  wsapi.connect();
}
```

### 测试身份验证

```javascript
// 测试: 未认证禁止发送消息
const wsapi = new WSAPIManager({
  requireAuth: true,
  url: 'wss://api.example.com/ws'
});

wsapi.connect();

// 在认证前发送消息应该失败
const result = wsapi.send({ type: 'test' });
console.assert(result === false, '未认证应禁止发送消息');

// 认证后可以发送
wsapi.on('authenticated', () => {
  const result = wsapi.send({ type: 'test' });
  console.assert(result === true, '认证后应允许发送消息');
});
```

### 测试消息签名

```javascript
// 测试: 签名验证
const wsapi = new WSAPIManager({
  enableSignature: true,
  signatureSecret: 'test-secret',
  url: 'wss://api.example.com/ws'
});

wsapi.on('signatureError', (data) => {
  console.log('捕获到签名错误:', data);
});

wsapi.connect();
```

---

## 🔗 相关文档

- [WebSocket API 基础文档](./WSAPI_README.md)
- [安全审计报告](./SECURITY_AUDIT_REPORT.md)
- [日志系统文档](./LOGGER_README.md)
- [CSP 安全策略](./SECURITY.md)

---

## ❓ 常见问题

**Q: 启用签名后性能有影响吗?**

A: 轻微影响。签名生成使用 MD5/HMAC,每条消息增加 ~1ms 处理时间。对于实时性要求极高的场景,可仅对敏感消息启用签名。

**Q: WSS 和内置加密 (encrypt) 可以同时使用吗?**

A: 可以,但通常不必要。WSS 已提供 TLS 加密,内置加密主要用于额外的端到端加密场景。

**Q: 如何在 Nginx 后配置 WSS?**

A: 参考本文档 "1. WSS 强制加密" 章节的 Nginx 配置示例。

**Q: 认证令牌过期怎么办?**

A: 监听 `authFailed` 事件,引导用户重新登录或使用刷新令牌自动续期。

**Q: 签名密钥应该如何存储?**

A: 客户端从后端配置接口获取 (不要硬编码),服务端存储在环境变量中。定期轮换密钥。

---

**安全无小事,通信需谨慎!** 🛡️
