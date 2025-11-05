# 日志系统使用指南

## 📋 概述

统一日志系统提供三大核心功能:
- 🔒 **安全事件日志**: 登录失败、异常访问、暴力破解检测
- 📝 **审计日志**: 敏感操作记录、数据变更追踪
- ⚡ **性能监控日志**: 页面加载、API调用、资源加载

## 🚀 快速开始

### 1. 引入日志模块

在 HTML 页面中引入 `logger.js`:

```html
<script src="../../utils/logger.js"></script>
```

日志系统会自动初始化并开始监控:
- ✅ 页面加载性能
- ✅ API 调用耗时
- ✅ 全局错误捕获

### 2. 启动日志服务器

```bash
# 开发环境
node utils/log-server.js

# 生产环境 (使用 PM2)
pm2 start utils/log-server.js --name log-server
```

服务器默认监听 `http://localhost:3002`

### 3. 配置环境变量

```bash
# .env 文件
DINGTALK_WEBHOOK=https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN
```

---

## 📖 API 文档

### 安全事件日志

#### 记录登录成功
```javascript
Logger.logSecurityEvent(EventType.LOGIN_SUCCESS, {
  ipAddress: '192.168.1.100',
  loginMethod: 'password', // password, qrcode, sso
  sessionDuration: 3600000 // 1小时
});
```

#### 记录登录失败
```javascript
Logger.logSecurityEvent(EventType.LOGIN_FAILED, {
  ipAddress: '192.168.1.100',
  username: 'user@example.com',
  reason: 'Invalid password',
  attemptCount: 3
});
```

#### 记录登出
```javascript
Logger.logSecurityEvent(EventType.LOGOUT, {
  reason: 'user_initiated', // user_initiated, timeout, forced
  sessionDuration: 1800000
});
```

#### 记录未授权访问
```javascript
Logger.logSecurityEvent(EventType.UNAUTHORIZED_ACCESS, {
  resource: '/admin/settings',
  requiredPermission: 'admin.settings.write',
  userPermissions: ['user.read', 'user.write']
});
```

#### 记录可疑活动
```javascript
Logger.logSecurityEvent(EventType.SUSPICIOUS_ACTIVITY, {
  activity: 'Multiple failed login attempts',
  ipAddress: '192.168.1.100',
  details: 'User agent changed between requests'
});
```

### 审计日志

#### 记录数据创建
```javascript
Logger.logAudit(EventType.DATA_CREATE, {
  resource: 'User',
  resourceId: '12345',
  data: {
    username: 'newuser@example.com',
    role: 'editor'
  }
});
```

#### 记录数据更新
```javascript
Logger.logAudit(EventType.DATA_UPDATE, {
  resource: 'Product',
  resourceId: 'PRD-001',
  changes: {
    price: { from: 99.99, to: 89.99 },
    stock: { from: 100, to: 80 }
  }
});
```

#### 记录数据删除
```javascript
Logger.logAudit(EventType.DATA_DELETE, {
  resource: 'Order',
  resourceId: 'ORD-12345',
  reason: 'Customer request',
  backup: true // 是否已备份
});
```

#### 记录数据导出
```javascript
Logger.logAudit(EventType.DATA_EXPORT, {
  resource: 'UserList',
  format: 'CSV',
  recordCount: 1500,
  filters: { role: 'admin', active: true }
});
```

#### 记录权限变更
```javascript
Logger.logAudit(EventType.PERMISSION_CHANGE, {
  targetUser: 'user@example.com',
  permission: 'admin.users.delete',
  action: 'granted', // granted, revoked
  reason: 'Promoted to admin'
});
```

#### 记录配置变更
```javascript
Logger.logAudit(EventType.CONFIG_CHANGE, {
  configKey: 'api.rateLimit',
  oldValue: 100,
  newValue: 200,
  reason: 'Performance optimization'
});
```

### 性能监控日志

性能日志会自动记录,也可手动记录:

```javascript
// 手动记录 API 调用性能
const startTime = performance.now();
try {
  const response = await fetch('/api/data');
  const duration = performance.now() - startTime;
  
  Logger.logPerformance(EventType.API_CALL, {
    url: '/api/data',
    method: 'GET',
    status: response.status,
    duration,
    success: response.ok
  });
} catch (error) {
  const duration = performance.now() - startTime;
  
  Logger.logPerformance(EventType.API_CALL, {
    url: '/api/data',
    method: 'GET',
    duration,
    failed: true,
    error: error.message
  });
}
```

