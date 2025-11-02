#!/usr/bin/env node
/**
 * 导出“干净模板”：不包含 login、images、locales 等业务/资源，仅保留最小可运行骨架。
 * 用法：
 *   node scripts/export-clean-template.js <targetDir>
 * 说明：
 *   - 复制 utils、css/element.css、pages/index、构建/开发脚本；
 *   - 生成精简版 config/app.config.json（不含告警等敏感/个性化配置）；
 *   - 不复制 images/ 与 locales/；
 */

const fs = require('fs');
const path = require('path');

function ensureDir(dir){ if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }
function copyDir(src, dest){
  if (!fs.existsSync(src)) return;
  ensureDir(dest);
  for (const name of fs.readdirSync(src)){
    const s = path.join(src, name);
    const d = path.join(dest, name);
    const stat = fs.statSync(s);
    if (stat.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}

function writeJSON(file, obj){ ensureDir(path.dirname(file)); fs.writeFileSync(file, JSON.stringify(obj, null, 2)); }
function write(file, content){ ensureDir(path.dirname(file)); fs.writeFileSync(file, content); }

function generateLeanI18n(destRoot){
  const leanI18nPath = path.join(destRoot, 'utils', 'i18n.js');
  const leanI18n = [
    '(function () {',
    "  'use strict';",
    '',
    '  function get(obj, path, fallback) {',
    '    if (!obj || !path) return fallback;',
    "    const parts = String(path).split('.');",
    '    let cur = obj;',
    '    for (const p of parts) {',
    '      if (cur && Object.prototype.hasOwnProperty.call(cur, p)) {',
    '        cur = cur[p];',
    '      } else {',
    '        return fallback;',
    '      }',
    '    }',
    '    return cur == null ? fallback : cur;',
    '  }',
    '',
    '  function detectLang() {',
    "    const saved = localStorage.getItem('lang');",
    '    if (saved) return saved;',
    "    const nav = (navigator.language || navigator.userLanguage || 'en-US');",
    '    if (/^zh/i.test(nav)) return "zh-CN";',
    '    return "en-US";',
    '  }',
    '',
    '  const i18n = {',
    '    lang: detectLang(),',
    '    dict: {},',
    '',
    '    async load(lang) {',
    '      this.lang = lang || this.lang;',
    '',
    '      const jsPackKey = "LOCALE_" + this.lang.replace("-", "_");',
    '      if (window[jsPackKey]) {',
    '        this.dict = window[jsPackKey];',
    '        this.replacePlaceholders();',
    "        console && console.log && console.log('[i18n]', 'using pre-loaded JS pack:', jsPackKey);",
    '        return this.dict;',
    '      }',
    '',
    "      const jsUrl = '../../locales/' + this.lang + '.js';",
    '      try {',
    '        await this.loadScript(jsUrl);',
    '        if (window[jsPackKey]) {',
    '          this.dict = window[jsPackKey];',
    '          this.replacePlaceholders();',
    "          console && console.log && console.log('[i18n]', 'loaded JS pack from:', jsUrl);",
    '          return this.dict;',
    '        }',
    '      } catch (e) {',
    "        console && console.warn && console.warn('[i18n]', 'failed to load JS pack:', jsUrl, e);",
    '      }',
    '',
    "      const isFile = location.protocol === 'file:';",
    '      const candidates = [',
    "        '../../locales/' + this.lang + '.json',",
    "        '../locales/' + this.lang + '.json',",
    "        './locales/' + this.lang + '.json',",
    "        '/locales/' + this.lang + '.json'",
    '      ];',
    '',
    '      if (!isFile) {',
    '        const controller = (typeof AbortController !== "undefined") ? new AbortController() : null;',
    '        const signal = controller ? controller.signal : undefined;',
    '        const timeout = new Promise((resolve) => setTimeout(() => resolve({ timeout: true }), 600));',
    '',
    '        const fetchers = candidates.map(function(url){',
    '          return fetch(url, { cache: "no-store", signal })',
    "            .then(function(res){ return res.ok ? res.json().then(function(json){ return { ok: true, url: url, json: json }; }) : Promise.reject(new Error(res.statusText)); })",
    "            .catch(function(){ return { ok: false, url: url }; });",
    '        });',
    '',
    '        try {',
    '          const results = await Promise.race([',
    '            Promise.all(fetchers).then(function(list){ return list.find(function(x){ return x && x.ok; }); }),',
    '            timeout',
    '          ]);',
    '',
    '          if (results && results.ok) {',
    '            this.dict = results.json;',
    '            this.replacePlaceholders();',
    "            console && console.log && console.log('[i18n]', 'loaded locale from', results.url);",
    '            if (controller) controller.abort();',
    '            return this.dict;',
    '          }',
    '        } catch (e) {',
    '          // ignore and fallback',
    '        }',
    '        if (controller) controller.abort();',
    '      }',
    '',
    '      // no embedded fallback by design',
    '      this.dict = {};',
    '      this.replacePlaceholders();',
    "      console && console.warn && console.warn('[i18n]', 'no locale loaded for', this.lang);",
    '      return this.dict;',
    '    },',
    '',
    '    replacePlaceholders() {',
    '      if (!window.APP_CONFIG || !window.APP_CONFIG.app) {',
    '        return;',
    '      }',
    '',
    '      const appName = window.APP_CONFIG.app.name || "Your App";',
    '      const appTitle = window.APP_CONFIG.app.title || "Your App Title";',
    '      const appSubtitle = window.APP_CONFIG.app.subtitle || "Management System";',
    '',
    '      const replaceIn = (obj) => {',
    '        if (typeof obj === "string") {',
    '          return obj',
    "            .replace(/\{\{APP_NAME\}\}/g, appName)",
    "            .replace(/\{\{APP_TITLE\}\}/g, appTitle)",
    "            .replace(/\{\{APP_SUBTITLE\}\}/g, appSubtitle);",
    '        } else if (Array.isArray(obj)) {',
    '          return obj.map(replaceIn);',
    '        } else if (obj && typeof obj === "object") {',
    '          const newObj = {};',
    '          for (const k in obj) {',
    '            newObj[k] = replaceIn(obj[k]);',
    '          }',
    '          return newObj;',
    '        }',
    '        return obj;',
    '      };',
    '',
    '      this.dict = replaceIn(this.dict);',
    '    },',
    '',
    '    loadScript(src) {',
    '      return new Promise(function(resolve, reject){',
  '        const existing = document.querySelector("script[src=\'" + src + "\']");',
    '        if (existing) {',
    '          setTimeout(resolve, 10);',
    '          return;',
    '        }',
    '        const script = document.createElement("script");',
    '        script.src = src;',
    '        script.onload = function(){ resolve(); };',
    '        script.onerror = function(){ reject(new Error("Failed to load "+ src)); };',
    '        document.head.appendChild(script);',
    '      });',
    '    },',
    '',
    '    t(key, fallback) {',
    "      return get(this.dict, key, (fallback != null ? fallback : key));",
    '    },',
    '',
    '    apply(root) {',
    '      const scope = root || document;',
    '',
    "      scope.querySelectorAll('[data-i18n]').forEach((el) => {",
    "        const key = el.getAttribute('data-i18n');",
    '        const val = this.t(key, el.textContent);',
    '        if (el.hasAttribute("data-i18n-html")) {',
    '          el.innerHTML = val;',
    '        } else {',
    '          el.textContent = val;',
    '        }',
    '      });',
    '',
    "      scope.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {",
    "        const key = el.getAttribute('data-i18n-placeholder');",
    "        el.setAttribute('placeholder', this.t(key, el.getAttribute('placeholder')));",
    '      });',
    '',
    "      scope.querySelectorAll('[data-i18n-title]').forEach((el) => {",
    "        const key = el.getAttribute('data-i18n-title');",
    "        el.setAttribute('title', this.t(key, el.getAttribute('title')));",
    '      });',
    '',
    "      scope.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {",
    "        const key = el.getAttribute('data-i18n-aria-label');",
    "        el.setAttribute('aria-label', this.t(key, el.getAttribute('aria-label')));",
    '      });',
    '',
    "      const titleKey = document.documentElement.getAttribute('data-i18n-title-key');",
    '      if (titleKey) {',
    '        document.title = this.t(titleKey, document.title);',
    '      }',
    '',
    '      const sel = document.getElementById("langSelect");',
    '      if (sel && sel.value !== this.lang) sel.value = this.lang;',
    '',
    "      document.documentElement.setAttribute('lang', this.lang);",
    '    },',
    '',
    '    async setLang(lang) {',
    '      if (!lang) return;',
    '      this.lang = lang;',
    "      localStorage.setItem('lang', this.lang);",
    '      await this.load(this.lang);',
    '      this.apply();',
    '    }',
    '  };',
    '',
    '  window.i18n = i18n;',
    '',
    "  document.addEventListener('DOMContentLoaded', async () => {",
    '    try {',
    '      await i18n.load(i18n.lang);',
    '      i18n.apply();',
    '      try {',
    "        document.documentElement.classList.add('i18n-ready');",
    "        const evt = new Event('i18n:ready');",
    '        window.dispatchEvent(evt);',
    '      } catch (_) { }',
    '    } catch (e) {',
    "      console && console.warn && console.warn('i18n init failed:', e);",
    '      try {',
    "        document.documentElement.classList.add('i18n-ready');",
    "        const evt = new Event('i18n:ready');",
    '        window.dispatchEvent(evt);',
    '      } catch (_) { }',
    '    }',
    '  });',
    '})();'
  ].join('\n');
  write(leanI18nPath, leanI18n);
}

function main(){
  const target = process.argv[2] || path.join('templates', 'sxml-starter-clean');
  const cwd = process.cwd();
  const srcRoot = cwd; // 当前仓库作为来源
  const destRoot = path.resolve(target);

  if (fs.existsSync(destRoot)){
    const notEmpty = fs.readdirSync(destRoot).length > 0;
    if (notEmpty){
      console.error('目标目录已存在且非空：', destRoot);
      process.exit(1);
    }
  }

  console.log('🧰 导出干净模板到: ', destRoot);

  // 1) 复制 utils （随后覆盖 i18n 为精简版）
  copyDir(path.join(srcRoot, 'utils'), path.join(destRoot, 'utils'));
  try { generateLeanI18n(destRoot); } catch (e) { console.warn('写入精简 i18n 失败（忽略）：', e); }

  // 2) css（仅 element.css 如存在）
  ensureDir(path.join(destRoot, 'css'));
  const elemCssSrc = path.join(srcRoot, 'css', 'element.css');
  if (fs.existsSync(elemCssSrc)) fs.copyFileSync(elemCssSrc, path.join(destRoot, 'css', 'element.css'));

  // 3) pages/index 作为首页（不复制 login/myInfo/demo 等）
  copyDir(path.join(srcRoot, 'pages', 'index'), path.join(destRoot, 'pages', 'index'));

  // 3.1) 复制 docs 文档
  copyDir(path.join(srcRoot, 'docs'), path.join(destRoot, 'docs'));

  // 3.2) 复制 scripts（脚手架工具）
  copyDir(path.join(srcRoot, 'scripts'), path.join(destRoot, 'scripts'));

  // 3.3) 复制 app.js（如果存在）
  const appJsSrc = path.join(srcRoot, 'app.js');
  if (fs.existsSync(appJsSrc)) {
    fs.copyFileSync(appJsSrc, path.join(destRoot, 'app.js'));
  }

  // 3.4) 复制 .vscode
  copyDir(path.join(srcRoot, '.vscode'), path.join(destRoot, '.vscode'));

  // 3.5) 复制 examples
  copyDir(path.join(srcRoot, 'examples'), path.join(destRoot, 'examples'));

  // 3.6) 复制 sxml-highlighter
  copyDir(path.join(srcRoot, 'sxml-highlighter'), path.join(destRoot, 'sxml-highlighter'));

  // 3.7) 复制 vscode-extension
  copyDir(path.join(srcRoot, 'vscode-extension'), path.join(destRoot, 'vscode-extension'));

  // 3.8) 复制 nginx.conf（如果存在）
  const nginxSrc = path.join(srcRoot, 'nginx.conf');
  if (fs.existsSync(nginxSrc)) {
    fs.copyFileSync(nginxSrc, path.join(destRoot, 'nginx.conf'));
  }

  // 3.9) 创建空目录（images、locales、logs）
  ensureDir(path.join(destRoot, 'images'));
  ensureDir(path.join(destRoot, 'locales'));
  ensureDir(path.join(destRoot, 'logs'));
  // 写入 .gitkeep 确保空目录被 Git 追踪
  write(path.join(destRoot, 'images', '.gitkeep'), '');
  write(path.join(destRoot, 'locales', '.gitkeep'), '');
  write(path.join(destRoot, 'logs', '.gitkeep'), '');

  // 4) 生成精简 config（不包含 alert/email 等敏感配置）
  const leanConfig = {
    app: {
      name: "Your App Name",
      title: "Your App Management",
      subtitle: "Management System",
      description: "Your app description"
    },
    api: {
      baseUrl: "https://api.example.com",
      cspReportUrl: "/api/csp-report"
    },
    external: {
      ipGeoProvider: "https://ipapi.co",
      ipApiProvider: "https://api.ipify.org"
    },
    security: {
      connectSrc: [
        "https://api.example.com"
      ],
      preconnectHosts: [
        "https://api.example.com"
      ]
    },
    i18n: {
      defaultLocale: "zh-CN",
      supportedLocales: ["zh-CN", "en-US"]
    }
  };
  writeJSON(path.join(destRoot, 'config', 'app.config.json'), leanConfig);
  
  // 4.1) 复制 api-sign-map.js
  const apiSignMapSrc = path.join(srcRoot, 'config', 'api-sign-map.js');
  if (fs.existsSync(apiSignMapSrc)) {
    fs.copyFileSync(apiSignMapSrc, path.join(destRoot, 'config', 'api-sign-map.js'));
  }

  // 5) 复制构建/开发脚本
  for (const f of ['build.js','build.dist.js','dev-server-sxml.js']){
    const s = path.join(srcRoot, f);
    if (fs.existsSync(s)) fs.copyFileSync(s, path.join(destRoot, f));
  }

  // 6) 生成最小 package.json
  const name = path.basename(destRoot).replace(/[^a-zA-Z0-9_-]/g,'-') || 'sxml-starter-clean';
  const pkg = {
    name,
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'node dev-server-sxml.js',
      'dev:dev': 'node dev-server-sxml.js dev',
      'dev:test': 'node dev-server-sxml.js test',
      'dev:prod': 'node dev-server-sxml.js prod',
      build: 'node build.js',
      'build:dev': 'node build.js dev',
      'build:test': 'node build.js test',
      'build:prod': 'node build.js prod',
      'build:dist': 'node build.dist.js',
      'build:dist:dev': 'node build.dist.js dev',
      'build:dist:test': 'node build.dist.js test',
      'build:dist:prod': 'node build.dist.js prod'
    }
  };
  writeJSON(path.join(destRoot, 'package.json'), pkg);

  // 7) .gitignore
  write(path.join(destRoot, '.gitignore'), [
    'node_modules/',
    'dist/',
    'logs/',
    '*.log'
  ].join('\n'));

  // 8) 最小 README
  const readme = `# ${name}\n\n干净版 SXML 起步模板（无 login/images/locales 等业务资源）。\n\n## 使用\n\n\`npm install\` 后：\n\n- 开发：\n  - \`npm run dev\`（默认环境）\n  - \`npm run dev:test\`、\`npm run dev:prod\`\n- 构建：\n  - \`npm run build:dist\`（默认生产环境）\n\n访问 http://localhost:3000/\n`;
  write(path.join(destRoot, 'README.md'), readme);

  console.log('✅ 干净模板导出完成！');
  console.log('目标目录: ', destRoot);
}

main();
