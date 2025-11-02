# WebSocket API 使用指南

WebSocket API 模块 (`utils/wsapi.js`) 提供了完整的 WebSocket 连接管理功能，支持自动重连、心跳检测、消息队列和加密通信。

## 目录
- [快速开始](#快速开始)
- [配置选项](#配置选项)
- [API 参考](#api-参考)
- [事件监听](#事件监听)
- [最佳实践](#最佳实践)
- [故障排查](#故障排查)

---

## 快速开始

### 1. 配置 WebSocket URL

编辑 `config/app.config.json`：

```json
{
  "api": {
    "baseUrl": "https://api.example.com",
    "wsUrl": "wss://api.example.com/ws"
  },
  "security": {
    "connectSrc": [
      "https://api.example.com",
      "wss://api.example.com"
    ]
  }
}
```

⚠️ **注意**：
- 生产环境使用 `wss://`（WebSocket Secure）
- 开发环境可使用 `ws://`
- 必须在 CSP `connectSrc` 中添加 WebSocket 域名

### 2. 引入模块

在 HTML 页面中引入：

```html
<!-- 引入加密库（如果需要加密通信） -->
<script src="../../utils/md5.js"></script>
<script src="../../utils/aes.js"></script>

<!-- 引入 WebSocket API -->
<script src="../../utils/wsapi.js"></script>
```

### 3. 基础使用

```javascript
// 使用默认全局实例
wsapi.connect();

// 监听连接成功
wsapi.on('open', () => {
  console.log('WebSocket connected');
  
  // 发送消息
  wsapi.send({
    type: 'subscribe',
    channel: 'notifications'
  });
});

// 监听消息
wsapi.on('message', (data) => {
  console.log('Received:', data);
});

// 监听错误
wsapi.on('error', (error) => {
  console.error('WebSocket error:', error);
});

// 监听关闭
wsapi.on('close', (event) => {
  console.log('WebSocket closed');
});
```

### 4. 创建自定义实例

```javascript
const customWS = new WSAPIManager({
  url: 'wss://custom-server.com/ws',
  reconnect: true,
  reconnectInterval: 5000,
  heartbeat: true,
  debug: true
});

customWS.connect();
```

---

## 配置选项

### 构造函数参数

```javascript
new WSAPIManager({
  // WebSocket URL（默认从 APP_CONFIG.api.wsUrl 读取）
  url: 'wss://api.example.com/ws',
  
  // WebSocket 子协议
  protocols: [],
  
  // 自动重连（默认启用）
  reconnect: true,
  
  // 重连间隔（毫秒，默认 3000）
  reconnectInterval: 3000,
  
  // 最大重连次数（默认 10）
  reconnectMaxAttempts: 10,
  
  // 心跳检测（默认启用）
  heartbeat: true,
  
  // 心跳间隔（毫秒，默认 30000）
  heartbeatInterval: 30000,
  
  // 心跳超时（毫秒，默认 5000）
  heartbeatTimeout: 5000,
  
  // 心跳消息（默认 JSON ping）
  heartbeatMessage: JSON.stringify({ type: 'ping' }),
  
  // 调试模式（默认关闭）
  debug: false,
  
  // 加密通信（默认关闭，需要 AES + MD5 库）
  encrypt: false,
  
  // 消息队列最大长度（默认 100）
  maxQueueSize: 100
})
```

---

## API 参考

### 连接管理

#### `connect(url?: string)`
连接到 WebSocket 服务器

```javascript
wsapi.connect();
// 或指定 URL
wsapi.connect('wss://another-server.com/ws');
```

#### `disconnect()`
断开连接并禁用自动重连

```javascript
wsapi.disconnect();
```

#### `isConnected(): boolean`
检查是否已连接

```javascript
if (wsapi.isConnected()) {
  console.log('Connected');
}
```

#### `getStatus(): object`
获取连接状态

```javascript
const status = wsapi.getStatus();
console.log(status);
// {
//   connected: true,
//   reconnecting: false,
//   reconnectAttempts: 0,
//   lastConnectTime: 1699012345678,
//   lastDisconnectTime: null,
//   readyState: 1,
//   url: 'wss://api.example.com/ws',
//   queueSize: 0
// }
```

### 消息发送

#### `send(data, encrypt?: boolean): boolean`
发送消息

```javascript
// 发送对象（自动序列化）
wsapi.send({
  action: 'subscribe',
  channel: 'trades'
});

// 发送字符串
wsapi.send('Hello Server');

// 发送加密消息
wsapi.send({ secret: 'data' }, true);
```

**返回值**：
- `true` - 发送成功
- `false` - 发送失败（未连接时会自动加入队列）

### 事件监听

#### `on(event, callback)`
订阅事件

```javascript
wsapi.on('message', (data) => {
  console.log('Message:', data);
});
```

#### `off(event, callback)`
取消订阅

```javascript
function handler(data) {
  console.log(data);
}

wsapi.on('message', handler);
wsapi.off('message', handler);
```

---

## 事件监听

### 可用事件

#### `open`
连接成功

```javascript
wsapi.on('open', (event) => {
  console.log('Connected to server');
});
```

#### `close`
连接关闭

```javascript
wsapi.on('close', (event) => {
  console.log('Connection closed:', event.code, event.reason);
});
```

#### `error`
连接错误

```javascript
wsapi.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

#### `message`
收到消息

```javascript
wsapi.on('message', (data) => {
  console.log('Received:', data);
  
  // 根据消息类型处理
  if (data.type === 'notification') {
    showNotification(data.content);
  }
});
```

#### `reconnect`
开始重连

```javascript
wsapi.on('reconnect', (attempts) => {
  console.log(`Reconnecting... Attempt ${attempts}`);
});
```

#### `heartbeatTimeout`
心跳超时

```javascript
wsapi.on('heartbeatTimeout', () => {
  console.warn('Heartbeat timeout, connection may be lost');
});
```

---

## 最佳实践

### 1. 完整示例

```javascript
// 页面加载后连接
Page({
  onLoad() {
    this.initWebSocket();
  },

  initWebSocket() {
    // 监听事件
    wsapi.on('open', this.onWSOpen.bind(this));
    wsapi.on('message', this.onWSMessage.bind(this));
    wsapi.on('close', this.onWSClose.bind(this));
    wsapi.on('error', this.onWSError.bind(this));
    wsapi.on('reconnect', this.onWSReconnect.bind(this));

    // 连接
    wsapi.connect();
  },

  onWSOpen(event) {
    console.log('[WS] Connected');
    
    // 订阅频道
    wsapi.send({
      action: 'subscribe',
      channels: ['trades', 'ticker', 'orderbook']
    });
  },

  onWSMessage(data) {
    console.log('[WS] Message:', data);
    
    // 根据消息类型分发
    switch (data.type) {
      case 'trade':
        this.updateTrades(data.payload);
        break;
      case 'ticker':
        this.updateTicker(data.payload);
        break;
      case 'orderbook':
        this.updateOrderbook(data.payload);
        break;
    }
  },

  onWSClose(event) {
    console.log('[WS] Closed');
  },

  onWSError(error) {
    console.error('[WS] Error:', error);
  },

  onWSReconnect(attempts) {
    console.log(`[WS] Reconnecting... (${attempts})`);
  },

  onUnload() {
    // 页面卸载时断开连接
    wsapi.disconnect();
  }
});
```

### 2. 消息队列

离线时发送的消息会自动加入队列，连接成功后自动发送：

```javascript
// 即使未连接，也可以发送
wsapi.send({ action: 'ping' }); // 会加入队列

// 连接成功后自动发送队列中的所有消息
```

### 3. 加密通信

启用加密需要先登录并获取 API Key：

```javascript
// 登录后 sessionStorage 中有 'k'（API Key）
const encryptedWS = new WSAPIManager({
  encrypt: true,
  debug: true
});

encryptedWS.connect();

// 发送加密消息
encryptedWS.send({
  action: 'sensitiveData',
  data: '...'
});
```

### 4. 错误处理

```javascript
wsapi.on('error', (error) => {
  // 记录错误
  console.error('WebSocket error:', error);
  
  // 通知用户
  if (window.Page && Page.current) {
    Page.current.setData({
      wsStatus: 'error',
      wsError: error.message
    });
  }
});

wsapi.on('close', (event) => {
  if (!event.wasClean) {
    console.error('Connection lost unexpectedly');
    // 显示重连提示
  }
});
```

### 5. 性能优化

```javascript
// 1. 减少心跳频率（如果服务端支持）
const ws = new WSAPIManager({
  heartbeatInterval: 60000 // 60秒
});

// 2. 限制消息队列大小
const ws = new WSAPIManager({
  maxQueueSize: 50
});

// 3. 调试模式仅在开发环境启用
const ws = new WSAPIManager({
  debug: location.hostname === 'localhost'
});
```

---

## 故障排查

### 问题 1: 无法连接

**症状**: 连接失败，控制台显示 `WebSocket connection failed`

**解决方案**:
1. 检查 WebSocket URL 是否正确
2. 检查 CSP 配置是否包含 WebSocket 域名
3. 检查服务端是否已启动
4. 检查网络是否可达

```javascript
// 调试连接问题
const ws = new WSAPIManager({
  url: 'wss://api.example.com/ws',
  debug: true // 启用调试日志
});

ws.on('error', (error) => {
  console.error('Connection error:', error);
});
```

### 问题 2: 频繁断线重连

**症状**: 不断触发 `reconnect` 事件

**解决方案**:
1. 检查心跳配置是否合理
2. 检查服务端是否主动关闭连接
3. 增加心跳间隔

```javascript
const ws = new WSAPIManager({
  heartbeatInterval: 60000, // 增加到 60 秒
  heartbeatTimeout: 10000   // 增加超时时间
});
```

### 问题 3: 消息丢失

**症状**: 发送的消息服务端未收到

**解决方案**:
1. 检查是否在连接成功前发送（应等待 `open` 事件）
2. 检查消息队列是否已满
3. 检查消息格式是否正确

```javascript
wsapi.on('open', () => {
  // 连接成功后才发送
  wsapi.send({ action: 'subscribe' });
});

// 检查队列状态
const status = wsapi.getStatus();
console.log('Queue size:', status.queueSize);
```

### 问题 4: CSP 阻止连接

**症状**: 控制台显示 CSP 违规

**解决方案**:
编辑 `config/app.config.json` 添加 WebSocket 域名：

```json
{
  "security": {
    "connectSrc": [
      "'self'",
      "https://api.example.com",
      "wss://api.example.com"  // ⭐ 添加这行
    ]
  }
}
```

---

## 服务端示例

### Node.js (ws 库)

```javascript
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Client connected');

  // 心跳响应
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      // 响应心跳
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
        return;
      }

      // 处理其他消息
      console.log('Received:', data);
      
      // 广播消息
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'broadcast',
            data: data
          }));
        }
      });
      
    } catch (error) {
      console.error('Message error:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});
```

---

## 更新日志

### v1.0.0 (2025-11-02)
- ✅ 初始版本
- ✅ 自动重连机制
- ✅ 心跳检测
- ✅ 消息队列
- ✅ 事件系统
- ✅ 加密通信支持
- ✅ 调试模式

---

**开发者**: King, Rainbow Haruko
