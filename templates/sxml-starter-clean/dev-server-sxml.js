/**
 * 开发服务器 - 支持 SXML 热编译 + API 代理
 * 运行: node dev-server-sxml.js [dev|test|prod]
 * 访问: http://localhost:3000
 */

// 全局错误处理，防止进程意外退出
process.on('uncaughtException', (err) => {
  console.error('❌ 未捕获的异常:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的 Promise 拒绝:', reason);
});

const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');
const SXMLCompiler = require('./utils/sxml.compiler.js');

const PORT = 3000;
// 解析环境参数（命令行参数优先，其次 NODE_ENV，默认 development）
const ENV = (process.argv[2] || process.env.NODE_ENV || 'development').toLowerCase();
const compiler = new SXMLCompiler(ENV);

// 读取 API 目标地址
function loadApiTargetByEnv(env) {
  try {
    const envRaw = String(env || '').toLowerCase();
    const candidates = [];
    if (envRaw === 'dev' || envRaw === 'development') {
      candidates.push(path.join(__dirname, 'config', 'app.config.dev.js'));
    } else if (envRaw === 'test') {
      candidates.push(path.join(__dirname, 'config', 'app.config.test.js'));
    } else if (envRaw === 'prod') {
      candidates.push(path.join(__dirname, 'config', 'app.config.prod.js'));
    } else if (envRaw === 'production') {
      candidates.push(path.join(__dirname, 'config', 'app.config.js'));
    } else {
      // 未知环境优先 dev，再默认
      candidates.push(path.join(__dirname, 'config', 'app.config.dev.js'));
    }
    // 默认候选最后兜底
    candidates.push(path.join(__dirname, 'config', 'app.config.js'));

    for (const p of candidates) {
      if (fs.existsSync(p)) {
        const cfg = require(p);
        if (cfg && cfg.api && cfg.api.baseUrl) return cfg.api.baseUrl;
      }
    }
  } catch (e) {
    console.warn('⚠️  无法从配置读取 API 目标:', e.message);
  }
  return process.env.API_TARGET || 'https://api.example.com';
}

const API_TARGET = loadApiTargetByEnv(ENV);

