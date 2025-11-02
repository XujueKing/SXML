# SXML 功能测试指南

本文档用于验证 SXML 的关键功能是否正常工作。

## 1. s:if 响应式测试（login 页面）

### 测试步骤：

1. 打开浏览器控制台（F12）
2. 访问 login 页面（开发模式或 dist 构建版本）
3. 在控制台执行以下命令测试 s:if 响应式：

```javascript
// 查看当前状态
console.log('当前 keyStatus:', currentPage.data.keyStatus);

// 切换状态为 true（应该显示锁图标和相关元素）
currentPage.setData({ keyStatus: true });

// 切换状态为 false（应该隐藏锁图标和相关元素）
currentPage.setData({ keyStatus: false });
```

### 预期结果：

- `keyStatus: true` 时：
  - ✅ 锁图标（#l）显示
  - ✅ "已安装密钥"提示（#l2）显示
  - ✅ 条形码图标（#b_code）显示
  - ✅ 白色二维码图标（#b_code3）显示
  - ✅ 三点菜单图标（#b_code2）隐藏

- `keyStatus: false` 时：
  - ✅ 以上元素状态相反

## 2. s:for 与 Mustache 表达式测试

### 支持的写法：

```xml
<!-- 方式 1: 整体包裹 -->
<div s:for="{{item in list}}">{{item}}</div>

<!-- 方式 2: 右侧表达式包裹 -->
<div s:for="item in {{list}}">{{item}}</div>

<!-- 方式 3: 复杂表达式 -->
<div s:for="{{item in userInfo.orders}}">{{item.name}}</div>

<!-- 方式 4: 带索引 -->
<div s:for="{{item, idx in products}}">{{idx + 1}}. {{item}}</div>
```

### 测试用例（可在 myInfo 页面添加）：

在 `pages/myInfo/myInfo.sxml` 添加：

```xml
<view class="test-section">
  <view class="section-title">订单列表测试</view>
  <view s:for="{{order, idx in stats.orders}}" class="order-item">
    <text>{{idx + 1}}. 订单号: {{order.id}}</text>
  </view>
</view>
```

在 `pages/myInfo/myInfo.js` 的 data 中添加：

```javascript
stats: {
  todayVisits: 5,
  totalVisits: 256,
  points: 1580,
  orders: [
    { id: 'ORD001', amount: 1200 },
    { id: 'ORD002', amount: 850 },
    { id: 'ORD003', amount: 2100 }
  ]
}
```

### 预期结果：

页面应渲染：
```
订单列表测试
1. 订单号: ORD001
2. 订单号: ORD002
3. 订单号: ORD003
```

## 3. s:else 和 s:else-if 测试

### 示例代码：

```xml
<view s:if="{{score >= 90}}">优秀</view>
<view s:else-if="{{score >= 60}}">及格</view>
<view s:else>不及格</view>
```

### 测试命令：

```javascript
// 设置不同分数测试
currentPage.setData({ score: 95 });  // 应显示"优秀"
currentPage.setData({ score: 75 });  // 应显示"及格"
currentPage.setData({ score: 45 });  // 应显示"不及格"
```

## 4. s:show 响应式测试

### 示例：

```xml
<view s:show="{{isVisible}}">此内容可显示/隐藏</view>
```

### 测试命令：

```javascript
currentPage.setData({ isVisible: true });   // 显示
currentPage.setData({ isVisible: false });  // 隐藏（display: none）
```

## 5. 运行态刷新测试

### 手动触发完整刷新：

```javascript
// 修改数据
currentPage.data.someValue = 'new value';

// 手动刷新整个 SXML（会重新解析所有指令和绑定）
refreshSXML();
```

## 注意事项

1. **必须使用 setData**：直接修改 `currentPage.data.xxx` 不会触发更新，必须用 `currentPage.setData({ xxx: value })`
2. **响应式系统依赖**：确保页面已加载 `reactive.js` 和 `sxml.parser.js`
3. **预编译页面**：dist 构建的页面虽然是预渲染的静态 HTML，但依然可以通过 setData 进行运行时更新
4. **Mustache 包裹**：建议所有指令表达式都用 `{{}}` 包裹，保持声明式风格一致性

## 故障排查

### s:if 不响应？

1. 检查是否用了 `setData` 而非直接赋值
2. 打开控制台查看是否有 SXML 解析错误
3. 确认 `reactive.js` 和 `sxml.parser.js` 已加载
4. 检查条件表达式语法是否正确

### s:for 不渲染？

1. 检查列表数据是否为数组
2. 确认表达式语法：`item in list` 或 `{{item in list}}`
3. 查看控制台是否有编译/解析错误

### 数据更新但 UI 不刷新？

1. 确认使用了 `setData` 方法
2. 检查是否在 Page() 生命周期外修改数据
3. 尝试手动调用 `refreshSXML()`
