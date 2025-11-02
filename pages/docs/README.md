# 📖 SXML 在线文档系统

## 🎉 全新发布！

我们为 SXML 框架创建了一个全新的在线文档系统，提供类似 VS Code 官方文档的专业阅读体验！

## ✨ 核心特性

### 1. 美观的界面设计
- ✅ VS Code 风格设计语言
- ✅ 明亮/暗黑双主题切换
- ✅ 完美响应式布局(桌面/平板/手机)

### 2. 强大的导航系统
- ✅ 6 大文档分类,24 篇完整文档
- ✅ 可折叠树形侧边栏
- ✅ 面包屑导航
- ✅ 页内目录(自动提取)
- ✅ 上一篇/下一篇快速切换

### 3. Markdown 完整支持
- ✅ 所有标准 Markdown 语法
- ✅ 代码块语法高亮(10+ 语言)
- ✅ 表格、列表、引用等
- ✅ VS Code 配色方案

### 4. 全文搜索
- ✅ 实时搜索所有文档
- ✅ 关键词高亮显示
- ✅ 快速跳转到结果

## 🚀 快速访问

### 开发模式
```bash
npm run dev
```
然后访问: http://localhost:3000/pages/docs/docs.html

### 生产环境
```bash
npm run build
```
部署 `dist/` 目录后访问: `https://your-domain.com/pages/docs/docs.html`

### 直接跳转到特定文档
```
http://localhost:3000/pages/docs/docs.html?doc=SXML_README
http://localhost:3000/pages/docs/docs.html?doc=SECURITY
http://localhost:3000/pages/docs/docs.html?doc=DEPLOYMENT
```

## 📚 文档分类

### 快速开始 (2 篇)
- 项目简介
- 多环境配置

### 核心功能 (5 篇)
- SXML 模板引擎
- SXML 编译指南
- 响应式系统
- 智能依赖系统
- 页面开发指南

### API 文档 (4 篇)
- SuperAPI 加密通信
- WebSocket API
- 文件 API
- API 签名映射

### 安全配置 (5 篇)
- 安全配置指南
- WebSocket 安全
- CSP 告警配置
- 敏感信息处理
- 安全审计报告

### 部署与运维 (4 篇)
- 生产部署指南
- CORS 跨域解决
- 日志系统
- 日志快速上手

### 开发参考 (4 篇)
- 代码风格指南
- SXML 文件指南
- 常见问题解决
- 功能测试

## 🎨 界面预览

### 明亮主题
- 清爽的白色背景
- VS Code Light 配色
- 清晰的文字层级

### 暗黑主题  
- 护眼的深色背景
- VS Code Dark 配色
- 优秀的代码高亮

### 移动端适配
- 可收起侧边栏
- 触摸友好的交互
- 流畅的滚动体验

## 💡 使用技巧

### 键盘快捷键
- `Ctrl + K`: 聚焦搜索框
- `Esc`: 关闭搜索结果

### 主题切换
点击右上角的 🌙/☀️ 图标,主题会自动保存

### 分享链接
每篇文档都有独立 URL,可以直接分享给其他人

### 搜索技巧
- 使用关键词而非完整句子
- 支持中文和英文搜索
- 搜索结果会显示匹配上下文

## 🔧 技术亮点

### 前端实现
- **零依赖**: 纯 JavaScript 实现,无需任何第三方库
- **轻量级**: Markdown 解析器 + 代码高亮器 < 10KB
- **高性能**: 客户端渲染,秒开体验

### 代码组织
```
pages/docs/
├── docs.sxml           # SXML 模板(声明式 UI)
├── docs.js             # 页面逻辑(3000+ 行)
├── docs.css            # VS Code 风格样式(700+ 行)
└── docs.json           # 页面元信息
```

### 工具支持
```
utils/code-highlighter.js  # 代码语法高亮器
css/code-highlight.css      # 高亮主题样式
```

## 📖 扩展文档

详细的使用和定制指南请参考: [文档系统使用指南](DOCS_SYSTEM_GUIDE.md)

包含:
- 如何添加新文档
- 如何自定义样式和主题
- 如何配置导航结构
- 故障排除指南
- 最佳实践建议

## 🎯 未来计划

### v2.1 规划
- [ ] 添加文档版本切换功能
- [ ] 支持多语言(中文/英文)
- [ ] 添加"编辑此页"功能(链接到 GitHub)
- [ ] 代码块支持复制按钮
- [ ] 添加文档反馈功能

### v2.2 规划
- [ ] 集成 API Playground(在线测试 API)
- [ ] 添加交互式代码示例
- [ ] 支持文档导出(PDF/Markdown)
- [ ] 增强搜索(模糊匹配、拼音)

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request!

**改进建议**:
- 文档内容错误或过时
- 界面交互体验改进
- 新功能建议
- 样式美化建议

## 📄 许可证

MIT License - 与 SXML 框架保持一致

---

**开发者**: King, Rainbow Haruko  
**项目**: SXML 框架  
**版本**: v2.0.2  
**发布日期**: 2025年11月2日

🔗 [GitHub 仓库](https://github.com/XujueKing/SXML) | 📖 [在线文档](pages/docs/docs.html) | 💬 [问题反馈](https://github.com/XujueKing/SXML/issues)
