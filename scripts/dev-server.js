/**
 * Development Server
 * Express.js server with real-time compilation
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const SXML = require('../src/index');

class DevServer {
  constructor(options = {}) {
    this.options = {
      port: options.port || 3000,
      host: options.host || 'localhost',
      srcDir: options.srcDir || path.join(process.cwd(), 'src/templates'),
      publicDir: options.publicDir || path.join(process.cwd(), 'public'),
      secretKey: options.secretKey || 'dev-secret-key',
      ...options
    };

    this.app = express();
    this.sxml = new SXML({
      baseDir: process.cwd(),
      secretKey: this.options.secretKey
    });

    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    // Parse JSON bodies
    this.app.use(express.json());
    
    // Serve static files from public directory
    if (fs.existsSync(this.options.publicDir)) {
      this.app.use('/assets', express.static(this.options.publicDir));
    }

    // Logging middleware
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
      next();
    });
  }

  /**
   * Setup routes
   */
  setupRoutes() {
    // Home route
    this.app.get('/', (req, res) => {
      res.send(this.renderWelcomePage());
    });

    // Render SXML template
    this.app.get('/template/:name', (req, res) => {
      try {
        const templatePath = path.join(
          this.options.srcDir,
          `${req.params.name}.sxml`
        );

        if (!fs.existsSync(templatePath)) {
          return res.status(404).send('Template not found');
        }

        const html = this.sxml.renderWithResources(templatePath, req.query);
        res.send(html);
      } catch (e) {
        console.error('Error rendering template:', e);
        res.status(500).send(`Error rendering template: ${e.message}`);
      }
    });

    // API endpoint with encryption
    this.app.post('/api/encrypted', (req, res) => {
      try {
        const { payload, iv, tag, ts } = req.body;
        
        // Decrypt request
        const decrypted = this.sxml.encryption.decrypt({
          encrypted: payload,
          iv,
          authTag: tag,
          timestamp: ts
        });

        console.log('Decrypted request:', decrypted);

        // Process request (echo back for demo)
        const response = {
          success: true,
          message: 'Request processed successfully',
          data: decrypted,
          timestamp: Date.now()
        };

        // Encrypt response
        const encrypted = this.sxml.encryption.encryptAPIRequest(response);
        res.json(encrypted);
      } catch (e) {
        console.error('Error processing encrypted request:', e);
        res.status(500).json({ error: 'Decryption failed' });
      }
    });

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        framework: 'SXML',
        version: '1.0.0',
        uptime: process.uptime()
      });
    });
  }

  /**
   * Render welcome page
   * @returns {string} Welcome HTML
   */
  renderWelcomePage() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SXML Development Server</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 30px;
            backdrop-filter: blur(10px);
        }
        h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        .subtitle {
            font-size: 1.2em;
            opacity: 0.9;
            margin-bottom: 30px;
        }
        .features {
            list-style: none;
            padding: 0;
        }
        .features li {
            padding: 10px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        .features li:last-child {
            border-bottom: none;
        }
        .icon {
            margin-right: 10px;
        }
        .code {
            background: rgba(0, 0, 0, 0.3);
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 SXML Development Server</h1>
        <p class="subtitle">Web 3.0 Development Framework</p>
        
        <h2>Core Features</h2>
        <ul class="features">
            <li><span class="icon">📝</span> SXML Template Engine - Declarative template syntax</li>
            <li><span class="icon">⚡</span> Reactive System - ES6 Proxy-based auto UI updates</li>
            <li><span class="icon">🔒</span> AES-GCM Encryption - Secure API communication</li>
            <li><span class="icon">📦</span> Auto Resource Loading - Same-name CSS/JS/JSON</li>
            <li><span class="icon">🏗️</span> Precompilation - Zero runtime delay, SEO friendly</li>
        </ul>

        <h2>Quick Start</h2>
        <div class="code">
# Development mode<br>
npm run dev<br>
<br>
# Build for production<br>
npm run build
        </div>

        <h2>Server Info</h2>
        <ul class="features">
            <li>Port: ${this.options.port}</li>
            <li>Host: ${this.options.host}</li>
            <li>Status: Running ✓</li>
        </ul>
    </div>
</body>
</html>`;
  }

  /**
   * Start server
   */
  start() {
    this.app.listen(this.options.port, this.options.host, () => {
      console.log('\n╔════════════════════════════════════════╗');
      console.log('║   SXML Development Server Started      ║');
      console.log('╚════════════════════════════════════════╝\n');
      console.log(`🌐 Server running at http://${this.options.host}:${this.options.port}`);
      console.log(`📁 Template directory: ${this.options.srcDir}`);
      console.log(`📦 Public directory: ${this.options.publicDir}`);
      console.log('\nPress Ctrl+C to stop\n');
    });
  }
}

// Run server if called directly
if (require.main === module) {
  const server = new DevServer();
  server.start();
}

module.exports = DevServer;
