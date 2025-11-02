# 后端 CORS 配置示例

**重要：** 后端必须允许以下自定义请求头：
- `x-crypto-mode` - 加密模式标识
- `x-user-account` - 用户账号
- `x-timestamp` - 时间戳
- `x-request-id` - 请求ID

⚠️ **注意**：将示例中的 `{{YOUR_DOMAIN}}` 和 `{{YOUR_API_DOMAIN}}` 替换为您的实际域名。

## Node.js (Express)
```javascript
const cors = require('cors');

app.use(cors({
  origin: 'https://{{YOUR_DOMAIN}}',  // ⭐ 替换为您的前端域名
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'x-user-account', 
    'x-crypto-mode',     // 必须添加
    'x-timestamp',       // 必须添加
    'x-request-id'       // 必须添加
  ]
}));

// 或者直接允许所有请求头（开发测试用）
app.use(cors({
  origin: 'https://{{YOUR_DOMAIN}}',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: '*'
}));
```

## Spring Boot (Java)
```java
@Configuration
public class CorsConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                    .allowedOrigins("https://{{YOUR_DOMAIN}}")  // ⭐ 替换为您的前端域名
                    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                    .allowedHeaders("*")
                    .allowCredentials(true);
            }
        };
    }
}
```

## PHP
```php
header('Access-Control-Allow-Origin: https://{{YOUR_DOMAIN}}');  // ⭐ 替换为您的前端域名
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, x-user-account, x-crypto-mode, x-timestamp, x-request-id');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
```

## Nginx (在 API 服务器配置)
```nginx
server {
    listen 443 ssl;
    server_name {{YOUR_API_DOMAIN}};  # ⭐ 替换为您的 API 域名
    
    location / {
        add_header 'Access-Control-Allow-Origin' 'https://{{YOUR_DOMAIN}}' always;  # ⭐ 替换为您的前端域名
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type, x-user-account, x-crypto-mode, x-timestamp, x-request-id' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
        
        # 你的后端应用
        proxy_pass http://localhost:8080;
    }
}
```

