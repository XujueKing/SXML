# SXML 声明式开发指南

SXML（Super XML）是一套面向 Web 3.0 的声明式模板语法，专注于所见即所得的结构描述与易于理解的指令系统。配合响应式数据与预编译流程，你可以用更直观的方式构建稳定、可维护的前端页面。

---

## 核心理念

- 声明优先：用结构表达意图，用指令描述行为
- 简单直观：少即是多，避免复杂的运行时魔法
- 可预编译：最大化编译期能力，最小化运行时开销
- 安全可靠：配合 CSP、无 eval 的编译与运行策略

---

## 快速上手

在页面 HTML 中引入必要运行时（开发模式）：

```html
<script src="../../utils/sxml.parser.js"></script>
<script src="../../utils/page.loader.js"></script>
```

页面结构建议：同名的 `.sxml`、`.js`、`.css`、`.json` 组成一个页面单元，编译或加载时自动关联。

---

## 语法对照表（常用）

### 1) 组件标签映射

| SXML 标签 | HTML 标签 | 说明 |
|----------|----------|------|
| `<view>` | `<div>` | 视图容器 |
| `<text>` | `<span>` | 文本 |
| `<image>` | `<img>` | 图片 |
| `<button>` | `<button>` | 按钮 |
| `<input>` | `<input>` | 输入框 |
| `<textarea>` | `<textarea>` | 多行输入 |
| `<icon>` | `<i>` | 图标 |
| `<picker>` | `<select>` | 选择器 |
| `<navigator>` | `<a>` | 导航 |
| `<scroll-view>` | `<div>` | 可滚动视图 |
| `<swiper>` | `<div>` | 轮播容器 |
| `<swiper-item>` | `<div>` | 轮播子项 |

> 说明：SXML 更关注结构与意图，最终会转换为标准 HTML 标签，便于 SEO 与无障碍支持。

### 2) 指令与数据绑定

- Mustache 绑定：`{{ expression }}`
- 条件：`s:if`、`s:else-if`、`s:else`
- 显示/隐藏：`s:show`
- 列表：`s:for`（配合 `s:for-item`、`s:for-index`、`s:key`）
- 属性绑定：`:attr="value"` 或 `s:bind:attr="value"`
- 事件绑定：`bind:tap="handle"`、`bind:input="onInput"` 等

示例：

```xml
<view s:if="{{score >= 90}}">优秀</view>
<view s:else-if="{{score >= 60}}">及格</view>
<view s:else>不及格</view>

<view s:for="{{userList}}" s:for-item="user" s:for-index="idx" s:key="id">
  <text>{{idx + 1}}. {{user.name}}</text>
  <button bind:tap="viewDetail">查看</button>
  <input :value="user.remark" bind:input="onRemarkChange" />
  <view s:show="{{user.active}}">活跃</view>
  <view s:show="{{!user.active}}">沉默</view>
  <view>{{ user.name.substring(0, 1) }}</view>
  <view>{{ user.age + 1 }}</view>
  <view>{{ user?.profile?.city || 'N/A' }}</view>
  <view>{{ user.tags?.[0] }}</view>
</view>
```

### 3) 事件名称映射（常用）

| SXML 事件 | Web 事件 | 说明 |
|-----------|----------|------|
| `tap` | `click` | 点击 |
| `input` | `input` | 输入变更 |
| `change` | `change` | 值改变 |
| `focus` | `focus` | 获得焦点 |
| `blur` | `blur` | 失去焦点 |
| `touchstart` | `touchstart` | 触摸开始 |
| `touchmove` | `touchmove` | 触摸移动 |

> 说明：运行时会将 SXML 事件绑定转换为等效的原生 Web 事件处理。

### 4) 常见属性映射（图片裁剪等）

| SXML | HTML/CSS | 效果 |
|------|----------|------|
| `<image mode="aspectFit">` | `object-fit: contain` | 等比缩放，完整显示 |
| `<image mode="aspectFill">` | `object-fit: cover` | 等比缩放，铺满裁切 |
| `<image mode="widthFix">` | `width:100%; height:auto` | 宽度适配 |
| `<image mode="scaleToFill">` | `width:100%; height:100%` | 拉伸铺满 |

---

## 完整示例（登录页）

`pages/login/login.sxml`

```xml
<view class="container">
  <view class="header">
    <image src="/images/logo.png" mode="aspectFit" />
    <text class="title">欢迎登录 {{ appName }}</text>
  </view>

  <view class="form">
    <input 
      id="u"
      type="text" 
      placeholder="请输入用户名"
      bind:input="onUsername"
      bind:focus="onInputFocus"
      bind:blur="onInputBlur"
    />
    
    <input 
      id="p"
      type="password" 
      placeholder="请输入密码"
      bind:input="onPassword"
    />
    
    <button bind:tap="handleLogin" type="primary">
      登录
    </button>
  </view>

  <view s:if="{{isLoggedIn}}">
    <text>欢迎回来，{{username}}</text>
  </view>
  <view s:else>
    <text>请先登录</text>
  </view>
</view>
```

`pages/login/login.js`