### 错误日志

```javascript
// 手动记录错误
try {
  // 业务逻辑
} catch (error) {
  Logger.logError(error, {
    context: 'Payment processing',
    userId: '12345',
    orderId: 'ORD-001'
  });
}
```

---

## 🔧 集成示例

### 登录页集成

```javascript
// pages/login/login.js

// 登录成功
onLoginSuccess() {
  const userInfo = {
    userEmail: sessionStorage.getItem('u'),
    url: '/pages/index/index.html'
  };
  sessionStorage.setItem('USERINFO', JSON.stringify(userInfo));
  
  // 记录登录成功日志
  Logger.logSecurityEvent(EventType.LOGIN_SUCCESS, {
    ipAddress: this.getUserIP(), // 需实现 IP 获取
    loginMethod: this.data.codeStatus ? 'qrcode' : 'password',
    deviceInfo: navigator.userAgent
  });
  
  // 跳转
  window.location.href = userInfo.url;
}

// 登录失败
onLoginFailed(reason) {
  // 记录登录失败日志
  Logger.logSecurityEvent(EventType.LOGIN_FAILED, {
    ipAddress: this.getUserIP(),
    username: sessionStorage.getItem('u'),
    reason: reason,
    attemptCount: this.loginAttempts++
  });
  
  ShowToast(i18n.t('login.failed', '登录失败'));
}

// 登出
logout() {
  const sessionStart = sessionStorage.getItem('_session_start');
  const sessionDuration = sessionStart ? Date.now() - parseInt(sessionStart) : 0;
  
  Logger.logSecurityEvent(EventType.LOGOUT, {
    reason: 'user_initiated',
    sessionDuration
  });
  
  sessionStorage.clear();
  window.location.href = '/pages/login/login.html';
}
```

### 数据操作集成

```javascript
// 创建用户
async createUser(userData) {
  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    const result = await response.json();
    
    // 记录审计日志
    Logger.logAudit(EventType.DATA_CREATE, {
      resource: 'User',
      resourceId: result.id,
      data: {
        username: userData.username,
        role: userData.role
      }
    });
    
    return result;
  } catch (error) {
    Logger.logError(error, {
      context: 'User creation',
      userData
    });
    throw error;
  }
}

// 更新产品价格
async updateProductPrice(productId, newPrice, oldPrice) {
  const response = await fetch(`/api/products/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify({ price: newPrice })
  });
  
  if (response.ok) {
    Logger.logAudit(EventType.DATA_UPDATE, {
      resource: 'Product',
      resourceId: productId,
      changes: {
        price: { from: oldPrice, to: newPrice }
      }
    });
  }
  
  return response;
}

// 导出数据
async exportData(filters) {
  const response = await fetch('/api/export', {
    method: 'POST',
    body: JSON.stringify(filters)
  });
  
  const blob = await response.blob();
  
  Logger.logAudit(EventType.DATA_EXPORT, {
    resource: 'DataExport',
    format: 'CSV',
    filters,
    fileSize: blob.size
  });
  
  // 下载文件
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'export.csv';
  a.click();
}
```

### 权限检查集成

```javascript
// 权限中间件
function requirePermission(permission) {
  const userInfo = JSON.parse(sessionStorage.getItem('USERINFO') || '{}');
  const userPermissions = userInfo.permissions || [];
  
  if (!userPermissions.includes(permission)) {
    // 记录未授权访问
    Logger.logSecurityEvent(EventType.UNAUTHORIZED_ACCESS, {
      resource: window.location.pathname,
      requiredPermission: permission,
      userPermissions
    });
    
    ShowToast('您没有权限执行此操作');
    throw new Error('Insufficient permissions');
  }
}

