/**
 * Build Script
 * Precompiles SXML templates for zero runtime delay
 */

const fs = require('fs');
const path = require('path');
const SXML = require('../src/index');

class SXMLBuilder {
  constructor(options = {}) {
    this.options = {
      srcDir: options.srcDir || path.join(process.cwd(), 'src/templates'),
      outDir: options.outDir || path.join(process.cwd(), 'dist'),
      publicDir: options.publicDir || path.join(process.cwd(), 'public'),
      ...options
    };

    this.sxml = new SXML({
      baseDir: process.cwd(),
      secretKey: options.secretKey
    });
  }

  /**
   * Find all SXML template files
   * @param {string} dir - Directory to search
   * @returns {Array<string>} Template file paths
   */
  findTemplates(dir) {
    const templates = [];
    
    if (!fs.existsSync(dir)) {
      console.warn(`Template directory not found: ${dir}`);
      return templates;
    }

    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        templates.push(...this.findTemplates(filePath));
      } else if (file.endsWith('.sxml') || file.endsWith('.html')) {
        templates.push(filePath);
      }
    });

    return templates;
  }

  /**
   * Compile a single template
   * @param {string} templatePath - Path to template file
   * @returns {Object} Compilation result
   */
  compileTemplate(templatePath) {
    console.log(`Compiling: ${templatePath}`);
    
    const template = fs.readFileSync(templatePath, 'utf8');
    const resources = this.sxml.resourceLoader.loadAll(templatePath);
    
    // Generate precompiled output
    const compiled = {
      template,
      css: resources.css || '',
      js: resources.js || '',
      data: resources.data || {}
    };

    // Create static HTML
    const html = this.generateStaticHTML(compiled);

    return {
      source: templatePath,
      compiled,
      html
    };
  }

  /**
   * Generate static HTML from compiled template
   * @param {Object} compiled - Compiled template object
   * @returns {string} Static HTML
   */
  generateStaticHTML(compiled) {
    let html = compiled.template;

    // Inject CSS
    if (compiled.css) {
      const cssTag = `<style>\n${compiled.css}\n</style>`;
      if (html.includes('</head>')) {
        html = html.replace('</head>', `${cssTag}\n</head>`);
      } else {
        html = `<!DOCTYPE html>\n<html>\n<head>\n${cssTag}\n</head>\n<body>\n${html}\n</body>\n</html>`;
      }
    }

    // Inject JS
    if (compiled.js) {
      const jsTag = `<script>\n${compiled.js}\n</script>`;
      if (html.includes('</body>')) {
        html = html.replace('</body>', `${jsTag}\n</body>`);
      } else {
        html = `${html}\n${jsTag}`;
      }
    }

    return html;
  }

  /**
   * Build all templates
   */
  build() {
    console.log('Starting SXML build...');
    console.log(`Source: ${this.options.srcDir}`);
    console.log(`Output: ${this.options.outDir}`);

    // Create output directory
    if (!fs.existsSync(this.options.outDir)) {
      fs.mkdirSync(this.options.outDir, { recursive: true });
    }

    // Find and compile templates
    const templates = this.findTemplates(this.options.srcDir);
    console.log(`Found ${templates.length} templates`);

    const results = [];
    templates.forEach(templatePath => {
      try {
        const result = this.compileTemplate(templatePath);
        results.push(result);

        // Write compiled HTML
        const relativePath = path.relative(this.options.srcDir, templatePath);
        const outPath = path.join(
          this.options.outDir,
          relativePath.replace(/\.(sxml|html)$/, '.html')
        );
        
        // Create output directory if needed
        const outDir = path.dirname(outPath);
        if (!fs.existsSync(outDir)) {
          fs.mkdirSync(outDir, { recursive: true });
        }

        fs.writeFileSync(outPath, result.html);
        console.log(`  ✓ ${relativePath} -> ${path.relative(process.cwd(), outPath)}`);
      } catch (e) {
        console.error(`  ✗ Error compiling ${templatePath}:`, e.message);
      }
    });

    // Copy public assets
    this.copyPublicAssets();

    console.log('\nBuild complete!');
    console.log(`Output directory: ${this.options.outDir}`);
    
    return results;
  }

  /**
   * Copy public assets to dist
   */
  copyPublicAssets() {
    if (!fs.existsSync(this.options.publicDir)) {
      return;
    }

    const publicOut = path.join(this.options.outDir, 'assets');
    if (!fs.existsSync(publicOut)) {
      fs.mkdirSync(publicOut, { recursive: true });
    }

    // Copy CSS and JS directories
    ['css', 'js'].forEach(type => {
      const srcDir = path.join(this.options.publicDir, type);
      const destDir = path.join(publicOut, type);
      
      if (fs.existsSync(srcDir)) {
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        
        const files = fs.readdirSync(srcDir);
        files.forEach(file => {
          const srcFile = path.join(srcDir, file);
          const destFile = path.join(destDir, file);
          
          if (fs.statSync(srcFile).isFile()) {
            fs.copyFileSync(srcFile, destFile);
          }
        });
      }
    });
  }
}

// Run build if called directly
if (require.main === module) {
  const builder = new SXMLBuilder();
  builder.build();
}

module.exports = SXMLBuilder;
