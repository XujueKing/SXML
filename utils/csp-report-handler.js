/**
 * CSP 违规报告处理器
 * 用于接收和分析 CSP 违规报告，支持邮件/钉钉/Slack 多渠道告警
 * 
 * 部署方式：
 * 1. 独立 Node.js 服务：node csp-report-handler.js
 * 2. 集成到现有后端：导入 handleCSPReport 函数
 * 3. Nginx 直接记录到日志：无需此脚本
 * 
 * 邮件配置：
 * 1. 编辑 config/app.config.json 中的 alert.email 配置
 * 2. 或使用环境变量：SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ALERT_EMAILS
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// 配置
const CONFIG = {
  PORT: 3001,
  LOG_FILE: path.join(__dirname, '../logs/csp-violations.log'),
  ENABLE_CONSOLE: true,  // 是否输出到控制台
  ENABLE_FILE: true,      // 是否写入文件
  ENABLE_ALERT: true,     // 是否发送告警（邮件/钉钉等）
};

// 加载应用配置
let APP_CONFIG = {};
try {
  const configPath = path.join(__dirname, '../config/app.config.json');
  APP_CONFIG = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
} catch (err) {
  console.warn('⚠️  Failed to load app.config.json, using defaults');
}

// 告警频率限制 (防止邮件轰炸)
const alertRateLimit = {
  lastAlertTime: {},  // { alertKey: timestamp }
  cooldownMs: (APP_CONFIG.alert?.email?.rateLimit?.cooldownMinutes || 5) * 60 * 1000,
  maxPerHour: APP_CONFIG.alert?.email?.rateLimit?.maxPerHour || 10,
  hourlyCount: {}
};

// 邮件发送器 (懒加载)
let emailTransporter = null;

/**
 * 初始化邮件发送器
 */
function initEmailTransporter() {
  if (emailTransporter) return emailTransporter;
  
  const emailConfig = APP_CONFIG.alert?.email;
  
  // 优先使用环境变量
  const smtpConfig = {
    host: process.env.SMTP_HOST || emailConfig?.smtp?.host || 'smtp.example.com',
    port: parseInt(process.env.SMTP_PORT || emailConfig?.smtp?.port || '465'),
    secure: process.env.SMTP_SECURE !== 'false' && (emailConfig?.smtp?.secure !== false),
    auth: {
      user: process.env.SMTP_USER || emailConfig?.smtp?.auth?.user || '',
      pass: process.env.SMTP_PASS || emailConfig?.smtp?.auth?.pass || ''
    }
  };
  
  if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
    console.warn('⚠️  SMTP credentials not configured, email alerts disabled');
    return null;
  }
  
  try {
    emailTransporter = nodemailer.createTransport(smtpConfig);
    console.log(`✅ Email transporter initialized: ${smtpConfig.host}:${smtpConfig.port}`);
    return emailTransporter;
  } catch (err) {
    console.error('❌ Failed to initialize email transporter:', err.message);
    return null;
  }
}

// 确保日志目录存在
const logDir = path.dirname(CONFIG.LOG_FILE);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * 处理 CSP 违规报告
 * @param {Object} report - CSP 违规报告
 */
function handleCSPReport(report) {
  const violation = report['csp-report'] || {};
  
  // 提取关键信息
  const summary = {
    timestamp: new Date().toISOString(),
    documentUri: violation['document-uri'],
    violatedDirective: violation['violated-directive'],
    effectiveDirective: violation['effective-directive'],
    blockedUri: violation['blocked-uri'],
    sourceFile: violation['source-file'],
    lineNumber: violation['line-number'],
    columnNumber: violation['column-number'],
    statusCode: violation['status-code'],
    userAgent: violation['user-agent'] || 'Unknown'
  };
  
  // 格式化日志
  const logEntry = JSON.stringify(summary, null, 2);
  
  // 输出到控制台
  if (CONFIG.ENABLE_CONSOLE) {
    console.log('\n🚨 CSP Violation Detected:');
    console.log('─'.repeat(60));
    console.log(`Time: ${summary.timestamp}`);
    console.log(`Page: ${summary.documentUri}`);
    console.log(`Directive: ${summary.violatedDirective}`);
    console.log(`Blocked: ${summary.blockedUri}`);
    if (summary.sourceFile) {
      console.log(`Source: ${summary.sourceFile}:${summary.lineNumber}:${summary.columnNumber}`);
    }
    console.log('─'.repeat(60));
  }
  
  // 写入文件
  if (CONFIG.ENABLE_FILE) {
    fs.appendFile(CONFIG.LOG_FILE, logEntry + '\n', (err) => {
      if (err) console.error('Failed to write log:', err);
    });
  }
  
  // 发送告警（示例：严重违规）
  if (CONFIG.ENABLE_ALERT && shouldAlert(violation)) {
    sendAlert(summary);
  }
}

