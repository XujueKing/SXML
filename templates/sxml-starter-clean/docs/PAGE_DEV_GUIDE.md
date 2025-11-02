# 现代化 Web 3.0 页面开发指南

## 简介

本项目采用面向 Web 3.0 的现代化开发模式，让 Web 页面开发更简单、规范、可维护。每个页面使用统一的目录结构与命名约定，同名的 HTML/CSS/JS/JSON/SXML 自动装配，无需手工引入。

## 目录结构

```
pages/
  myInfo/              # 个人信息页面
    myInfo.html        # 页面结构
    myInfo.css         # 页面样式
    myInfo.js          # 页面逻辑（Page 模式）
    myInfo.json        # 页面配置（自动注入 window.PAGE_CONFIG）
  login/               # 登录页面
    login.html
    login.css
    login.js
    login.json
  ...                  # 其他页面
```

## 核心概念与用法

### 1. 自动资源加载

只需在 HTML 中引入页面加载器，同名的 CSS/JS/JSON 会被自动加载：

```html
<!-- 只需要这一行 -->
<script src="../../utils/page.loader.js"></script>

<!-- 不再需要手动引入：
<link rel="stylesheet" href="myInfo.css">
<script src="myInfo.js"></script>
-->
```

如存在同名的 SXML 模板（myInfo.sxml），在非预编译页面下也会自动加载并插入到文档中。

### 2. Page() 页面模型

```javascript
// myInfo.js
Page({
  // 页面数据
  data: {
    userInfo: {
      name: '张三',
      email: 'user@example.com'
    }
  },

  // 生命周期
  onLoad(options) {
    console.log('页面加载', options);
  },

  onReady() {
    console.log('页面渲染完成');
  },

  onShow() {
    console.log('页面显示');
  },

  onHide() {
    console.log('页面隐藏');
  },

  onUnload() {
    console.log('页面卸载');
  },

  // 自定义方法
  handleEdit() {
    this.setData({
      userInfo: {
        ...this.data.userInfo,
        name: '李四'
      }
    });
  }
});
```

### 3. 页面配置（JSON）

```json
{
  "navigationBarTitleText": "个人信息",
  "navigationBarBackgroundColor": "#667eea",
  "navigationBarTextStyle": "white",
  "backgroundColor": "#f8f9fa",
  "enablePullDownRefresh": false
}
```

配置会自动注入到 `window.PAGE_CONFIG`，可在 JS 中访问。

### 4. 声明式导航 API

```javascript
// 保留当前页面，跳转到新页面
wx.navigateTo({
  url: '../myInfo/myInfo.html'
});

// 关闭当前页面，跳转到新页面
wx.redirectTo({
  url: '../login/login.html'
});

// 返回上一页
wx.navigateBack();

// 关闭所有页面，打开到新页面
wx.reLaunch({
  url: '../index/index.html'
});
```

## 创建新页面（示例）

### 步骤 1：创建目录

```bash
mkdir pages/myPage
```

### 步骤 2：创建四个文件

#### myPage.html
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>我的页面</title>

  <!-- 引入页面加载器（自动装配同名 CSS/JS/JSON/SXML） -->
  <script src="../../utils/page.loader.js"></script>

  <!-- 可选：响应式系统 -->
  <script src="../../utils/reactive.js"></script>
  <script src="../../utils/bind.js"></script>
</head>
<body>
  <div class="container">
    <h1 v-text="title">我的页面</h1>
    <button onclick="currentPage.handleClick()">点我</button>
  </div>

  <!-- 可选：在资源加载完毕后进行响应式绑定 -->
  <script>
    document.addEventListener('pageResourcesLoaded', function() {
      if (window.Bind && window.currentPage) {
        const app = Bind.createApp({
          el: '.container',
          data: window.currentPage.data,
          methods: window.currentPage
        });
        Object.assign(window.currentPage, app);
      }
    });
  </script>
