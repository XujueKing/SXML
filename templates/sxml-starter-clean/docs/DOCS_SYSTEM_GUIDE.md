# SXML 框架文档系统使用指南

## 📖 概述

本文档系统采用类似 VS Code 官方文档的设计风格,提供了友好的阅读体验和强大的功能。

## ✨ 主要特性

### 1. 美观的界面设计
- **双主题支持**: 明亮/暗黑主题切换
- **响应式布局**: 完美支持桌面和移动设备
- **VS Code 风格**: 专业、简洁的设计语言

### 2. 强大的文档导航
- **分类导航**: 6 大文档分类(快速开始、核心功能、API、安全、部署、参考)
- **可折叠侧边栏**: 树形结构,支持展开/折叠
- **面包屑导航**: 清晰显示当前位置
- **页内目录**: 自动提取标题生成目录,支持快速跳转

### 3. Markdown 完整支持
- ✅ 标题(H1-H6)
- ✅ 代码块(支持语法高亮)
- ✅ 表格
- ✅ 列表(有序/无序)
- ✅ 引用块
- ✅ 链接和图片
- ✅ 粗体/斜体/行内代码

### 4. 代码语法高亮
- 支持多种语言: JavaScript, Python, Java, CSS, XML, JSON 等
- VS Code 配色方案
- 明亮/暗黑主题自动切换

### 5. 全文搜索
- 实时搜索所有文档
- 关键词高亮
- 搜索结果快速跳转

### 6. 智能导航
- 上一篇/下一篇文档快速切换
- 同类文档自动关联
- URL 状态保持(支持书签和分享)

## 📁 文档分类

### 快速开始
- 项目简介 (`README.md`)
- 多环境配置 (`MULTI_ENV_GUIDE.md`)

### 核心功能
- SXML 模板引擎
- SXML 编译指南
- 响应式系统
- 智能依赖系统
- 页面开发指南

### API 文档
- SuperAPI 加密通信
- WebSocket API
- 文件 API
- API 签名映射

### 安全配置
- 安全配置指南
- WebSocket 安全
- CSP 告警配置
- 敏感信息处理
- 安全审计报告

### 部署与运维
- 生产部署指南
- CORS 跨域解决
- 日志系统
- 日志快速上手

### 开发参考
- 代码风格指南
- SXML 文件指南
- 常见问题解决
- 功能测试

## 🚀 使用方法

### 访问文档

开发模式:
```bash
npm run dev
# 访问: http://localhost:3000/pages/docs/docs.html
```

生产环境:
```bash
npm run build
# 部署 dist/ 目录
# 访问: https://your-domain.com/pages/docs/docs.html
```

### URL 参数

可以直接链接到特定文档:
```
http://localhost:3000/pages/docs/docs.html?doc=SXML_README
```

支持的文档 ID:
- `README` - 项目简介
- `SXML_README` - SXML 模板引擎
- `REACTIVE_README` - 响应式系统
- `SAPI_README` - SuperAPI 文档
- `SECURITY` - 安全配置
- ... (更多请参考导航栏)

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + K` | 聚焦搜索框 |
| `Esc` | 关闭搜索结果 |

### 主题切换

点击右上角月亮/太阳图标即可切换主题。主题偏好会自动保存到本地存储。

## 🔧 技术实现

### 文件结构

```
pages/docs/
├── docs.sxml           # SXML 模板
├── docs.js             # 页面逻辑(Markdown 解析、导航管理)
├── docs.css            # 样式(VS Code 风格)
└── docs.json           # 页面配置
```

### 核心组件

#### Markdown 解析器
- 纯 JavaScript 实现
- 支持所有常用 Markdown 语法
- 自动生成目录(TOC)
- 安全的 HTML 转义

#### 代码高亮器
- 轻量级实现(`utils/code-highlighter.js`)
- 支持多种语言
- VS Code 配色方案
- 主题自适应

#### 搜索引擎
- 客户端全文索引
- 实时搜索
- 关键词摘要提取

## 📝 添加新文档

### 步骤 1: 创建 Markdown 文件

在 `docs/` 目录下创建新的 `.md` 文件:
```markdown
# 新文档标题

## 章节 1
内容...

## 章节 2
内容...
```

### 步骤 2: 注册文档

编辑 `pages/docs/docs.js`,在 `DOC_MAP` 中添加:

```javascript
const DOC_MAP = {
  // ...existing docs
  
  'NEW_DOC': {
    title: '新文档标题',
    file: '../../docs/NEW_DOC.md',
    category: 'core',  // 选择分类
    order: 6           // 排序
  }
};
```

### 步骤 3: 添加导航

在 `pages/docs/docs.sxml` 对应分类的 `.nav-items` 中添加:

```xml
<view class="nav-item"
      :class="currentDoc === 'NEW_DOC' ? 'active' : ''"
      bind:tap="loadDoc"
      data-doc="NEW_DOC">
  <text>新文档标题</text>
</view>
```

### 步骤 4: 测试

刷新页面,新文档应该出现在导航栏中。

## 🎨 自定义样式

### 修改主题色

编辑 `pages/docs/docs.css`:

```css
:root {
  --primary-color: #007acc;  /* 修改为你的主题色 */
  --primary-hover: #005a9e;
}
```

### 修改布局

调整侧边栏宽度:
```css
:root {
  --sidebar-width: 280px;  /* 修改为所需宽度 */
}
```

## ⚙️ 配置选项

### 启用/禁用功能

在 `pages/docs/docs.js` 中:

```javascript
Page({
  data: {
    // 启用/禁用搜索
    searchEnabled: true,
    
    // 启用/禁用页内目录
    tocEnabled: true,
    
    // 侧边栏默认展开状态
    sidebarExpanded: true
  }
});
```

## 🐛 故障排除

### 文档加载失败

**问题**: 显示"文档加载失败"

**解决**:
1. 检查文件路径是否正确
2. 确认 Markdown 文件存在
3. 查看浏览器控制台错误信息

### 代码高亮不工作

**问题**: 代码块没有语法高亮

**解决**:
1. 确认 `utils/code-highlighter.js` 已加载
2. 检查代码块是否指定了语言:
   ````markdown
   ```javascript
   const x = 10;
   ```
   ````
3. 查看浏览器控制台是否有错误

### 搜索无结果

**问题**: 搜索不到任何内容

**解决**:
1. 等待搜索索引构建完成(首次加载需要几秒)
2. 检查关键词拼写
3. 尝试更短的关键词

## 💡 最佳实践

### 1. 文档组织
- 按功能模块分类
- 使用清晰的标题层级
- 添加目录和导航链接

### 2. Markdown 编写
- 使用 H1 作为文档标题
- H2-H3 作为章节标题
- 代码块指定语言以获得高亮

### 3. 性能优化
- 文档不宜过长(建议 < 10000 字)
- 图片使用相对路径
- 避免过大的表格

### 4. 可访问性
- 使用语义化 HTML
- 提供替代文本
- 保持良好的颜色对比度

## 📊 统计信息

当前文档系统包含:
- **24 篇文档**
- **6 大分类**
- **支持 10+ 种语言语法高亮**
- **双主题模式**
- **移动端完全适配**

## 🔗 相关链接

- [SXML 框架主页](../../README.md)
- [GitHub 仓库](https://github.com/XujueKing/SXML)
- [在线文档](https://your-domain.com/pages/docs/docs.html)

## 📄 许可证

MIT License

---

**开发者**: King, Rainbow Haruko  
**最后更新**: 2025年11月2日