/**
 * 判断是否需要告警
 * @param {Object} violation - 违规详情
 * @returns {boolean}
 */
function shouldAlert(violation) {
  const directive = violation['violated-directive'] || '';
  const blockedUri = violation['blocked-uri'] || '';
  
  // 告警条件：
  // 1. 阻止了外部脚本加载（可能是 XSS 攻击）
  if (directive.includes('script-src') && !blockedUri.includes('self')) {
    return true;
  }
  
  // 2. 尝试嵌入到 iframe（可能是点击劫持）
  if (directive.includes('frame-ancestors')) {
    return true;
  }
  
  // 3. 内联脚本被阻止（可能是代码注入）
  if (blockedUri === 'inline' && directive.includes('script-src')) {
    return true;
  }
  
  return false;
}

/**
 * 发送告警通知
 * @param {Object} summary - 违规摘要
 */
async function sendAlert(summary) {
  // 频率限制检查
  const alertKey = `${summary.violatedDirective}:${summary.blockedUri}`;
  if (!canSendAlert(alertKey)) {
    console.log('⏰ Alert rate limited, skipping');
    return;
  }
  
  console.error('\n⚠️  ALERT: Critical CSP Violation!');
  console.error(JSON.stringify(summary, null, 2));
  
  // 并行发送多种告警
  const alerts = [];
  
  // 1. 邮件告警
  if (APP_CONFIG.alert?.email?.enabled !== false) {
    alerts.push(sendEmailAlert(summary));
  }
  
  // 2. 钉钉告警
  if (APP_CONFIG.alert?.dingtalk?.enabled) {
    alerts.push(sendDingTalkAlert(summary));
  }
  
  // 3. Slack 告警
  if (APP_CONFIG.alert?.slack?.enabled) {
    alerts.push(sendSlackAlert(summary));
  }
  
  // 等待所有告警发送完成
  const results = await Promise.allSettled(alerts);
  
  // 统计发送结果
  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  console.log(`📧 Alerts sent: ${succeeded} succeeded, ${failed} failed`);
  
  // 记录发送时间
  recordAlert(alertKey);
}

/**
 * 检查是否可以发送告警 (频率限制)
 */
function canSendAlert(alertKey) {
  const now = Date.now();
  const lastTime = alertRateLimit.lastAlertTime[alertKey];
  
  // 冷却时间检查
  if (lastTime && (now - lastTime) < alertRateLimit.cooldownMs) {
    return false;
  }
  
  // 每小时次数限制
  const hourKey = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
  alertRateLimit.hourlyCount[hourKey] = alertRateLimit.hourlyCount[hourKey] || 0;
  
  if (alertRateLimit.hourlyCount[hourKey] >= alertRateLimit.maxPerHour) {
    return false;
  }
  
  return true;
}

/**
 * 记录告警发送
 */
function recordAlert(alertKey) {
  const now = Date.now();
  const hourKey = new Date().toISOString().slice(0, 13);
  
  alertRateLimit.lastAlertTime[alertKey] = now;
  alertRateLimit.hourlyCount[hourKey] = (alertRateLimit.hourlyCount[hourKey] || 0) + 1;
  
  // 清理旧数据 (保留最近2小时)
  const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000).toISOString().slice(0, 13);
  for (const key in alertRateLimit.hourlyCount) {
    if (key < twoHoursAgo) {
      delete alertRateLimit.hourlyCount[key];
    }
  }
}

/**
 * 发送邮件告警
 */
