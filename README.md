# SXML - Web 3.0 Development Framework

<div align="center">

![SXML Logo](https://img.shields.io/badge/SXML-Web%203.0-purple?style=for-the-badge)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-green?style=for-the-badge)](https://nodejs.org)

A brand new development framework adapted to Web 3.0

</div>

## 🌟 Overview

本系统采用全新的 Web 3.0 开发模式，提供：

- **SXML 模板引擎** - 声明式模板语法
- **响应式数据系统** - 基于 ES6 Proxy 的自动 UI 更新
- **自动资源加载** - 同名 CSS/JS/JSON 自动加载
- **预编译构建** - 零运行时延迟，SEO 友好
- **加密通信** - AES-GCM 加密的 API 调用

## 🛠️ Technology Stack

- **模板引擎**: SXML (声明式模板语言)
- **响应式**: Proxy-based Reactive System
- **加密**: AES-GCM + MD5 动态密钥
- **构建工具**: Node.js 预编译脚本
- **开发服务器**: Express.js 实时编译

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/XujueKing/SXML.git
cd SXML

# Install dependencies
npm install
```

## 🚀 Quick Start

### Development Mode

Start the development server with real-time compilation:

```bash
npm run dev
```

The server will start at `http://localhost:3000`

### Build for Production

Precompile templates for zero runtime delay:

```bash
npm run build
```

Compiled files will be in the `dist/` directory.

### Run Tests

```bash
npm test
```

## 📖 Core Features

### 1. SXML Template Engine

Declarative template syntax with interpolation and directives:

```html
<!DOCTYPE html>
<html>
<head>
    <title>{{title}}</title>
</head>
<body>
    <h1>{{greeting}} {{name}}!</h1>
    <p>Count: {{count}}</p>
</body>
</html>
```

**Usage:**

```javascript
const SXML = require('./src/index');
const sxml = new SXML();

const html = sxml.render(template, {
    title: 'My App',
    greeting: 'Hello',
    name: 'World',
    count: 42
});
```

### 2. Reactive System

ES6 Proxy-based automatic UI updates:

```javascript
const sxml = new SXML();

// Create reactive data
const reactive = sxml.reactive;
const data = reactive.reactive({ count: 0 });

// Create effect that runs when data changes
reactive.effect(() => {
    console.log('Count:', data.count);
});

data.count++; // Automatically triggers effect
```

**Components:**

```javascript
const component = sxml.component({
    template: '<div>Count: {{count}}</div>',
    data: { count: 0 },
    methods: {
        increment() {
            this.data.count++;
        }
    }
});

component.render(); // Returns HTML
```

### 3. Encrypted API Communication

AES-GCM encryption with dynamic keys:

```javascript
const sxml = new SXML({ secretKey: 'your-secret-key' });
const api = sxml.createAPIClient();

// Make encrypted request
const response = await api.post('/api/data', {
    action: 'getData',
    params: { id: 123 }
});
```

**Server-side:**

```javascript
// Decrypt request
const decrypted = sxml.encryption.decrypt({
    encrypted: payload,
    iv: iv,
    authTag: tag,
    timestamp: ts
});

// Process and encrypt response
const encrypted = sxml.encryption.encryptAPIRequest(response);
```

### 4. Auto Resource Loading

Automatically loads CSS, JS, and JSON files with the same name as templates:

**File Structure:**
```
src/templates/
├── example.sxml    # Template
├── example.css     # Auto-loaded styles
├── example.js      # Auto-loaded scripts
└── example.json    # Auto-loaded data
```

**Usage:**

```javascript
const html = sxml.renderWithResources(
    'src/templates/example.sxml',
    { /* additional data */ }
);
// Automatically includes CSS, JS, and JSON data
```

### 5. Precompilation Build

Zero runtime delay with precompiled templates:

```javascript
const SXMLBuilder = require('./scripts/build');
const builder = new SXMLBuilder({
    srcDir: './src/templates',
    outDir: './dist'
});

builder.build();
```

**Benefits:**
- Zero runtime template parsing
- SEO-friendly static HTML
- Faster page loads
- Optimized assets

## 🏗️ Project Structure

```
SXML/
├── src/
│   ├── core/
│   │   ├── template-engine.js    # SXML template parser
│   │   └── reactive.js           # Reactive system
│   ├── utils/
│   │   ├── encryption.js         # AES-GCM encryption
│   │   └── resource-loader.js    # Auto resource loading
│   ├── templates/                # SXML templates
│   │   ├── example.sxml
│   │   ├── example.css
│   │   ├── example.js
│   │   └── example.json
│   └── index.js                  # Main entry point
├── scripts/
│   ├── build.js                  # Build script
│   ├── dev-server.js             # Development server
│   └── test.js                   # Test suite
├── public/                       # Static assets
│   ├── css/
│   └── js/
├── dist/                         # Build output
├── package.json
└── README.md
```

## 🔒 Security Features

### AES-256-GCM Encryption

- **Algorithm**: AES-256-GCM
- **Key Generation**: MD5-based dynamic keys
- **Key Rotation**: Automatic every minute
- **Authentication**: Built-in auth tags

### Example Encryption:

```javascript
const encryption = sxml.encryption;

// Encrypt data
const encrypted = encryption.encrypt({ secret: 'data' });
console.log(encrypted);
// {
//   encrypted: '...',
//   iv: '...',
//   authTag: '...',
//   timestamp: 1234567890
// }

// Decrypt data
const decrypted = encryption.decrypt(encrypted);
console.log(decrypted); // { secret: 'data' }
```

### Request Signing:

```javascript
// Sign request
const signature = encryption.sign({ data: 'value' });

// Verify signature
const isValid = encryption.verify({ data: 'value' }, signature);
```

## 📚 API Reference

### SXML Class

```javascript
const sxml = new SXML(options);
```

**Options:**
- `secretKey`: Encryption secret key
- `baseDir`: Base directory for templates
- `cache`: Enable/disable caching (default: true)

**Methods:**
- `render(template, data)`: Render template with data
- `renderWithResources(path, data)`: Render with auto-loaded resources
- `component(config)`: Create reactive component
- `createAPIClient()`: Create encrypted API client

### Template Engine

```javascript
const engine = sxml.templateEngine;
```

**Methods:**
- `parse(template)`: Parse template to function
- `render(template, data)`: Render template
- `register(name, template)`: Register named template
- `renderNamed(name, data)`: Render named template

### Reactive System

```javascript
const reactive = sxml.reactive;
```

**Methods:**
- `reactive(object, callback)`: Create reactive object
- `effect(fn)`: Create reactive effect
- `computed(getter)`: Create computed value
- `watch(getter, callback)`: Watch value changes
- `batch(fn)`: Batch multiple updates

### Encryption Util

```javascript
const encryption = sxml.encryption;
```

**Methods:**
- `encrypt(data, key)`: Encrypt data
- `decrypt(encrypted, key)`: Decrypt data
- `md5(data)`: Generate MD5 hash
- `sign(data, secret)`: Sign data
- `verify(data, signature, secret)`: Verify signature
- `encryptAPIRequest(data)`: Encrypt API request
- `decryptAPIResponse(response)`: Decrypt API response

## 🧪 Testing

Run the test suite:

```bash
npm test
```

**Test Coverage:**
- Template engine interpolation
- Reactive system tracking
- Encryption/decryption
- Component rendering
- API encryption

## 🎯 Examples

### Example 1: Simple Counter

```javascript
const sxml = new SXML();

const component = sxml.component({
    template: `
        <div>
            <h1>Counter: {{count}}</h1>
            <button onclick="increment()">+</button>
        </div>
    `,
    data: { count: 0 },
    methods: {
        increment() {
            this.data.count++;
        }
    }
});

const html = component.render();
```

### Example 2: Encrypted API Call

```javascript
const sxml = new SXML({ secretKey: 'my-secret' });
const api = sxml.createAPIClient();

// Client-side
const result = await api.post('/api/users', {
    action: 'create',
    user: { name: 'John' }
});

// Server-side handler
app.post('/api/users', (req, res) => {
    const data = sxml.encryption.decryptAPIResponse(req.body);
    // Process data...
    const response = sxml.encryption.encryptAPIRequest({ success: true });
    res.json(response);
});
```

### Example 3: Template with Resources

Create these files:

**example.sxml:**
```html
<div class="container">
    <h1>{{title}}</h1>
</div>
```

**example.css:**
```css
.container { padding: 20px; }
```

**example.js:**
```javascript
console.log('Loaded!');
```

**example.json:**
```json
{ "title": "Hello SXML" }
```

**Render:**
```javascript
const html = sxml.renderWithResources('example.sxml');
// Automatically includes CSS, JS, and JSON data
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- [GitHub Repository](https://github.com/XujueKing/SXML)
- [Documentation](https://github.com/XujueKing/SXML/wiki)
- [Issue Tracker](https://github.com/XujueKing/SXML/issues)

## 📧 Contact

For questions and support, please open an issue on GitHub.

---

<div align="center">

**Built with ❤️ for Web 3.0**

</div>
