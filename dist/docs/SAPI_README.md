# SuperAPI 使用说明（对齐当前实现）

本文档与 `utils/sapi.js`、`utils/config.js` 的现状保持一致，涵盖加密流程、依赖、配置、调用方式、错误处理与联调注意点。

## 1. 工作原理

### 1.1 加密通信流程（AES-GCM）
1) 客户端请求加密：
- 基础 APIKey（32 字节）存放在 `sessionStorage['k']`
- 生成 13 位时间戳（`x-timestamp`）
- 动态 Key：`dynamicKey = MD5(baseApiKey + timestamp).toUpperCase()`
- 请求 IV：基于 `baseApiKey` 按 GMT+0 的星期几 `weekday(0-6)` 跳过对应数量字符后取 12 字节（若长度不足会重复拼接 baseApiKey 后再截取），作为 GCM 的 IV
- 使用 `dynamicKey + IV` 对请求 `data` 字段进行加密

2) 服务端响应解密：
- 从响应头 `x-timestamp`（或响应体 `timestamp|ts`）获取服务端时间戳 `serverTimestamp`
- 服务端动态 Key：`serverDynamic = MD5(baseApiKey + serverTimestamp).toUpperCase()`
- 解密 Key：将 `serverDynamic` 字符串反转得到 `decryptKey`
- 响应 IV：基于 `decryptKey` 按 GMT+0 的 `weekday(0-6)` 跳过对应数量字符后取 12 字节作为 IV
- 使用 `decryptKey + IV` 解密响应 `data`

说明：必须使用 GMT+0 的星期几来派生 IV，避免跨时区差异；AES 模式为 GCM（`x-crypto-mode: aes-gcm`）。

### 1.2 HTTP 请求头（由客户端自动设置）
```
x-user-account: [用户账号]
x-crypto-mode: aes-gcm
x-timestamp: [13位时间戳]
x-request-id: REQ_[timestamp]_[counter]
Content-Type: application/json
```

## 2. 依赖与加载顺序

在页面内按顺序引入：
```html
<script src="utils/jQuery_v3.js"></script>
<script src="utils/md5.js"></script>
<script src="utils/aes.js"></script>
<script src="utils/config.js"></script>
<script src="utils/sapi.js"></script>
```

> 说明：`config.js` 提供全局 `window.API_CONFIG`（见下文），`sapi.js` 会优先读取其中的 `BASE_URL` 与 `SIGN_MAP`。

## 3. 配置（utils/config.js）

`window.API_CONFIG` 支持以下字段：
- `BASE_URL`: 接口基础域名（默认值在 `config.js`，可被本地覆盖）
- `SIGN_MAP`: 接口 ID → 静态签名 的映射，例如：
   ```js
   window.API_CONFIG.SIGN_MAP = {
      'I00002': '00000C4D55921F91F6958FBE967FF7BE'
   };
   ```

覆盖方式（便于调试）：
- 本地覆盖 BASE_URL：`localStorage['BASE_URL'] = 'https://your-domain'`
- 本地覆盖 SIGN_MAP：`localStorage['SIGN_MAP'] = '{"I00002":"your-sign"}'`
- 当运行于 `localhost/127.0.0.1` 时，若未设置本地覆盖，`config.js` 会将 `BASE_URL` 自动指向 `window.location.origin` 以配合本地反向代理。

## 4. 使用方法

### 4.1 初始化 APIKey 与实例
```js
// 设备首次使用时写入 32 字节 Base APIKey（业务自定来源）
sessionStorage.setItem('k', '0123456789abcdef0123456789abcdef');

// 创建实例（userAccount 可省略，内部会从 sessionStorage['u'] 回退）
const api = createSuperAPI(/* userAccount? */);
```

### 4.2 发送请求（新签名）
`request(interfaceId, params, endpoint?, options?)`

