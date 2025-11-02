/**
 * 构建脚本 - 编译 SXML 页面
 * 运行: 
 *   node build.js                  # 默认生产环境
 *   node build.js dev              # 开发环境
 *   node build.js test             # 测试环境
 *   node build.js prod             # 生产环境
 *   NODE_ENV=test node build.js    # 使用环境变量
 */

const SXMLCompiler = require('./utils/sxml.compiler.js');
const path = require('path');

// 获取环境参数
const envArg = process.argv[2];
const env = envArg || process.env.NODE_ENV || 'production';

console.log('═══════════════════════════════════════');
console.log('  SXML 页面预编译工具');
console.log(`  环境: ${env.toUpperCase()}`);
console.log('═══════════════════════════════════════\n');

const compiler = new SXMLCompiler(env);

// 配置路径
const pagesDir = path.join(__dirname, 'pages');
const outputDir = path.join(__dirname, 'dist', 'pages');

// 执行编译
compiler.compilePages(pagesDir, outputDir);

console.log('\n═══════════════════════════════════════');
console.log('  构建完成！');
console.log(`  输出目录: ${outputDir}`);
console.log('═══════════════════════════════════════');