```javascript
Page({
  data: {
    appName: 'ICE Admin',
    username: '',
    password: '',
    isLoggedIn: false
  },

  onUsername(e) {
    this.setData({ username: e?.target?.value || '' });
  },

  onPassword(e) {
    this.setData({ password: e?.target?.value || '' });
  },

  async handleLogin() {
    if (!this.data.username || !this.data.password) return;
    // TODO: 真实环境调用加密 API
    this.setData({ isLoggedIn: true });
  }
});
```

`pages/login/login.css`

```css
.container { max-width: 420px; margin: 48px auto; padding: 24px; }
.header { display: flex; align-items: center; gap: 12px; }
.title { font-size: 20px; font-weight: 600; }
.form { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; }
input { padding: 10px 12px; border: 1px solid #ddd; border-radius: 6px; }
button { padding: 10px 12px; border: none; border-radius: 6px; background: #1e80ff; color: #fff; }
```

---

## 最佳实践

1) 始终使用 `setData` 触发更新

```javascript
//  错误：不会触发视图更新
this.data.count = 10;

//  正确：触发视图更新
this.setData({ count: 10 });
```

2) 批量更新优先，减少多次 `setData`

```javascript
//  推荐
this.setData({ name: '新名称', age: 25, isVip: true });

//  避免
this.setData({ name: '新名称' });
this.setData({ age: 25 });
this.setData({ isVip: true });
```

3) 条件与列表

- 仅编译期控制：`s:if / s:else-if / s:else`
- 运行期显示切换：`s:show`
- 列表渲染请设置 `s:key`，并在需要时自定义 `s:for-item`、`s:for-index`

4) 安全与合规

- 避免在模板中拼接不可信 HTML
- 配合严格的 CSP（使用 Nonce），禁止 `unsafe-inline/unsafe-eval`
- 禁止在前端硬编码凭据与敏感信息

---

## 常见问题（FAQ）

Q1：为什么明明修改了 `data`，界面却不更新？

A：需要通过 `setData()` 更新，才能触发依赖收集与渲染刷新。

Q2：事件回调拿不到值？

A：请优先从 `e.target.value` 读取；有些场景也可能存在 `e.detail.value`。

Q3：指令表达式要不要用 `{{}}` 包裹？

A：建议统一使用 Mustache 包裹，表达式更清晰，也便于编译期校验。

Q4：如何与国际化配合？

A：建议在 `utils/i18n.js` 中集中定义，页面中通过方法读取并写入到 `data`。

---

## 术语说明

- SXML：Super XML 的简称，面向 Web 3.0 的声明式模板语法
- 指令（Directive）：以 `s:` 为前缀的模板指令，用于控制结构、属性与事件
- 预编译：在构建阶段将 SXML 转换为 HTML/JS/CSS，降低运行时成本

---

最后，建议配合项目中的安全配置和部署指南，统一采用 CSP Nonce、加密通信与日志监控，保障生产环境的可观测性与安全性。

---

## 高级语法与实践

### 1) 模板与插槽（include/slot）

SXML 支持将可复用区块抽成模板片段，并在页面中引入；同时支持用命名插槽进行内容注入。

示例（思想示例，具体以项目编译器支持为准）：

```xml
<!-- components/card.sxml -->
<view class="card">
  <view class="card__header">
    <slot name="header">默认标题</slot>
  </view>
  <view class="card__body">
    <slot>默认内容</slot>
  </view>
  <view class="card__footer">
    <slot name="footer"></slot>
  </view>
  
</view>
```

```xml
<!-- pages/demo.sxml -->
<include src="../../components/card.sxml">
  <view slot="header">自定义标题</view>
  <text>主内容区域</text>
  <view slot="footer">底部信息</view>
</include>
```

> 注意：`include/slot` 的具体语法与限制请参考项目的 SXML 编译指南（如需，我们可一并补充实现约束与最佳实践）。

### 2) 表达式安全与优先级

表达式在编译期解析，无 `eval/new Function`。

- 仅允许安全的运算符：`+ - * / %`、比较/逻辑运算、三元表达式等
- 支持可选链与空值合并：`obj?.a?.b ?? 'N/A'`
- 支持字符串/数字/布尔/空值字面量
- 禁止访问全局对象与 DOM API
- 禁止构造器与原型链操作

优先级示例：

```xml
<view>{{ a + b * c }}</view>
<view>{{ cond ? x : y }}</view>
<view>{{ user?.name || '匿名' }}</view>
```

### 3) 迁移对照表（从旧风格到 SXML）

| 旧风格 | SXML 写法 | 说明 |
|--------|-----------|------|
| `wx:if` / `v-if` | `s:if` | 条件渲染 |
| `hidden` / `v-show` | `s:show` | 显示/隐藏 |
| `wx:for` / `v-for` | `s:for` | 列表渲染 |
| `:attr` / `bind:attr` | `:attr` 或 `s:bind:attr` | 属性绑定 |
| `@click` / `bindtap` | `bind:tap` | 事件绑定 |

### 4) 常见错误对照

| 问题 | 错误示例 | 正确示例 |
|------|----------|----------|
| 条件未用 Mustache | `<view s:if="isOk">` | `<view s:if="{{isOk}}">` |
| 直接赋值不刷新 | `this.data.x = 1` | `this.setData({ x: 1 })` |
| 列表缺少 key | `<view s:for="{{list}}">` | `<view s:for="{{list}}" s:key="id">` |
| 非法表达式 | `{{ window.location }}` | 避免访问全局对象 |
