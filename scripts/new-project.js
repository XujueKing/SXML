#!/usr/bin/env node
/**
 * SXML 脚手架：新建空白项目
 * 用法：
 *   node scripts/new-project.js <targetDir>
 * 说明：
 *   - 将在 <targetDir> 生成一个可运行的最小项目骨架；
 *   - 包含 pages/index、utils、config、css、images、构建/开发脚本；
 *   - 不包含 locales 语言包（因项目个性化），请按需自行添加；
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

function main(){
  const target = process.argv[2];
  if (!target){
    console.error('用法: node scripts/new-project.js <targetDir>');
    process.exit(1);
  }
  const cwd = process.cwd();
  const srcRoot = cwd; // 当前仓库作为模板来源
  const destRoot = path.resolve(target);

  if (fs.existsSync(destRoot) && fs.readdirSync(destRoot).length > 0){
    console.error('目标目录非空，请选择一个空目录或新路径：', destRoot);
    process.exit(1);
  }

  console.log('🚀 创建 SXML 空白项目到: ', destRoot);

  // 1) 复制必须目录/文件
  // utils 全量复制（包含运行时与编译脚本依赖）
  copyDir(path.join(srcRoot, 'utils'), path.join(destRoot, 'utils'));
  // 使用精简版 i18n（不含内置语言包，避免将个性化语言打入模板）
  try {
    const leanI18nPath = path.join(destRoot, 'utils', 'i18n.js');
    const leanI18n = [
      '(function () {',
      "  'use strict';",
      '',
      '  function get(obj, path, fallback) {',
      '    if (!obj || !path) return fallback;',
      '    const parts = String(path).split(\'.\');',
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
      '    const saved = localStorage.getItem(\'lang\');',
      '    if (saved) return saved;',
      "    const nav = (navigator.language || navigator.userLanguage || 'en-US');",
      '    if (/^zh/i.test(nav)) return \"zh-CN\";',
      '    return \"en-US\";',
      '  }',
      '',
      '  const i18n = {',
      '    lang: detectLang(),',
      '    dict: {},',
      '',
      '    async load(lang) {',
      '      this.lang = lang || this.lang;',
      '',
      '      const jsPackKey = \"LOCALE_\" + this.lang.replace(\'-\', \"_\");',
      '      if (window[jsPackKey]) {',
      '        this.dict = window[jsPackKey];',
      '        this.replacePlaceholders();',
      '        console && console.log && console.log(\'[i18n]\', \"using pre-loaded JS pack:\", jsPackKey);',
      '        return this.dict;',
      '      }',
      '',
      "      const jsUrl = '../../locales/' + this.lang + '.js';",
      '      try {',
      '        await this.loadScript(jsUrl);',
      '        if (window[jsPackKey]) {',
      '          this.dict = window[jsPackKey];',
      '          this.replacePlaceholders();',
      '          console && console.log && console.log(\'[i18n]\', \"loaded JS pack from:\", jsUrl);',
      '          return this.dict;',
      '        }',
      '      } catch (e) {',
      '        console && console.warn && console.warn(\'[i18n]\', \"failed to load JS pack:\", jsUrl, e);',
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
      '        const controller = (typeof AbortController !== \"undefined\") ? new AbortController() : null;',
      '        const signal = controller ? controller.signal : undefined;',
      '        const timeout = new Promise((resolve) => setTimeout(() => resolve({ timeout: true }), 600));',
      '',
      '        const fetchers = candidates.map(function(url){',
      '          return fetch(url, { cache: \"no-store\", signal })',
      '            .then(function(res){ return res.ok ? res.json().then(function(json){ return { ok: true, url: url, json: json }; }) : Promise.reject(new Error(res.statusText)); })',
      '            .catch(function(){ return { ok: false, url: url }; });',
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
      '            console && console.log && console.log(\'[i18n]\', \"loaded locale from\", results.url);',
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
      '      console && console.warn && console.warn(\'[i18n]\', \"no locale loaded for\", this.lang);',
      '      return this.dict;',
      '    },',
      '',
      '    replacePlaceholders() {',
      '      if (!window.APP_CONFIG || !window.APP_CONFIG.app) {',
      '        return;',
      '      }',
      '',
      '      const appName = window.APP_CONFIG.app.name || \"Your App\";',
      '      const appTitle = window.APP_CONFIG.app.title || \"Your App Title\";',
      '      const appSubtitle = window.APP_CONFIG.app.subtitle || \"Management System\";',
      '',
      '      const replaceIn = (obj) => {',
      '        if (typeof obj === \"string\") {',
      '          return obj',
      '            .replace(/\{\{APP_NAME\}\}/g, appName)',
      '            .replace(/\{\{APP_TITLE\}\}/g, appTitle)',
      '            .replace(/\{\{APP_SUBTITLE\}\}/g, appSubtitle);',
      '        } else if (Array.isArray(obj)) {',
      '          return obj.map(replaceIn);',
      '        } else if (obj && typeof obj === \"object\") {',
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
  "        const existing = document.querySelector('script[src=\"' + src + '\"]');",
      '        if (existing) {',
      '          setTimeout(resolve, 10);',
      '          return;',
      '        }',
      '        const script = document.createElement(\'script\');',
      '        script.src = src;',
      '        script.onload = function(){ resolve(); };',
      '        script.onerror = function(){ reject(new Error(\'Failed to load \'+ src)); };',
      '        document.head.appendChild(script);',
      '      });',
      '    },',
      '',
      '    t(key, fallback) {',
      '      return get(this.dict, key, (fallback != null ? fallback : key));',
      '    },',
      '',
      '    apply(root) {',
      '      const scope = root || document;',
      '',
      '      scope.querySelectorAll(\'[data-i18n]\').forEach((el) => {',
      '        const key = el.getAttribute(\'data-i18n\');',
      '        const val = this.t(key, el.textContent);',
      '        if (el.hasAttribute(\'data-i18n-html\')) {',
      '          el.innerHTML = val;',
      '        } else {',
      '          el.textContent = val;',
      '        }',
      '      });',
      '',
      '      scope.querySelectorAll(\'[data-i18n-placeholder]\').forEach((el) => {',
      '        const key = el.getAttribute(\'data-i18n-placeholder\');',
      '        el.setAttribute(\'placeholder\', this.t(key, el.getAttribute(\'placeholder\')));',
      '      });',
      '',
      '      scope.querySelectorAll(\'[data-i18n-title]\').forEach((el) => {',
      '        const key = el.getAttribute(\'data-i18n-title\');',
      '        el.setAttribute(\'title\', this.t(key, el.getAttribute(\'title\')));',
      '      });',
      '',
      '      scope.querySelectorAll(\'[data-i18n-aria-label]\').forEach((el) => {',
      '        const key = el.getAttribute(\'data-i18n-aria-label\');',
      '        el.setAttribute(\'aria-label\', this.t(key, el.getAttribute(\'aria-label\')));',
      '      });',
      '',
      '      const titleKey = document.documentElement.getAttribute(\'data-i18n-title-key\');',
      '      if (titleKey) {',
      '        document.title = this.t(titleKey, document.title);',
      '      }',
      '',
      '      const sel = document.getElementById(\'langSelect\');',
      '      if (sel && sel.value !== this.lang) sel.value = this.lang;',
      '',
      '      document.documentElement.setAttribute(\'lang\', this.lang);',
      '    },',
      '',
      '    async setLang(lang) {',
      '      if (!lang) return;',
      '      this.lang = lang;',
      '      localStorage.setItem(\'lang\', this.lang);',
      '      await this.load(this.lang);',
      '      this.apply();',
      '    }',
      '  };',
      '',
      '  window.i18n = i18n;',
      '',
      '  document.addEventListener(\'DOMContentLoaded\', async () => {',
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
  } catch (e) {
    console.warn('写入精简版 i18n 失败（忽略并继续）:', e);
  }
  // css（保留 element.css）
  ensureDir(path.join(destRoot, 'css'));
  const elemCssSrc = path.join(srcRoot, 'css', 'element.css');
  if (fs.existsSync(elemCssSrc)) fs.copyFileSync(elemCssSrc, path.join(destRoot, 'css', 'element.css'));
  // images（复制全部，至少包含 logo）
  copyDir(path.join(srcRoot, 'images'), path.join(destRoot, 'images'));
  // locales 不复制（语言包具有强个性化，请在新项目中自行维护）
  // config（复制多环境与签名映射）
  copyDir(path.join(srcRoot, 'config'), path.join(destRoot, 'config'));
  // pages/index（作为首页）
  copyDir(path.join(srcRoot, 'pages', 'index'), path.join(destRoot, 'pages', 'index'));

  // 2) 复制构建/开发脚本
  for (const f of ['build.js','build.dist.js','dev-server-sxml.js']){
    const s = path.join(srcRoot, f);
    if (fs.existsSync(s)) fs.copyFileSync(s, path.join(destRoot, f));
  }

  // 3) 生成 package.json（最小化）
  const name = path.basename(destRoot).replace(/[^a-zA-Z0-9_-]/g,'-') || 'sxml-app';
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

  // 4) 最小 README
  const readme = `# ${name}\n\n基于 SXML 的空白项目。\n\n## 使用\n\n\`npm install\` 后：\n\n- 开发：\n  - \`npm run dev\`（默认环境）\n  - \`npm run dev:test\`、\`npm run dev:prod\`\n- 构建：\n  - \`npm run build:dist\`（默认生产环境）\n\n访问 http://localhost:3000/\n`;
  write(path.join(destRoot, 'README.md'), readme);

  console.log('✅ 项目创建完成！');
  console.log('下一步：');
  console.log(`  1) cd ${destRoot}`);
  console.log('  2) npm install');
  console.log('  3) npm run dev');
}

main();
