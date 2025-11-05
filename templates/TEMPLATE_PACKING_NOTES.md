# 模板打包注意事项

## sxml-framework-clean 打包清单

### ✅ 需要包含的内容

#### 核心框架文件
- `utils/` - 完整的工具库
  - sxml.compiler.js
  - sxml.parser.js
  - page.js
  - sapi.js
  - i18n.js
  - logger.js
  - config.js
  - 其他工具文件

#### 构建和开发工具
- `build.js` - 构建工具
- `build.dist.js` - 分发构建工具
- `dev-server-sxml.js` - 开发服务器
- `app.js` - 应用入口

#### 配置文件
- `config/` 目录
  - app.config.dev.js
  - app.config.test.js
  - app.config.prod.js
  - api-sign-map.js（**必须清空数据！**）

#### 脚手架工具
- `scripts/` 目录
  - new-page.js
  - new-project.js
  - export-clean-template.js

#### 样式文件
- `css/` 目录
  - element.css
  - code-highlight.css

#### 国际化
- `locales/` 目录
  - zh-CN.js
  - en-US.js
  - zh-CN.json
  - en-US.json

#### 文档
- `docs/` 目录（所有 .md 文件）
- `README.md`
- `.gitignore`
- `package.json`

#### 空目录结构
- `pages/` - 只包含 index/ 示例页面
- `images/` - 空目录
- `logs/` - 包含 README.md

### ❌ 不要包含的内容

#### 业务页面
- `pages/login/` - 登录页面
- `pages/webapp/` - 应用页面
- `pages/myInfo/` - 个人信息页面
- `pages/demoBack/` - 演示页面
- `pages/demoNav/` - 演示导航页面
- `pages/docs/` - 文档页面（业务相关）

#### 业务数据和配置
- config/api-sign-map.js 中的**真实API密钥数据**
- config/*.js 中的**真实域名和敏感信息**

#### 构建产物
- `dist/` 目录
- `removal/` 目录

#### 开发临时文件
- `__test_*.html`
- `__tmp_*.txt`
- 任何临时文件

#### VS Code 扩展
- `vscode-extension/` - 除非单独发布

#### 语法高亮插件
- `sxml-highlighter/` - 除非单独发布

#### 其他
- `.github/` - CI/CD 配置（根据需要）
- `examples/` - 业务示例（根据需要）
- 业务相关的图片资源

## 重要提醒

### ⚠️ 敏感信息清理

1. **API 签名映射**：
   ```javascript
   // ❌ 错误 - 包含真实密钥
   const API_SIGN_MAP = {
     'I00002': '00000C4D55921F91F6958FBE967FF7BE',
   };
   
   // ✅ 正确 - 只保留结构
   const API_SIGN_MAP = {
     // 示例：添加你的接口签名映射
     // 'I00001': 'YOUR_API_KEY_HERE',
   };
   ```

2. **配置文件**：
   - 替换真实域名为 `api.example.com`
   - 替换应用名称为通用名称
   - 移除任何认证信息

3. **日志和调试信息**：
   - 移除包含敏感数据的日志文件
   - 清理调试输出

## 打包前检查清单

- [ ] api-sign-map.js 已清空真实数据
- [ ] 配置文件中无真实域名和密钥
- [ ] 只包含 index 示例页面
- [ ] 移除所有业务页面
- [ ] 移除 dist 和临时文件
- [ ] 文档完整且最新
- [ ] README.md 准确描述模板用途
- [ ] 创建 TEMPLATE_README.md 说明使用方法

## 自动化脚本建议

创建 `scripts/export-clean-template.js` 自动化打包流程：
- 自动清理敏感数据
- 只复制需要的文件
- 生成使用说明
- 验证完整性
