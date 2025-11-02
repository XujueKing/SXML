# CSP 违规日志目录

此目录用于存储 Content Security Policy (CSP) 违规报告。

## 日志文件

- `csp-violations.log` - CSP 违规记录（JSON 格式）

## 日志格式

每条记录为一个 JSON 对象：

```json
{
  "timestamp": "2025-11-02T10:30:45.123Z",
  "documentUri": "https://ice-markets-app.com/pages/login/login.html",
  "violatedDirective": "script-src 'self' 'nonce-xxx'",
  "blockedUri": "https://evil.com/malicious.js",
  "sourceFile": "https://ice-markets-app.com/pages/login/login.html",
  "lineNumber": 42,
  "userAgent": "Mozilla/5.0 ..."
}
```

## 日志轮转

建议配置日志轮转避免文件过大：

```bash
# /etc/logrotate.d/csp-violations
/var/www/ice/logs/csp-violations.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 www-data www-data
}
```

## 查看日志

```bash
# 最近 100 条
tail -100 csp-violations.log

# 实时监控
tail -f csp-violations.log

# 统计违规类型
cat csp-violations.log | jq -r '.violatedDirective' | sort | uniq -c
```