// 使用示例
async function deleteUser(userId) {
  requirePermission('admin.users.delete');
  
  const response = await fetch(`/api/users/${userId}`, {
    method: 'DELETE'
  });
  
  if (response.ok) {
    Logger.logAudit(EventType.DATA_DELETE, {
      resource: 'User',
      resourceId: userId,
      reason: 'Admin action'
    });
  }
}
```

---

## 📊 日志格式

### 日志条目结构

```json
{
  "timestamp": "2025-11-02T12:34:56.789Z",
  "eventType": "LOGIN_SUCCESS",
  "level": "INFO",
  "category": "security",
  "userAccount": "user@example.com",
  "deviceFingerprint": "a1b2c3d4e5f6",
  "sessionId": "SID_1730534096789_abc123",
  "pageUrl": "https://example.com/pages/login/login.html",
  "referrer": "",
  "clientInfo": {
    "userAgent": "Mozilla/5.0...",
    "platform": "Win32",
    "language": "zh-CN",
    "screenResolution": "1920x1080",
    "viewport": "1366x768",
    "timezone": "Asia/Shanghai",
    "cookieEnabled": true,
    "online": true
  },
  "ipAddress": "192.168.1.100",
  "loginMethod": "password"
}
```

### 日志文件

日志按类别分别存储在:

- `logs/security.log` - 安全事件日志
- `logs/audit.log` - 审计日志
- `logs/performance.log` - 性能监控日志
- `logs/error.log` - 错误日志

---

## 🔔 告警配置

### 钉钉 Webhook 告警

1. 创建钉钉群机器人获取 Webhook URL
2. 配置环境变量:
```bash
export DINGTALK_WEBHOOK="https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN"
```

3. 重启日志服务器:
```bash
pm2 restart log-server
```

### 告警触发条件

以下事件会自动触发告警:
- 🔴 暴力破解尝试 (5次登录失败)
- 🔴 未授权访问
- 🔴 XSS/CSRF 攻击尝试
- 🔴 可疑活动
- 🔴 CRITICAL 或 ERROR 级别日志

---

## 📈 日志分析

### 查看实时日志

```bash
# 安全日志
tail -f logs/security.log | jq

# 审计日志
tail -f logs/audit.log | jq

# 性能日志
tail -f logs/performance.log | jq
```

### 统计登录失败次数

```bash
grep "LOGIN_FAILED" logs/security.log | wc -l
```

### 查找特定用户的操作

```bash
grep "user@example.com" logs/audit.log | jq
```

### 分析慢 API

```bash
cat logs/performance.log | jq 'select(.duration > 2000) | {url, duration}'
```

---

## 🛡️ 安全最佳实践

### 1. 敏感数据脱敏

```javascript
// 不要记录完整密码或密钥
Logger.logAudit(EventType.DATA_UPDATE, {
  resource: 'User',
  resourceId: userId,
  changes: {
    password: '***REDACTED***', // 脱敏
    apiKey: apiKey.substring(0, 8) + '...' // 部分显示
  }
});
```

### 2. 日志轮转

配置日志轮转防止磁盘占满:

```bash
# 使用 logrotate
cat > /etc/logrotate.d/sxml-logs << EOF
/path/to/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 www-data www-data
}
EOF
```

### 3. 访问控制

确保日志文件权限正确:

```bash
chmod 644 logs/*.log
chown www-data:www-data logs/*.log
```

---

## 📦 生产部署

### 1. 使用 PM2 管理

```bash
# 启动
pm2 start utils/log-server.js --name log-server

# 查看日志
pm2 logs log-server

# 重启
pm2 restart log-server

# 开机自启
pm2 startup
pm2 save
```

### 2. Nginx 反向代理

```nginx
location /api/logs {
    proxy_pass http://localhost:3002;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

### 3. 性能优化

- 调整批量大小: `logger.batchSize = 20`
- 调整刷新间隔: `logger.flushInterval = 10000` (10秒)
- 启用 gzip 压缩日志文件

---

## 🔍 故障排查

### 日志未发送到服务器

1. 检查浏览器控制台错误
2. 验证日志服务器是否运行: `curl http://localhost:3002/api/logs`
3. 检查 CORS 配置

### 日志文件未生成

1. 确认日志目录存在且有写权限
2. 检查服务器日志: `pm2 logs log-server`

### 告警未触发

1. 验证 Webhook URL 正确性
2. 检查钉钉机器人是否被禁用
3. 查看服务器错误日志

---

## 📚 参考资料

- [日志最佳实践](https://www.loggly.com/ultimate-guide/node-logging-basics/)
- [安全日志规范](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [钉钉机器人文档](https://open.dingtalk.com/document/robots/custom-robot-access)

---

**更新日期**: 2025-11-02  
**维护者**: SXML Security Team