```js
// 签名不再需要由调用方传入，自动从 window.API_CONFIG.SIGN_MAP[interfaceId] 读取
const data = await api.request('I00002', {
   userEmail,
   userPassword,
   loginIp,
   loginLocation,
   loginOs,
   loginStatus: 1,
   loginMsg: 'WEB LOGIN'
});

// endpoint 解析规则：
// 1) 省略 endpoint -> POST 到 `${BASE_URL}/supper-interface`
// 2) endpoint 为完整 URL（http/https// 或 //） -> 直接使用该 URL
// 3) endpoint 为相对路径 -> POST 到 `${BASE_URL}/supper-interface/${endpoint}`
```

返回值处理（已内置）：
- 若解密结果为 `{ status: 1, data }`，将自动提取 `data`
- 若 `data` 是数组且存在第 1 项，则返回 `data[0]`
- 其他情况，返回完整解密对象，交由业务层处理

错误处理：
- 内部网络错误或异常会 `throw`，且若全局存在 `ShowToast` 会自动弹提示

### 4.3 批量请求
```js
const results = await api.batchRequest([
   { interfaceId: 'I00002', params: { a: 1 } },
   { interfaceId: 'I00003', params: { b: 2 }, endpoint: 'extra/query' } // 相对路径示例
]);
```

### 4.4 高级配置（可选）
```js
// 运行时切换 BASE_URL（仅当前实例）
api.setBaseUrl('https://api.yourdomain.com');

// 全局参数（sapi.js 内部）
SAPI_CONFIG.TIMEOUT = 60000;     // 超时（ms）
SAPI_CONFIG.RETRY_TIMES = 3;     // 重试次数
SAPI_CONFIG.RETRY_DELAY = 1000;  // 重试延迟（ms）
```

## 5. 调试与联调

### 5.1 依赖自检
```js
console.log({
   jquery: typeof $ !== 'undefined',
   md5: typeof hex_md5_utf !== 'undefined' || typeof hex_md5 !== 'undefined' || typeof md5 !== 'undefined',
   aes: typeof Encrypt !== 'undefined' && typeof Decrypt !== 'undefined'
});
console.log('APIKey length:', (sessionStorage.getItem('k')||'').length);
```

### 5.2 Network 排查
- 检查请求是否发往 `${BASE_URL}/supper-interface`（或自定义 endpoint）
- 请求头中应包含：`x-timestamp`, `x-user-account`, `x-crypto-mode: aes-gcm`
- 响应头/体内应能拿到服务端时间戳（`x-timestamp` | `timestamp|ts`）

### 5.3 CORS / CSP
- 若本地 `file://` 打开页面，请使用本地静态服务器或反向代理，避免 CORS
- CSP 需允许 API 域名出现在 `connect-src`：
   - 例：`connect-src 'self' https://api.ice-markets-app.com`（可按需追加调试域名）

## 6. 常见问题（FAQ）

1) Base API key not found
- 未设置 `sessionStorage['k']` 或长度不为 32。设置后重试。

2) MD5 function not found
- `md5.js` 未加载或函数名不匹配。系统同时兼容 `hex_md5_utf` / `hex_md5` / `md5`。

3) 数据加密/解密失败
- 检查 Base APIKey、IV 生成（是否用 GMT+0 的 weekday）、服务端时间戳 `x-timestamp`。

4) 未从服务端获取时间戳
- 响应缺少 `x-timestamp` 与 `timestamp|ts` 字段。客户端将回退使用本地请求 timestamp（可能导致解密失败）。

## 7. 请求/响应格式

请求：
```json
{ "data": "加密后的字符串" }
```

成功响应（示例）：
```json
{
   "status": 1,
   "data": { "url": "/index.html", "status": true }
}
```

错误响应（示例）：
```json
{ "status": 0, "message": "错误信息", "code": "错误代码" }
```

> 成功时客户端会自动返回解密后的 `data`（数组时返回第一项）；否则返回完整对象。

---

附：快速示例（登录）
```js
// 初始化全站实例
window.superAPI = createSuperAPI();

// 发送登录
const data = await window.superAPI.request('I00002', {
   userEmail: sessionStorage['u'],
   userPassword: sessionStorage['p'],
   loginIp,
   loginLocation,
   loginOs,
   loginStatus: 1,
   loginMsg: 'WEB LOGIN'
});

// 成功后 data 为业务体（例如包含跳转 url）
if (data && data.status) {
   window.location.replace(data.url);
}
```