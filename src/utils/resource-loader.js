/**
 * Auto Resource Loader
 * Automatically loads CSS/JS/JSON files with the same name as template
 */

const fs = require('fs');
const path = require('path');

class ResourceLoader {
  constructor(baseDir = process.cwd()) {
    this.baseDir = baseDir;
    this.cache = new Map();
    this.publicDir = path.join(baseDir, 'public');
  }

  /**
   * Get resource path for a template
   * @param {string} templatePath - Path to template file
   * @param {string} extension - Resource extension (css, js, json)
   * @returns {string|null} Resource path or null if not found
   */
  getResourcePath(templatePath, extension) {
    const baseName = path.basename(templatePath, path.extname(templatePath));
    const dirName = path.dirname(templatePath);
    
    // Try multiple possible locations
    const possiblePaths = [
      path.join(dirName, `${baseName}.${extension}`),
      path.join(this.publicDir, extension, `${baseName}.${extension}`),
      path.join(this.publicDir, `${baseName}.${extension}`)
    ];

    for (const resourcePath of possiblePaths) {
      if (fs.existsSync(resourcePath)) {
        return resourcePath;
      }
    }

    return null;
  }

  /**
   * Load CSS file for a template
   * @param {string} templatePath - Path to template file
   * @returns {string|null} CSS content or null
   */
  loadCSS(templatePath) {
    const cacheKey = `css:${templatePath}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const cssPath = this.getResourcePath(templatePath, 'css');
    if (!cssPath) {
      return null;
    }

    try {
      const content = fs.readFileSync(cssPath, 'utf8');
      this.cache.set(cacheKey, content);
      return content;
    } catch (e) {
      console.error(`Error loading CSS: ${cssPath}`, e);
      return null;
    }
  }

  /**
   * Load JS file for a template
   * @param {string} templatePath - Path to template file
   * @returns {string|null} JS content or null
   */
  loadJS(templatePath) {
    const cacheKey = `js:${templatePath}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const jsPath = this.getResourcePath(templatePath, 'js');
    if (!jsPath) {
      return null;
    }

    try {
      const content = fs.readFileSync(jsPath, 'utf8');
      this.cache.set(cacheKey, content);
      return content;
    } catch (e) {
      console.error(`Error loading JS: ${jsPath}`, e);
      return null;
    }
  }

  /**
   * Load JSON data for a template
   * @param {string} templatePath - Path to template file
   * @returns {Object|null} Parsed JSON or null
   */
  loadJSON(templatePath) {
    const cacheKey = `json:${templatePath}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const jsonPath = this.getResourcePath(templatePath, 'json');
    if (!jsonPath) {
      return null;
    }

    try {
      const content = fs.readFileSync(jsonPath, 'utf8');
      const data = JSON.parse(content);
      this.cache.set(cacheKey, data);
      return data;
    } catch (e) {
      console.error(`Error loading JSON: ${jsonPath}`, e);
      return null;
    }
  }

  /**
   * Load all resources for a template
   * @param {string} templatePath - Path to template file
   * @returns {Object} Object with css, js, and data properties
   */
  loadAll(templatePath) {
    return {
      css: this.loadCSS(templatePath),
      js: this.loadJS(templatePath),
      data: this.loadJSON(templatePath)
    };
  }

  /**
   * Generate HTML with auto-loaded resources
   * @param {string} templatePath - Path to template file
   * @param {string} content - Template content
   * @returns {string} HTML with injected resources
   */
  injectResources(templatePath, content) {
    const resources = this.loadAll(templatePath);
    let html = content;

    // Inject CSS
    if (resources.css) {
      const cssTag = `<style>\n${resources.css}\n</style>`;
      html = html.replace('</head>', `${cssTag}\n</head>`);
      if (!html.includes('</head>')) {
        html = `${cssTag}\n${html}`;
      }
    }

    // Inject JS
    if (resources.js) {
      const jsTag = `<script>\n${resources.js}\n</script>`;
      html = html.replace('</body>', `${jsTag}\n</body>`);
      if (!html.includes('</body>')) {
        html = `${html}\n${jsTag}`;
      }
    }

    return html;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Watch for file changes and update cache
   * @param {string} templatePath - Path to template file
   * @param {Function} callback - Callback on change
   */
  watch(templatePath, callback) {
    const baseName = path.basename(templatePath, path.extname(templatePath));
    const extensions = ['css', 'js', 'json'];

    extensions.forEach(ext => {
      const resourcePath = this.getResourcePath(templatePath, ext);
      if (resourcePath && fs.existsSync(resourcePath)) {
        fs.watch(resourcePath, (eventType) => {
          if (eventType === 'change') {
            const cacheKey = `${ext}:${templatePath}`;
            this.cache.delete(cacheKey);
            if (callback) {
              callback(ext, resourcePath);
            }
          }
        });
      }
    });
  }
}

module.exports = ResourceLoader;
