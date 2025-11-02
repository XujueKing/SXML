// 自动化构建脚本：一键输出 dist 目录结构，自动收集依赖资源
// 用法：
//   node build.dist.js              # 默认生产环境
//   node build.dist.js dev          # 开发环境
//   node build.dist.js test         # 测试环境
//   node build.dist.js prod         # 生产环境

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIST = path.resolve(__dirname, 'dist');
const SRC = __dirname;
const ENV = process.argv[2] || process.env.NODE_ENV || 'production';

console.log('═══════════════════════════════════════');
console.log('  SXML 自动化构建工具');
console.log(`  环境: ${ENV.toUpperCase()}`);
console.log('═══════════════════════════════════════\n');

// 工具函数：递归复制目录
function copyDir(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.join(srcDir, file);
    const destFile = path.join(destDir, file);
    if (fs.statSync(srcFile).isDirectory()) {
      copyDir(srcFile, destFile);
    } else {
      fs.copyFileSync(srcFile, destFile);
    }
  }
}

// 步骤 1: 清空 dist 目录
function cleanDist() {
  console.log('🧹 清空 dist 目录...');
  if (fs.existsSync(DIST)) {
    fs.rmSync(DIST, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST);
}

// 步骤 2: 运行 build.js 预编译页面到 dist/pages
function buildPages() {
  console.log('📦 预编译 SXML 页面...\n');
  execSync(`node build.js ${ENV}`, { stdio: 'inherit' });
  console.log();
}

// 步骤 3: 复制静态资源目录
function copyStaticDirs() {
  console.log('📋 复制静态资源...');
  ['css', 'images', 'locales', 'config'].forEach(dir => {
    const srcDir = path.join(SRC, dir);
    const destDir = path.join(DIST, dir);
    if (fs.existsSync(srcDir)) {
      copyDir(srcDir, destDir);
      console.log(`  ✓ ${dir}/`);
    }
  });
}

// 步骤 4: 复制 utils 依赖（扫描 HTML 中引用的 js）
function copyUtilsUsedByPages() {
  console.log('📚 复制 utils 依赖...');
  const utilsSrc = path.join(SRC, 'utils');
  const utilsDist = path.join(DIST, 'utils');
  if (!fs.existsSync(utilsDist)) fs.mkdirSync(utilsDist, { recursive: true });
  
  // 扫描所有编译后的 HTML 文件
  const pagesDir = path.join(DIST, 'pages');
  const usedJs = new Set();
  
  function scanHtmlFiles(dir) {
    if (!fs.existsSync(dir)) return;
    for (const file of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        scanHtmlFiles(fullPath);
      } else if (file.endsWith('.html')) {
        const html = fs.readFileSync(fullPath, 'utf8');
        // 匹配 <script src="../../utils/xxx.js"> 或 <script src="../utils/xxx.js">
        const regex = /<script[^>]+src=["'][\.\/]*utils\/([^"']+\.js)["']/g;
        let m;
        while ((m = regex.exec(html))) {
          usedJs.add(m[1]);
        }
      }
    }
  }
  
  scanHtmlFiles(pagesDir);
  
  // 复制依赖的 js
  for (const js of usedJs) {
    const src = path.join(utilsSrc, js);
    const dest = path.join(utilsDist, js);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`  ✓ utils/${js}`);
    }
  }
}

// 步骤 5: 复制 index.html 到 dist 根目录
function copyIndex() {
  console.log('📄 生成站点首页 index.html...');
  const compiledIndex = path.join(DIST, 'pages', 'index', 'index.html');
  const legacyIndex = path.join(SRC, 'index.html');
  const dest = path.join(DIST, 'index.html');

  if (fs.existsSync(compiledIndex)) {
    fs.copyFileSync(compiledIndex, dest);
    console.log('  ✓ 来自 pages/index/index.html');
  } else if (fs.existsSync(legacyIndex)) {
    fs.copyFileSync(legacyIndex, dest);
    console.log('  ✓ 来自根目录 index.html（兼容旧版）');
  } else {
    console.warn('  ⚠️ 未找到首页源码（pages/index 或根目录 index.html）');
  }
}

// 主流程
cleanDist();
buildPages();
copyStaticDirs();
copyUtilsUsedByPages();
copyIndex();

console.log('\n═══════════════════════════════════════');
console.log('  ✅ 构建完成！');
console.log(`  输出目录: ${DIST}`);
console.log('═══════════════════════════════════════');