</body>
</html>
```

#### myPage.css
```css
.container { padding: 20px; }
h1 { color: #667eea; }
```

#### myPage.js
```javascript
Page({
  data: { title: '我的页面' },
  onLoad(options) { console.log('页面加载', options); },
  onReady() { console.log('页面渲染完成'); },
  handleClick() {
    console.log('按钮被点击');
    this.setData({ title: '标题已更新' });
  }
});
```

#### myPage.json
```json
{
  "navigationBarTitleText": "我的页面",
  "navigationBarBackgroundColor": "#667eea",
  "navigationBarTextStyle": "white"
}
```

## 数据绑定与更新

### 基础绑定

```html
<!-- 文本绑定 -->
<span v-text="userName">默认值</span>

<!-- 双向绑定 -->
<input v-model="userName" />

<!-- 条件渲染 -->
<div v-if="isVip">VIP 内容</div>
<div v-show="showMessage">可见内容</div>
```

### 更新数据

```javascript
// 推荐：setData（具有最小更新语义）
this.setData({ userName: '新名字', age: 25 });

// 直接修改（需配合响应式系统）
this.data.userName = '新名字';
```

## API 调用（示例）

```javascript
Page({
  data: { userInfo: null },
  async onLoad() {
    if (!window.superAPI) window.superAPI = createSuperAPI();
    try {
      const data = await window.superAPI.request('I00002', {
        userEmail: sessionStorage['u'],
        userPassword: sessionStorage['p']
      });
      this.setData({ userInfo: data });
    } catch (err) {
      console.error('接口调用失败', err);
    }
  }
});
```

## 页面跳转与参数

### 传参

```javascript
wx.navigateTo({ url: '../detail/detail.html?id=123&name=test' });
```

### 接收参数

```javascript
Page({
  onLoad(options) {
    console.log(options); // { id: '123', name: 'test' }
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const name = params.get('name');
  }
});
```

## 样式最佳实践

### 1. 优先使用类名而非 ID

```css
/* 推荐 */
.user-card { }

/* 不推荐 */
#userCard { }
```

### 2. BEM 命名规范

```css
.block { }
.block__element { }
.block--modifier { }

/* 示例 */
.user-card { }
.user-card__header { }
.user-card--vip { }
```

### 3. 响应式设计

```css
/* 移动端优先 */
.container { padding: 10px; }

/* 平板 */
@media (min-width: 768px) { .container { padding: 20px; } }

/* 桌面 */
@media (min-width: 1024px) { .container { padding: 40px; } }
```

## 注意事项

### 1. 文件命名必须一致

```
✔ 正确
pages/myInfo/
  myInfo.html
  myInfo.css
  myInfo.js
  myInfo.json

✘ 错误
pages/myInfo/
  myInfo.html
  style.css        # 名称不一致
  script.js        # 名称不一致
  config.json      # 名称不一致
```

### 2. 相对路径

在 HTML 中引入 utils 时使用相对路径：
- 一级目录：`../utils/page.loader.js`
- 二级目录：`../../utils/page.loader.js`

### 3. 资源加载顺序

默认顺序：JSON → CSS → JS。确保 JS 中可以访问 `window.PAGE_CONFIG`。

### 4. 全局对象

```javascript
window.currentPage      // 当前页面实例
window.PAGE_CONFIG      // 当前页面配置
window.Page             // Page 构造函数
window.wx               // 导航 API
```

## 调试技巧

### 1. 查看加载日志

打开控制台，可见：
```
✅ JSON loaded: pages/myInfo/myInfo.json
✅ CSS loaded: pages/myInfo/myInfo.css
✅ JS loaded: pages/myInfo/myInfo.js
✅ Page resources loaded successfully
```

### 2. 访问页面实例

```javascript
console.log(window.currentPage);
console.log(window.currentPage.data);
console.log(window.PAGE_CONFIG);
```

### 3. 测试生命周期

```javascript
Page({
  onLoad() { console.log('onLoad 执行'); },
  onReady() { console.log('onReady 执行'); }
});
```

## 与响应式系统集成

```javascript
Page({
  data: { count: 0, list: [] },
  onLoad() {
    // 数据会被响应式系统代理（如已引入 reactive.js / bind.js）
    console.log(this.data); // 可能是 Proxy 对象
  },
  increment() {
    // 方式 1：setData
    this.setData({ count: this.data.count + 1 });
    // 方式 2：直接修改（配合响应式）
    this.data.count++;
  }
});
```

## 示例项目

参考 `pages/myInfo/` 目录中的完整示例。

---

## 常见问题（FAQ）

**Q: 如果 CSS/JS 文件缺失会怎样？**  
A: 页面加载器会在控制台输出警告，但不会阻塞页面运行。

**Q: 可以手动引入外部 CSS/JS 吗？**  
A: 可以，直接在 HTML 中正常引入即可；不会影响自动加载机制。

**Q: Page() 必须使用吗？**  
A: 非强制，但推荐使用以获得统一的生命周期管理与数据处理方式。

**Q: 如何迁移已有页面？**  
A:
1. 新建 `pages/pageName/`
2. 拆分 HTML/CSS/JS 到同名文件（如 `pageName.html/css/js`）
3. 新增 `pageName.json` 页面配置
4. 在 HTML 中引入 `page.loader.js`

---

开始打造你的第一个 Web 3.0 页面吧！

