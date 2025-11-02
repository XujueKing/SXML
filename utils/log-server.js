/**
 * 日志服务端处理器
 * 接收客户端日志并分类存储
 * @author SXML Security Team
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// 配置
const CONFIG = {
  PORT: 3002,
  LOG_DIR: path.join(__dirname, '../logs'),
  FILES: {
    security: 'security.log',
    audit: 'audit.log',
    performance: 'performance.log',
    error: 'error.log'
  },
  ENABLE_CONSOLE: true,
  ENABLE_ALERT: true,
  ALERT_WEBHOOK: process.env.DINGTALK_WEBHOOK || ''
};

// 确保日志目录存在
Object.values(CONFIG.FILES).forEach(file => {
  const dir = path.dirname(path.join(CONFIG.LOG_DIR, file));
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * 写入日志文件
 */
function writeLog(category, logEntry) {
  const filename = CONFIG.FILES[category] || CONFIG.FILES.error;
  const filepath = path.join(CONFIG.LOG_DIR, filename);
  const logLine = JSON.stringify(logEntry) + '\n';
  
  fs.appendFile(filepath, logLine, (err) => {
    if (err) {
      console.error(`Failed to write log to ${filename}:`, err);
    }
  });
}

/**
 * 处理日志批次
 */
function processLogs(logs) {
  logs.forEach(logEntry => {
    const { category, level, eventType } = logEntry;
    
    // 分类存储
    writeLog(category, logEntry);
    
    // 控制台输出
    if (CONFIG.ENABLE_CONSOLE) {
      console.log(`[${level}] [${category}] ${eventType}`, logEntry);
    }
    
    // 高危事件告警
    if (CONFIG.ENABLE_ALERT && shouldAlert(logEntry)) {
      sendAlert(logEntry);
    }
  });
}

/**
 * 判断是否需要告警
 */
function shouldAlert(logEntry) {
  const alertEvents = [
    'BRUTE_FORCE_ATTEMPT',
    'UNAUTHORIZED_ACCESS',
    'XSS_ATTEMPT',
    'CSRF_ATTEMPT',
    'SUSPICIOUS_ACTIVITY'
  ];
  
  return alertEvents.includes(logEntry.eventType) || 
         logEntry.level === 'CRITICAL' ||
         logEntry.level === 'ERROR';
}

/**
 * 发送钉钉告警
 */
async function sendAlert(logEntry) {
  if (!CONFIG.ALERT_WEBHOOK) {
    console.warn('Alert webhook not configured');
    return;
  }
  
  const message = {
    msgtype: 'markdown',
    markdown: {
      title: `🚨 安全告警: ${logEntry.eventType}`,
      text: [
        `### ${logEntry.eventType}`,
        `**级别**: ${logEntry.level}`,
        `**时间**: ${logEntry.timestamp}`,
        `**用户**: ${logEntry.userAccount}`,
        `**页面**: ${logEntry.pageUrl}`,
        `**详情**: ${JSON.stringify(logEntry, null, 2)}`
      ].join('\n\n')
    }
  };
  
  try {
    const https = require('https');
    const url = new URL(CONFIG.ALERT_WEBHOOK);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      console.log(`Alert sent, status: ${res.statusCode}`);
    });
    
    req.on('error', (error) => {
      console.error('Failed to send alert:', error);
    });
    
    req.write(JSON.stringify(message));
    req.end();
  } catch (error) {
    console.error('Alert sending error:', error);
  }
}

/**
 * HTTP 服务器
 */
const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.method === 'POST' && req.url === '/api/logs') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const { logs } = JSON.parse(body);
        
        if (!Array.isArray(logs)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid logs format' }));
          return;
        }
        
        processLogs(logs);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: true, 
          received: logs.length 
        }));
      } catch (error) {
        console.error('Error processing logs:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(CONFIG.PORT, () => {
  console.log(`✅ Log server running on http://localhost:${CONFIG.PORT}`);
  console.log(`📁 Logs directory: ${CONFIG.LOG_DIR}`);
  console.log(`🔔 Alerts: ${CONFIG.ENABLE_ALERT ? 'Enabled' : 'Disabled'}`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n⏹️  Shutting down log server...');
  server.close(() => {
    console.log('✅ Log server stopped');
    process.exit(0);
  });
});

module.exports = { processLogs, writeLog };
