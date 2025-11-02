/**
 * CSP 邮件告警快速开始示例
 * 
 * 使用场景: 生产环境 CSP 违规实时监控和邮件通知
 */

// ==================== 快速配置 ====================

/**
 * 步骤 1: 安装依赖
 * 
 * npm install nodemailer
 */

/**
 * 步骤 2: 配置邮件服务器
 * 
 * 编辑 config/app.config.json:
 */
const exampleConfig = {
  "alert": {
    "email": {
      "enabled": true,
      "smtp": {
        "host": "smtp.gmail.com",           // Gmail SMTP
        "port": 465,
        "secure": true,
        "auth": {
          "user": "alerts@example.com",     // 发件邮箱
          "pass": "your-app-password"       // 应用专用密码
        }
      },
      "from": "Security Alerts <alerts@example.com>",
      "to": [
        "admin@example.com",                 // 主要收件人
        "security@example.com"               // 安全团队
      ],
      "subject": "[Security Alert] {{event_type}}",
      "rateLimit": {
        "maxPerHour": 10,                   // 每小时最多 10 封
        "cooldownMinutes": 5                // 同类告警间隔 5 分钟
      }
    },
    "dingtalk": {
      "enabled": true,
      "webhook": "https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN"
    }
  }
};

/**
 * 步骤 3: 启动 CSP 监控服务
 * 
 * npm run csp:monitor
 * 
 * 或直接运行:
 * node utils/csp-report-handler.js
 */

// ==================== 使用环境变量 (推荐) ====================

/**
 * Windows PowerShell:
 * 
 * $env:SMTP_HOST="smtp.gmail.com"
 * $env:SMTP_PORT="465"
 * $env:SMTP_USER="alerts@example.com"
 * $env:SMTP_PASS="your-app-password"
 * $env:ALERT_EMAILS="admin@example.com,security@example.com"
 * 
 * npm run csp:monitor
 */

/**
 * Linux/Mac Bash:
 * 
 * export SMTP_HOST="smtp.gmail.com"
 * export SMTP_PORT="465"
 * export SMTP_USER="alerts@example.com"
 * export SMTP_PASS="your-app-password"
 * export ALERT_EMAILS="admin@example.com,security@example.com"
 * 
 * npm run csp:monitor
 */

// ==================== 常用邮箱配置 ====================

/**
 * Gmail 配置
 */
const gmailConfig = {
  smtp: {
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "your-email@gmail.com",
      pass: "your-app-password"  // 从 https://myaccount.google.com/apppasswords 生成
    }
  }
};

/**
 * QQ 邮箱配置
 */
const qqMailConfig = {
  smtp: {
    host: "smtp.qq.com",
    port: 465,
    secure: true,
    auth: {
      user: "123456789@qq.com",
      pass: "authorization-code"  // QQ邮箱设置中生成的授权码
    }
  }
};

/**
 * 163 邮箱配置
 */
const mail163Config = {
  smtp: {
    host: "smtp.163.com",
    port: 465,
    secure: true,
    auth: {
      user: "yourname@163.com",
      pass: "authorization-code"  // 163邮箱设置中生成的授权码
    }
  }
};

/**
 * 腾讯企业邮箱配置
 */
const tencentEnterpriseConfig = {
  smtp: {
    host: "smtp.exmail.qq.com",
    port: 465,
    secure: true,
    auth: {
      user: "alerts@yourcompany.com",
      pass: "your-password"
    }
  }
};

// ==================== 测试告警 ====================

/**
 * 方法 1: 浏览器触发 CSP 违规
 * 
 * 在浏览器控制台执行:
 */
const testCSPViolation = () => {
  const script = document.createElement('script');
  script.src = 'https://evil.com/test.js';
  document.head.appendChild(script);
  // 这将触发 CSP 违规，自动发送告警邮件
};

/**
 * 方法 2: Node.js 手动测试
 * 
 * 创建 test-alert.js:
 */
const testNodeAlert = `
const { sendAlert } = require('./utils/csp-report-handler.js');

const testViolation = {
  timestamp: new Date().toISOString(),
  documentUri: 'https://example.com/test',
  violatedDirective: 'script-src',
  effectiveDirective: 'script-src',
  blockedUri: 'https://evil.com/malicious.js',
  sourceFile: 'https://example.com/test.html',
  lineNumber: 42,
  columnNumber: 10,
  statusCode: 200,
  userAgent: 'Mozilla/5.0 (Test)'
};

sendAlert(testViolation)
  .then(() => console.log('✅ 测试邮件已发送'))
  .catch(err => console.error('❌ 发送失败:', err));
`;

/**
 * 运行测试:
 * 
 * node test-alert.js
 */

// ==================== 邮件内容示例 ====================

