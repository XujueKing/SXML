# SXML Highlighter

轻量语法注入：为 SXML 增加以下高亮

- 指令属性：`s-if` / `s-show` / `s-for`
- 事件属性：`bind*`（如 `bindtap`, `bindinput` 等）
- 模板表达式：`{{ ... }}`

## 使用方式（两种）

1) 直接运行扩展调试（无需打包）
- 在 VS Code 打开本文件夹 `sxml-highlighter`
- 按 F5 启动 Extension Development Host
- 在新窗口中打开你的项目，查看 .sxml 文件的高亮

2) 打包 VSIX 并安装
- 在该目录执行：
  - `npm i -D vsce`（如无网络可跳过，改用方案 1）
  - `npx vsce package`
- 生成 `.vsix` 后，在 VS Code 扩展面板选择"从 VSIX 安装"

> 提示：已在工作区将 `*.sxml` 映射为 `html` 语言模式，获得更好的高亮与补全支持。本扩展只做额外注入以突出 SXML 特性。
