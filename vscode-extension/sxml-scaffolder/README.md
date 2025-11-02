# SXML Scaffolder

轻量 VS Code 扩展：一键新建 SXML 页面与空白项目。

## 功能

- **SXML: 新建页面** - 快速创建包含 .sxml、.js、.css、.json 的完整页面结构
- **SXML: 新建空白项目** - 生成最小 SXML 项目骨架

## 安装

### 方式一：VSIX 打包安装（推荐）

在项目根目录运行:

```bash
npm run ext:package
npm run ext:install
```

或在 VS Code 任务面板运行 "SXML Extension: Package & Install"。

### 方式二：工作区调试

1. 打开此扩展目录（`vscode-extension/sxml-scaffolder`）
2. 按 F5 启动扩展开发宿主
3. 在新窗口中测试命令

## 使用

### 新建页面

**方式 1**：命令面板
- 打开命令面板：`Ctrl+Shift+P`（Windows/Linux）或 `Cmd+Shift+P`（macOS）
- 选择 "SXML: 新建页面"
- 输入页面名（支持嵌套路径，如 `user/profile`）
- 自动在 `pages/` 目录下生成四个文件

**方式 2**：资源管理器右键
- 在资源管理器中右键点击 `pages/` 下的任意文件夹
- 选择 "SXML: 新建页面"
- 输入页面名，文件将生成在选中的文件夹下

### 新建空白项目

- 打开命令面板：`Ctrl+Shift+P`
- 选择 "SXML: 新建空白项目"
- 选择空目录作为项目根目录
- 扩展将调用 `scripts/new-project.js` 生成最小项目骨架

## 配置

### sxmlScaffolder.newProjectScriptPath

指定新建项目脚本的路径（相对于工作区根目录）。

**默认值**：`scripts/new-project.js`

**示例**：
```json
{
  "sxmlScaffolder.newProjectScriptPath": "custom/my-project-template.js"
}
```

## 开发

### 调试扩展

1. 克隆项目并打开 `vscode-extension/sxml-scaffolder`
2. 运行 `npm install`（如果有依赖）
3. 按 F5 启动调试
4. 在扩展开发宿主窗口测试功能

### 打包发布

```bash
cd vscode-extension/sxml-scaffolder
npx @vscode/vsce package --no-dependencies
```

生成的 `.vsix` 文件可通过 `code --install-extension <file>.vsix` 安装。

## 许可

MIT