/**
 * 收到的告警邮件内容:
 * 
 * 主题: [Security Alert] CSP Violation
 * 
 * 内容:
 * 🚨 CSP 安全违规告警
 * 
 * 严重程度: HIGH
 * 告警时间: 2025-11-02 14:30:25
 * 违规页面: https://example.com/admin
 * 
 * 违规详情:
 * - 违反策略: script-src 'self'
 * - 被阻止资源: https://evil.com/malicious.js
 * - 源文件: https://example.com/admin/index.html:45:12
 * 
 * 可能的原因:
 * 1. XSS 攻击尝试 - 恶意脚本注入
 * 2. 第三方资源加载 - 未授权的外部资源
 * 3. 代码注入 - 内联脚本或样式违规
 * 
 * 建议措施:
 * 1. 检查违规页面的源代码
 * 2. 验证被阻止的资源是否合法
 * 3. 检查输入验证逻辑
 * 4. 查看完整日志: logs/csp-violations.log
 */

// ==================== 多渠道告警 ====================

/**
 * 同时启用邮件 + 钉钉告警
 */
const multiChannelConfig = {
  alert: {
    // 邮件告警
    email: {
      enabled: true,
      smtp: {
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: "alerts@example.com",
          pass: "your-app-password"
        }
      },
      to: ["admin@example.com"]
    },
    
    // 钉钉告警
    dingtalk: {
      enabled: true,
      webhook: "https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN",
      secret: "YOUR_SECRET"  // 可选，用于签名验证
    },
    
    // Slack 告警
    slack: {
      enabled: true,
      webhook: "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
    }
  }
};

// ==================== 频率限制示例 ====================

/**
 * 场景: 防止邮件轰炸
 * 
 * 配置:
 */
const rateLimitExample = {
  rateLimit: {
    maxPerHour: 10,        // 每小时最多 10 封告警邮件
    cooldownMinutes: 5     // 同类告警间隔 5 分钟
  }
};

/**
 * 行为:
 * 
 * 1. 第一次违规: 立即发送邮件 ✅
 * 2. 3分钟后同类违规: 跳过 (冷却期内) ⏰
 * 3. 6分钟后同类违规: 发送邮件 ✅
 * 4. 连续触发10次: 第11次被限流 (达到每小时上限) 🚫
 * 
 * 日志输出:
 * ⏰ Alert rate limited, skipping
 */

// ==================== 故障排查 ====================

/**
 * 常见问题及解决方案
 */
const troubleshooting = {
  // 问题 1: 邮件发送失败
  authenticationFailed: {
    错误: "❌ Failed to send email: Authentication failed",
    解决方案: [
      "1. 检查 SMTP 用户名和密码是否正确",
      "2. Gmail 需要使用应用专用密码,而非账户密码",
      "3. QQ/163 需要在邮箱设置中生成授权码",
      "4. 确认 SMTP 服务已启用"
    ]
  },
  
  // 问题 2: 收不到邮件
  noEmailReceived: {
    检查清单: [
      "✓ 检查垃圾邮件文件夹",
      "✓ 确认收件人地址拼写正确",
      "✓ 查看服务端日志是否有发送成功记录",
      "✓ 确认 SMTP 服务器无发送限额"
    ]
  },
  
  // 问题 3: 环境变量未生效
  envNotWorking: {
    检查命令: {
      Windows: "echo $env:SMTP_USER",
      Linux: "echo $SMTP_USER"
    },
    解决方案: "确保在启动服务前设置环境变量"
  }
};

// ==================== 生产环境部署 ====================

/**
 * 使用 PM2 部署
 */
const pm2Deployment = `
# 安装 PM2
npm install -g pm2

# 启动 CSP 监控
pm2 start utils/csp-report-handler.js --name csp-monitor

# 设置开机自启
pm2 startup
pm2 save

# 查看日志
pm2 logs csp-monitor

# 重启服务
pm2 restart csp-monitor
`;

/**
 * Docker 部署
 */
const dockerDeployment = `
# Dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .

# 环境变量
ENV SMTP_HOST=smtp.gmail.com
ENV SMTP_PORT=465
ENV SMTP_USER=alerts@example.com
ENV SMTP_PASS=your-app-password
ENV ALERT_EMAILS=admin@example.com

EXPOSE 3001
CMD ["node", "utils/csp-report-handler.js"]

# 构建和运行
docker build -t csp-monitor .
docker run -d -p 3001:3001 --name csp-monitor csp-monitor
`;

// ==================== 监控和统计 ====================

/**
 * 查看告警统计
 */
const monitoring = `
# 查看今天的 CSP 违规次数
grep $(date +%Y-%m-%d) logs/csp-violations.log | wc -l

# 查看最常见的违规类型
cat logs/csp-violations.log | jq -r '.violatedDirective' | sort | uniq -c | sort -rn

# 查看被阻止最多的资源
cat logs/csp-violations.log | jq -r '.blockedUri' | sort | uniq -c | sort -rn

# 实时监控新违规
tail -f logs/csp-violations.log | jq
`;

// ==================== 完成! ====================

console.log(`
✅ CSP 邮件告警配置完成!

下一步:
1. 安装依赖: npm install nodemailer
2. 配置邮箱: 编辑 config/app.config.json
3. 启动服务: npm run csp:monitor
4. 测试告警: 在浏览器触发 CSP 违规
5. 查看邮件: 检查收件箱

详细文档: docs/EMAIL_ALERT_GUIDE.md
`);

module.exports = {
  exampleConfig,
  gmailConfig,
  qqMailConfig,
  mail163Config,
  tencentEnterpriseConfig,
  multiChannelConfig,
  rateLimitExample
};
