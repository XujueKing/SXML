#!/usr/bin/env node
/**
 * SXML 脚手架：新建页面
 * 用法：
 *   node scripts/new-page.js <pageName>
 *   
 * 示例：
 *   node scripts/new-page.js dashboard
 *   node scripts/new-page.js user/profile   # 支持子目录
 */

const fs = require('fs');
const path = require('path');

function toSafeName(name){
  return String(name || '')
    .replace(/\\/g,'/')
    .replace(/[^a-zA-Z0-9_\/\-]/g,'-')
    .replace(/\/{2,}/g,'/')
    .replace(/^-+|-+$/g,'')
    .trim();
}

function ensureDir(dir){
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function fileExists(fp){
  try { return fs.existsSync(fp); } catch(_) { return false; }
}

function writeIfAbsent(fp, content){
  if (fileExists(fp)) return false;
  ensureDir(path.dirname(fp));
  fs.writeFileSync(fp, content);
  return true;
}

function main(){
  const input = process.argv[2];
  if (!input) {
    console.error('用法: node scripts/new-page.js <pageName>');
    process.exit(1);
  }
  const safe = toSafeName(input);
  if (!safe) {
    console.error('无效的页面名');
    process.exit(1);
  }

  const baseName = safe.split('/').pop();
  const pagesRoot = path.join(process.cwd(), 'pages');
  const pageDir = path.join(pagesRoot, safe);

  const sxmlPath = path.join(pageDir, `${baseName}.sxml`);
  const jsPath   = path.join(pageDir, `${baseName}.js`);
  const cssPath  = path.join(pageDir, `${baseName}.css`);
  const jsonPath = path.join(pageDir, `${baseName}.json`);

  const created = [];

  const sxml = `<!-- ${baseName} 页面（SXML 模板） -->\n\n<view class="container">\n  <view class="header">\n    <text class="title">{{ pageTitle }}</text>\n  </view>\n\n  <view class="content">\n    <text>这里是 ${baseName} 页面内容。</text>\n  </view>\n</view>\n`;

  const js = `// ${baseName} 页面逻辑\nPage({\n  data: {\n    pageTitle: '${baseName}'\n  },\n  onLoad() {\n    try { document.title = this.data.pageTitle || document.title; } catch(_) {}\n  }\n});\n`;

  const css = `/* ${baseName} 页面样式 */\n.container{ padding: 16px; }\n.title{ font-size: 20px; font-weight: 700; }\n`;

  const json = `{\n  "navigationBarTitleText": "${baseName}",\n  "usingComponents": {}\n}\n`;

  if (writeIfAbsent(sxmlPath, sxml)) created.push(path.relative(process.cwd(), sxmlPath));
  if (writeIfAbsent(jsPath, js)) created.push(path.relative(process.cwd(), jsPath));
  if (writeIfAbsent(cssPath, css)) created.push(path.relative(process.cwd(), cssPath));
  if (writeIfAbsent(jsonPath, json)) created.push(path.relative(process.cwd(), jsonPath));

  if (created.length === 0) {
    console.log('未创建任何文件，目标页面已存在：', pageDir);
  } else {
    console.log('✅ 已创建页面：');
    created.forEach(f => console.log('  -', f));
  }
}

main();