async function sendEmailAlert(summary) {
  const transporter = initEmailTransporter();
  if (!transporter) {
    throw new Error('Email transporter not available');
  }
  
  const emailConfig = APP_CONFIG.alert?.email;
  const recipients = process.env.ALERT_EMAILS 
    ? process.env.ALERT_EMAILS.split(',')
    : (emailConfig?.to || ['admin@example.com']);
  
  const subject = (emailConfig?.subject || '[Security Alert] CSP Violation')
    .replace('{{event_type}}', 'CSP Violation');
  
  const htmlBody = generateEmailHTML(summary);
  const textBody = generateEmailText(summary);
  
  const mailOptions = {
    from: emailConfig?.from || 'Security Alerts <alerts@example.com>',
    to: recipients.join(', '),
    subject: subject,
    text: textBody,
    html: htmlBody,
    priority: 'high',
    headers: {
      'X-Alert-Type': 'CSP-Violation',
      'X-Severity': 'HIGH'
    }
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent: ${info.messageId} to ${recipients.join(', ')}`);
    return info;
  } catch (err) {
    console.error('❌ Failed to send email:', err.message);
    throw err;
  }
}

/**
 * 生成邮件 HTML 内容
 */
function generateEmailHTML(summary) {
  const timestamp = new Date(summary.timestamp).toLocaleString('zh-CN', { 
    timeZone: 'Asia/Shanghai',
    hour12: false
  });
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc3545; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6; border-top: none; }
    .alert-box { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #dc3545; }
    .label { font-weight: bold; color: #495057; }
    .value { color: #212529; word-break: break-all; }
    .footer { background: #343a40; color: white; padding: 15px; text-align: center; border-radius: 0 0 5px 5px; font-size: 12px; }
    .severity-high { color: #dc3545; font-weight: bold; }
    code { background: #e9ecef; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 CSP 安全违规告警</h1>
    </div>
    <div class="content">
      <div class="alert-box">
        <p><span class="label">严重程度:</span> <span class="severity-high">HIGH</span></p>
        <p><span class="label">告警时间:</span> <span class="value">${timestamp}</span></p>
        <p><span class="label">违规页面:</span> <span class="value">${summary.documentUri || 'Unknown'}</span></p>
      </div>
      
      <h3>违规详情</h3>
      <div class="alert-box">
        <p><span class="label">违反策略:</span> <code>${summary.violatedDirective || 'N/A'}</code></p>
        <p><span class="label">有效指令:</span> <code>${summary.effectiveDirective || 'N/A'}</code></p>
        <p><span class="label">被阻止的资源:</span> <code>${summary.blockedUri || 'N/A'}</code></p>
        ${summary.sourceFile ? `
        <p><span class="label">源文件:</span> <code>${summary.sourceFile}</code></p>
        <p><span class="label">位置:</span> <code>Line ${summary.lineNumber}, Column ${summary.columnNumber}</code></p>
        ` : ''}
        <p><span class="label">状态码:</span> <span class="value">${summary.statusCode || 'N/A'}</span></p>
      </div>
      
      <h3>客户端信息</h3>
      <div class="alert-box">
        <p><span class="label">User-Agent:</span> <span class="value" style="font-size: 12px;">${summary.userAgent || 'Unknown'}</span></p>
      </div>
      
      <h3>🔍 可能的原因</h3>
      <ul>
        <li><strong>XSS 攻击尝试</strong> - 恶意脚本注入</li>
        <li><strong>第三方资源加载</strong> - 未授权的外部资源</li>
        <li><strong>代码注入</strong> - 内联脚本或样式违规</li>
        <li><strong>点击劫持</strong> - iframe 嵌入尝试</li>
      </ul>
      
      <h3>⚡ 建议措施</h3>
      <ol>
        <li>检查违规页面的源代码</li>
        <li>验证被阻止的资源是否合法</li>
        <li>如果是攻击,检查输入验证逻辑</li>
        <li>更新 CSP 策略(如需添加白名单)</li>
        <li>查看完整日志: <code>logs/csp-violations.log</code></li>
      </ol>
    </div>
    <div class="footer">
      此邮件由 CSP 违规监控系统自动发送 | ${new Date().getFullYear()} Security Team
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * 生成邮件纯文本内容
 */
function generateEmailText(summary) {
  const timestamp = new Date(summary.timestamp).toLocaleString('zh-CN', { 
    timeZone: 'Asia/Shanghai',
    hour12: false
  });
  
  return `
🚨 CSP 安全违规告警

严重程度: HIGH
告警时间: ${timestamp}
违规页面: ${summary.documentUri || 'Unknown'}

违规详情:
- 违反策略: ${summary.violatedDirective || 'N/A'}
- 有效指令: ${summary.effectiveDirective || 'N/A'}
- 被阻止的资源: ${summary.blockedUri || 'N/A'}
${summary.sourceFile ? `- 源文件: ${summary.sourceFile}\n- 位置: Line ${summary.lineNumber}, Column ${summary.columnNumber}` : ''}
- 状态码: ${summary.statusCode || 'N/A'}

客户端信息:
- User-Agent: ${summary.userAgent || 'Unknown'}

可能的原因:
1. XSS 攻击尝试 - 恶意脚本注入
2. 第三方资源加载 - 未授权的外部资源
3. 代码注入 - 内联脚本或样式违规
4. 点击劫持 - iframe 嵌入尝试

建议措施:
1. 检查违规页面的源代码
2. 验证被阻止的资源是否合法
3. 如果是攻击,检查输入验证逻辑
4. 更新 CSP 策略(如需添加白名单)
5. 查看完整日志: logs/csp-violations.log

---
此邮件由 CSP 违规监控系统自动发送
  `.trim();
}

/**
 * 发送钉钉告警
 */
async function sendDingTalkAlert(summary) {
  const dingtalkConfig = APP_CONFIG.alert?.dingtalk;
  const webhook = process.env.DINGTALK_WEBHOOK || dingtalkConfig?.webhook;
  
  if (!webhook) {
    throw new Error('DingTalk webhook not configured');
  }
  
  const timestamp = new Date(summary.timestamp).toLocaleString('zh-CN', { 
    timeZone: 'Asia/Shanghai',
    hour12: false
  });
  
  // 生成签名 (如果配置了 secret)
  let signParams = '';
  if (dingtalkConfig?.secret) {
    const secret = dingtalkConfig.secret;
    const timestampMs = Date.now();
    const stringToSign = `${timestampMs}\n${secret}`;
    const sign = crypto.createHmac('sha256', secret)
      .update(stringToSign)
      .digest('base64');
    signParams = `&timestamp=${timestampMs}&sign=${encodeURIComponent(sign)}`;
  }
  
  const message = {
    msgtype: 'markdown',
    markdown: {
      title: '🚨 CSP 安全违规告警',
      text: `
## 🚨 CSP 安全违规告警

**严重程度**: <font color="red">HIGH</font>  
**告警时间**: ${timestamp}  
**违规页面**: ${summary.documentUri || 'Unknown'}

### 违规详情
- **违反策略**: \`${summary.violatedDirective || 'N/A'}\`
- **被阻止资源**: \`${summary.blockedUri || 'N/A'}\`
${summary.sourceFile ? `- **源文件**: \`${summary.sourceFile}:${summary.lineNumber}:${summary.columnNumber}\`` : ''}

### 建议措施
1. 检查违规页面源代码
2. 验证资源合法性
3. 检查输入验证逻辑
4. 查看日志: \`logs/csp-violations.log\`
      `.trim()
    }
  };
  
  const https = require('https');
  const url = require('url');
  
  return new Promise((resolve, reject) => {
    const webhookUrl = webhook + signParams;
    const urlObj = url.parse(webhookUrl);
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ DingTalk alert sent');
          resolve(data);
        } else {
          reject(new Error(`DingTalk API error: ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(JSON.stringify(message));
    req.end();
  });
}

/**
 * 发送 Slack 告警
 */
async function sendSlackAlert(summary) {
  const slackConfig = APP_CONFIG.alert?.slack;
  const webhook = process.env.SLACK_WEBHOOK || slackConfig?.webhook;
  
  if (!webhook) {
    throw new Error('Slack webhook not configured');
  }
  
  const timestamp = new Date(summary.timestamp).toLocaleString('zh-CN', { 
    timeZone: 'Asia/Shanghai',
    hour12: false
  });
  
  const message = {
    text: '🚨 CSP 安全违规告警',
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🚨 CSP 安全违规告警'
        }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*严重程度:*\nHIGH` },
          { type: 'mrkdwn', text: `*告警时间:*\n${timestamp}` }
        ]
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*违反策略:*\n\`${summary.violatedDirective || 'N/A'}\`` },
          { type: 'mrkdwn', text: `*被阻止资源:*\n\`${summary.blockedUri || 'N/A'}\`` }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*违规页面:* ${summary.documentUri || 'Unknown'}`
        }
      }
    ]
  };
  
  const https = require('https');
  const url = require('url');
  
  return new Promise((resolve, reject) => {
    const urlObj = url.parse(webhook);
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Slack alert sent');
          resolve(data);
        } else {
          reject(new Error(`Slack API error: ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(JSON.stringify(message));
    req.end();
  });
}

/**
 * HTTP 服务器（接收 CSP 报告）
 */
const server = http.createServer((req, res) => {
  // CORS 支持
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // 仅接受 POST 请求到 /csp-report
  if (req.method !== 'POST' || req.url !== '/csp-report') {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }
  
  // 读取请求体
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    try {
      const report = JSON.parse(body);
      handleCSPReport(report);
      
      // 返回 204 No Content
      res.writeHead(204);
      res.end();
    } catch (err) {
      console.error('Failed to parse CSP report:', err);
      res.writeHead(400);
      res.end('Bad Request');
    }
  });
});

// 启动服务器
if (require.main === module) {
  server.listen(CONFIG.PORT, () => {
    console.log(`📊 CSP Report Handler running on http://localhost:${CONFIG.PORT}`);
    console.log(`📁 Logs: ${CONFIG.LOG_FILE}`);
    console.log('Press Ctrl+C to stop\n');
  });
}

// 导出函数（供其他模块使用）
module.exports = {
  handleCSPReport,
  shouldAlert,
  sendAlert
};