// MIME 类型映射
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// 创建服务器
const server = http.createServer((req, res) => {
  console.log(`📥 ${req.method} ${req.url}`);

  // 解析 URL，移除查询参数
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let filePath = '.' + url.pathname;

  // API 代理路由
  if (url.pathname.startsWith('/supper-interface') || url.pathname.startsWith('/scanlogin')) {
    return proxyRequest(req, res, url);
  }
  
  // 默认首页：优先 index，如不存在则回退 login
  if (filePath === './' || filePath === '.') {
    const indexCandidate = path.join('.', 'pages', 'index', 'index.html');
    const loginFallback = path.join('.', 'pages', 'login', 'login.html');
    filePath = fs.existsSync(indexCandidate) ? indexCandidate : loginFallback;
  }

  // 获取文件扩展名
  const extname = path.extname(filePath);
  const contentType = MIME_TYPES[extname] || 'text/plain';

  // 忽略无效的资源请求（空文件名）
  if (filePath === './' || filePath === '.' || path.basename(filePath) === '') {
    filePath = './pages/login/login.html';
  }

  // 处理 HTML 文件 - 实时编译
  if (extname === '.html' && filePath.includes('/pages/')) {
    handleHtmlRequest(filePath, res, url);
  } else {
    // 其他文件直接返回
    fs.readFile(filePath, (err, content) => {
      if (err) {
        if (err.code === 'ENOENT') {
          // 静默处理无效的资源请求（.json, .sxml等）
          const basename = path.basename(filePath);
          if (basename.startsWith('.')) {
            console.log(`⚠️  忽略无效请求: ${filePath}`);
            res.writeHead(204); // No Content
            res.end();
          } else {
            console.log(`❌ 404: ${filePath}`);
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <head><title>404 Not Found</title></head>
                <body>
                  <h1>404 - File Not Found</h1>
                  <p>请求的文件不存在: ${url.pathname}</p>
                </body>
              </html>
            `);
          }
        } else {
          res.writeHead(500);
          res.end(`Server Error: ${err.code}`);
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });
  }
});

/**
 * 处理 HTML 请求 - 实时编译 SXML
 */
function handleHtmlRequest(filePath, res, url) {
  try {
    // 优先查找 .sxml 文件，其次是 .html 文件
    const basePath = filePath.replace('.html', '');
    const sxmlPath = basePath + '.sxml';
    const htmlPath = basePath + '.html';
    
    let templatePath = null;
    let templateContent = null;
    
    // 优先使用 .sxml 文件
    if (fs.existsSync(sxmlPath)) {
      templatePath = sxmlPath;
      templateContent = fs.readFileSync(sxmlPath, 'utf-8');
      console.log(`📄 使用 SXML 模板: ${path.basename(sxmlPath)}`);
    } else if (fs.existsSync(htmlPath)) {
      templatePath = htmlPath;
      templateContent = fs.readFileSync(htmlPath, 'utf-8');
      console.log(`📄 使用 HTML 模板: ${path.basename(htmlPath)}`);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 - 模板文件不存在</h1>');
      return;
    }
    
    // 获取对应的 JS 文件
    const jsPath = basePath + '.js';
    const jsonPath = basePath + '.json';
    const cssPath = basePath + '.css';
    
    // 设置页面名称和CSS文件存在标志
    compiler.pageName = path.basename(basePath);
    compiler.hasPageCss = fs.existsSync(cssPath);
    
    if (fs.existsSync(jsPath)) {
      const jsContent = fs.readFileSync(jsPath, 'utf-8');
      
      // 读取 JSON 配置
      let pageConfig = {};
      if (fs.existsSync(jsonPath)) {
        try {
          pageConfig = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        } catch (e) {
          console.warn('⚠️  JSON 配置解析失败');
        }
      }
      compiler.pageConfig = pageConfig;
      
      // 分析页面依赖（智能检测使用的工具库,包括预加载语言包）
      compiler.pageDependencies = compiler.analyzeDependencies(templateContent, jsContent);
      console.log(`📊 检测到依赖: ${compiler.pageDependencies.join(', ')}`);
      
      // 提取初始数据
      const initialData = compiler.extractPageData(jsContent);
      
  // 编译模板（编译器会按 ENV 注入 APP_CONFIG_URL）
  let compiledHtml = compiler.compileTemplate(templateContent, initialData);

  // 开发工具与可选测试注入
  const testParam = url && url.searchParams ? url.searchParams.get('test') : null;
  compiledHtml = addDevTools(compiledHtml, { test: testParam });
      
      console.log('✅ SXML 实时编译完成');
      
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(compiledHtml);
    } else {
      // 如果没有 JS 文件，直接返回模板内容
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(templateContent);
    }
  } catch (err) {
    console.error('❌ 编译错误:', err);
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end(`
      <h1>SXML 编译错误</h1>
      <pre>${err.stack}</pre>
    `);
  }
}

/**
 * 添加开发工具（热重载等）
 */
function addDevTools(html, options = {}) {
  const { test } = options;

  const devScript = `
    <!-- 开发模式标记 -->
    <script nonce="${compiler.nonce}">
      console.log('🔧 开发模式 - SXML 已预编译 (${ENV.toUpperCase()})');
    </script>
  `;

  let testScript = '';
  if (test === 'login') {
    testScript = `
    <!-- Login 自动化测试（开发模式） -->
    <script nonce="${compiler.nonce}">
      (function(){
        const OVERLAY_ID = 'dev-test-overlay';
        function showOverlay(results){
          if (document.getElementById(OVERLAY_ID)) return;
          const wrap = document.createElement('div');
          wrap.id = OVERLAY_ID;
          wrap.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:99999;background:rgba(0,0,0,.75);color:#fff;padding:12px 14px;border-radius:8px;max-width:360px;font:12px/1.5 sans-serif;box-shadow:0 6px 16px rgba(0,0,0,.3);';
          const ok = results.filter(r=>r.pass).length;
          const total = results.length;
          wrap.innerHTML = '<div style="font-weight:bold;margin-bottom:6px;">Login 测试结果 ' + ok + '/' + total + '</div>' +
            '<ul style="margin:0;padding-left:18px;">' + results.map(r => '<li style="margin:2px 0;">' + (r.pass?'✅':'❌') + ' ' + r.name + (r.msg? ' - ' + r.msg : '') + '</li>').join('') + '</ul>' +
            '<div style="margin-top:8px;opacity:.8;">仅开发模式展示</div>';
          document.body.appendChild(wrap);
        }

        function delay(ms){ return new Promise(r=>setTimeout(r, ms)); }

        function setupToastCapture(){
          if (!window._toasts) window._toasts = [];
          const orig = window.ShowToast;
          window.ShowToast = function(msg){
            try { window._toasts.push(String(msg||'')); } catch(e) {}
            if (typeof orig === 'function') try { return orig.apply(this, arguments); } catch(e) {}
          };
        }

        function lastToastIncludes(substr){
          if (!window._toasts || window._toasts.length===0) return false;
          const t = window._toasts[window._toasts.length-1]||'';
          return t.toLowerCase().indexOf(substr.toLowerCase()) !== -1;
        }

        function setInputValue(id, val){
          const el = document.getElementById(id);
          if (el) { el.value = val; el.dispatchEvent(new Event('input', {bubbles:true})); }
          return el;
        }

        function clickById(id){ const el = document.getElementById(id); if (el) el.click(); return el; }

        function keydownEnter(id){ const el = document.getElementById(id); if (!el) return; const evt = new KeyboardEvent('keydown', {key:'Enter', keyCode:13, which:13, bubbles:true}); el.dispatchEvent(evt); }

        function ensureCurrentPage(){ return !!(window.currentPage && typeof window.currentPage.loginEvent==='function'); }

        document.addEventListener('pageResourcesLoaded', async function(){
          try{
            const results = [];
            setupToastCapture();

            // 0) 基础检查
            results.push({ name:'Page 方法挂载', pass: ensureCurrentPage(), msg: ensureCurrentPage()? '' : 'currentPage.loginEvent 不存在' });

            // 1) 空输入点击登录 -> 提示手机号
            setInputValue('u',''); setInputValue('p',''); setInputValue('k','');
            window._toasts = [];
            clickById('but');
            await delay(50);
            results.push({ name:'空输入提示手机号', pass: lastToastIncludes('phone number'), msg: window._toasts && window._toasts[0] });

            // 2) 回车触发密码必填
            setInputValue('u','13800000000'); setInputValue('p','');
            window._toasts = [];
            keydownEnter('p');
            await delay(50);
            results.push({ name:'回车提示密码', pass: lastToastIncludes('password'), msg: window._toasts && window._toasts[0] });

            // 3) 密钥长度校验（32字节）
            setInputValue('u','13800000000'); setInputValue('p','abcdef'); setInputValue('k','1234567890');
            window._toasts = [];
            clickById('but');
            await delay(50);
            results.push({ name:'密钥长度提示', pass: (lastToastIncludes('32') || lastToastIncludes('key')), msg: window._toasts && window._toasts[0] });

            showOverlay(results);
          }catch(e){ console.warn('Dev test error', e); }
        });
      })();
    </script>`;
  }

  const bundle = devScript + (testScript ? ('\n' + testScript) : '');
  return html.replace('</body>', `${bundle}\n</body>`);
}

/**
 * 简易反向代理：将请求转发到 API_TARGET
 */
function proxyRequest(clientReq, clientRes, url) {
  try {
    const targetBase = new URL(API_TARGET);
    const targetUrl = new URL(url.pathname + url.search, targetBase);

    const isHttps = targetUrl.protocol === 'https:';
    const lib = isHttps ? https : http;

    // 复制并调整请求头
    const headers = { ...clientReq.headers, host: targetUrl.host };

    const options = {
      protocol: targetUrl.protocol,
      hostname: targetUrl.hostname,
      port: targetUrl.port || (isHttps ? 443 : 80),
      method: clientReq.method,
      path: targetUrl.pathname + targetUrl.search,
      headers,
    };

    // 可选：允许不安全证书（仅在 NODE_TLS_REJECT_UNAUTHORIZED=0 时）
    if (isHttps && process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
      options.rejectUnauthorized = false;
    }

    const proxy = lib.request(options, (proxyRes) => {
      // 转发响应头与状态码
      const resHeaders = { ...proxyRes.headers };
      clientRes.writeHead(proxyRes.statusCode || 502, resHeaders);
      proxyRes.pipe(clientRes, { end: true });
    });

    proxy.on('error', (err) => {
      console.error('❌ 代理错误:', err.message);
      clientRes.writeHead(502, { 'Content-Type': 'application/json' });
      clientRes.end(JSON.stringify({ code: 502, message: 'Bad Gateway', error: err.message }));
    });

    // 将客户端请求体转发给目标
    clientReq.pipe(proxy, { end: true });
  } catch (e) {
    console.error('❌ 代理异常:', e);
    clientRes.writeHead(500, { 'Content-Type': 'application/json' });
    clientRes.end(JSON.stringify({ code: 500, message: 'Proxy Error', error: String(e && e.message || e) }));
  }
}

// 启动服务器
server.listen(PORT, () => {
  console.log('═══════════════════════════════════════');
  console.log('  🚀 SXML 开发服务器已启动（含 API 代理）');
  console.log('═══════════════════════════════════════');
  console.log(`  本地地址: http://localhost:${PORT}`);
  console.log(`  网络地址: http://192.168.x.x:${PORT}`);
  console.log(`  环境: ${ENV.toUpperCase()}`);
  console.log(`  API 代理: ${API_TARGET}`);
  console.log('═══════════════════════════════════════');
  console.log('  功能特性:');
  console.log('  ✅ SXML 实时编译');
  console.log('  ✅ API 反向代理 (/supper-interface, /scanlogin)');
  console.log('  ✅ 零延迟渲染');
  console.log('  ✅ 源码无模板标签');
  console.log('═══════════════════════════════════════\n');
});

// 监听服务器错误
server.on('error', (err) => {
  console.error('❌ 服务器错误:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`端口 ${PORT} 已被占用，请关闭占用该端口的程序后重试`);
    process.exit(1);
  }
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n\n🛑 正在关闭服务器...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});
