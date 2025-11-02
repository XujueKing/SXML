const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

function toSafeName(name){
  return String(name || '')
    .replace(/\\/g,'/')
    .replace(/[^a-zA-Z0-9_\/\-]/g,'-')
    .replace(/\/{2,}/g,'/')
    .replace(/^-+|-+$/g,'')
    .trim();
}

function ensureDir(dir){ if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }

async function newPageCommand(uri){
  const ws = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];
  if (!ws) {
    return vscode.window.showErrorMessage('请先打开一个工作区');
  }
  const baseFolder = uri && uri.fsPath && fs.statSync(uri.fsPath).isDirectory() ? uri.fsPath : path.join(ws.uri.fsPath, 'pages');
  ensureDir(baseFolder);

  const input = await vscode.window.showInputBox({
    prompt: '输入新页面名称（支持子目录，如 user/profile）',
    placeHolder: 'demo',
    validateInput: (v)=> !toSafeName(v) ? '请输入有效名称' : undefined
  });
  if (!input) return;

  const safe = toSafeName(input);
  const pageDir = path.join(baseFolder, safe);
  const name = safe.split('/').pop();

  const sxmlPath = path.join(pageDir, `${name}.sxml`);
  const jsPath   = path.join(pageDir, `${name}.js`);
  const cssPath  = path.join(pageDir, `${name}.css`);
  const jsonPath = path.join(pageDir, `${name}.json`);

  const sxml = `<!-- ${name} 页面（SXML 模板） -->\n\n<view class="container">\n  <view class="header">\n    <text class="title">{{ pageTitle }}</text>\n  </view>\n\n  <view class="content">\n    <text>这里是 ${name} 页面内容。</text>\n  </view>\n</view>\n`;
  const js = `// ${name} 页面逻辑\nPage({\n  data: {\n    pageTitle: '${name}'\n  },\n  onLoad() {\n    try { document.title = this.data.pageTitle || document.title; } catch(_) {}\n  }\n});\n`;
  const css = `/* ${name} 页面样式 */\n.container{ padding: 16px; }\n.title{ font-size: 20px; font-weight: 700; }\n`;
  const json = `{"navigationBarTitleText":"${name}","usingComponents":{}}\n`;

  ensureDir(pageDir);
  if (!fs.existsSync(sxmlPath)) fs.writeFileSync(sxmlPath, sxml);
  if (!fs.existsSync(jsPath)) fs.writeFileSync(jsPath, js);
  if (!fs.existsSync(cssPath)) fs.writeFileSync(cssPath, css);
  if (!fs.existsSync(jsonPath)) fs.writeFileSync(jsonPath, json);

  vscode.window.showInformationMessage(`已创建页面：${path.relative(ws.uri.fsPath, pageDir)}`);
  vscode.commands.executeCommand('revealInExplorer', vscode.Uri.file(pageDir));
}

async function newProjectCommand(){
  const ws = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];
  if (!ws) {
    return vscode.window.showErrorMessage('请先打开一个工作区（包含脚本 scripts/new-project.js）');
  }

  const config = vscode.workspace.getConfiguration('sxmlScaffolder');
  const scriptPathCfg = config.get('newProjectScriptPath') || 'scripts/new-project.js';
  const scriptPath = path.join(ws.uri.fsPath, scriptPathCfg);
  if (!fs.existsSync(scriptPath)) {
    return vscode.window.showErrorMessage(`未找到脚本：${scriptPathCfg}，请在当前工作区内提供它或调整设置 sxmlScaffolder.newProjectScriptPath`);
  }

  const pick = await vscode.window.showOpenDialog({ canSelectFiles: false, canSelectFolders: true, canSelectMany: false, openLabel: '选择新项目目录（空目录）' });
  if (!pick || !pick.length) return;
  const targetDir = pick[0].fsPath;

  const out = vscode.window.createOutputChannel('SXML Scaffolder');
  out.show(true);
  out.appendLine(`运行: node ${scriptPathCfg} ${targetDir}`);

  await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: '创建 SXML 项目', cancellable: false }, () => new Promise((resolve) => {
    const child = cp.spawn(process.platform === 'win32' ? 'node.exe' : 'node', [scriptPath, targetDir], { cwd: ws.uri.fsPath, shell: false });
    child.stdout.on('data', d => out.append(d.toString()));
    child.stderr.on('data', d => out.append(d.toString()));
    child.on('close', (code) => {
      if (code === 0) vscode.window.showInformationMessage('✅ 项目创建完成');
      else vscode.window.showErrorMessage(`项目创建失败：退出码 ${code}`);
      resolve();
    });
  }));
}

function activate(context){
  context.subscriptions.push(
    vscode.commands.registerCommand('sxmlScaffolder.newPage', newPageCommand),
    vscode.commands.registerCommand('sxmlScaffolder.newProject', newProjectCommand)
  );
}

function deactivate(){}

module.exports = { activate, deactivate };
