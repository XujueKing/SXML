# 日志系统快速开始指南

## 🚀 5分钟快速启动

### 1. 引入日志模块 (已自动完成)

日志系统已集成到 SXML 编译器,所有编译后的页面会自动包含 `logger.js`。

### 2. 启动日志服务器

```bash
# 方式一: 直接启动
npm run log:server

# 方式二: 后台运行 (推荐生产环境)
pm2 start utils/log-server.js --name log-server
```

服务器启动后会监听 `http://localhost:3002`

### 3. 查看实时日志

```bash
# 安全事件日志
npm run log:view:security

# 审计日志
npm run log:view:audit

# 性能监控日志
npm run log:view:performance
```

---

## 📝 基本使用

### 记录登录成功

```javascript
// 在登录成功回调中
Logger.logSecurityEvent(EventType.LOGIN_SUCCESS, {
  ipAddress: '192.168.1.100',
  loginMethod: 'password'
});
```

### 记录登录失败

```javascript
// 在登录失败时
Logger.logSecurityEvent(EventType.LOGIN_FAILED, {
  ipAddress: '192.168.1.100',
  username: 'user@example.com',
  reason: 'Invalid password',
  attemptCount: 3
});
```

### 记录数据修改

```javascript
// 更新用户信息后
Logger.logAudit(EventType.DATA_UPDATE, {
  resource: 'User',
  resourceId: '12345',
  changes: {
    email: { from: 'old@example.com', to: 'new@example.com' }
  }
});
```

### 记录错误

```javascript
// 捕获异常时
try {
  // 业务逻辑
} catch (error) {
  Logger.logError(error, {
    context: 'Payment processing',
    orderId: 'ORD-001'
  });
}
```

---

## 🔔 配置告警 (可选)

### 1. 创建钉钉机器人

1. 打开钉钉群聊
2. 群设置 → 智能群助手 → 添加机器人 → 自定义
3. 复制 Webhook URL

### 2. 设置环境变量

```bash
# Windows
set DINGTALK_WEBHOOK=https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN

# Linux/Mac
export DINGTALK_WEBHOOK=https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN
```

### 3. 重启日志服务器

```bash
pm2 restart log-server
```

现在高危事件会自动发送到钉钉群!

---

## 📊 查看日志

### 使用 jq 格式化输出

```bash
# 实时查看格式化的安全日志
tail -f logs/security.log | jq

# 查找最近 10 条登录失败记录
grep LOGIN_FAILED logs/security.log | tail -10 | jq

# 统计今天的登录失败次数
grep $(date +%Y-%m-%d) logs/security.log | grep LOGIN_FAILED | wc -l
```

### 分析慢 API

```bash
# 查找耗时超过 2 秒的 API 调用
cat logs/performance.log | jq 'select(.duration > 2000) | {url, duration, timestamp}'
```

---

## 💡 常见场景

### 场景 1: 检测暴力破解

系统会自动检测 5 次登录失败,并记录 `BRUTE_FORCE_ATTEMPT` 事件。

查看暴力破解尝试:
```bash
grep BRUTE_FORCE_ATTEMPT logs/security.log | jq
```

### 场景 2: 审计敏感操作

记录所有数据删除操作:
```javascript
Logger.logAudit(EventType.DATA_DELETE, {
  resource: 'User',
  resourceId: userId,
  reason: 'Admin request',
  backup: true
});
```

查看所有删除记录:
```bash
grep DATA_DELETE logs/audit.log | jq
```

### 场景 3: 性能优化

自动监控慢页面和慢 API,超过阈值会自动记录:
- 页面加载 > 3秒
- API 调用 > 2秒

查看慢页面:
```bash
cat logs/performance.log | jq 'select(.eventType == "PAGE_LOAD" and .loadTime > 3000)'
```

---

## 🛠️ 进阶配置

### 调整批量大小和刷新间隔

在 `utils/logger.js` 中修改:

```javascript
constructor() {
  this.batchSize = 20;      // 20条日志批量发送
  this.flushInterval = 10000; // 10秒刷新一次
  // ...
}
```

### 自定义性能阈值

```javascript
shouldLogPerformance(eventType, data) {
  const thresholds = {
    PAGE_LOAD: 5000,      // 页面加载 > 5秒
    API_CALL: 3000,       // API 调用 > 3秒
    RESOURCE_LOAD: 10000  // 资源加载 > 10秒
  };
  // ...
}
```

---

## 📚 完整文档

详细文档请查看:
- **使用指南**: `docs/LOGGER_README.md`
- **API 参考**: `utils/logger.js` 代码注释
- **服务端配置**: `utils/log-server.js`

---

## ❓ 常见问题

**Q: 日志文件太大怎么办?**

A: 配置日志轮转:
```bash
# 每天轮转,保留 30 天
logrotate -f /etc/logrotate.d/sxml-logs
```

**Q: 如何禁用性能日志?**

A: 修改 `shouldLogPerformance()` 返回 `false`

**Q: 日志发送失败怎么办?**

A: 日志会自动缓存到 localStorage,等网络恢复后重新发送

---

**开始使用日志系统,让你的应用更安全、更可控!** 🎉
