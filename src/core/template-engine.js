/**
 * SXML Template Engine
 * Declarative template syntax parser and renderer
 */

class SXMLEngine {
  constructor() {
    this.templates = new Map();
    this.cache = new Map();
  }

  /**
   * Parse SXML template syntax
   * @param {string} template - SXML template string
   * @returns {Function} Compiled template function
   */
  parse(template) {
    if (this.cache.has(template)) {
      return this.cache.get(template);
    }

    const compiled = this.compile(template);
    this.cache.set(template, compiled);
    return compiled;
  }

  /**
   * Compile SXML template to executable function
   * @param {string} template - SXML template string
   * @returns {Function} Compiled function
   */
  compile(template) {
    // Parse SXML directives: s-if, s-for, s-bind, s-on, etc.
    const ast = this.parseToAST(template);
    return this.generateFunction(ast);
  }

  /**
   * Parse template to Abstract Syntax Tree
   * @param {string} template - Template string
   * @returns {Object} AST representation
   */
  parseToAST(template) {
    const ast = {
      type: 'root',
      children: []
    };

    // Simple regex-based parser for SXML directives
    const directiveRegex = /s-(if|for|bind|on|text|html)="([^"]+)"/g;
    const interpolationRegex = /\{\{([^}]+)\}\}/g;

    ast.template = template;
    ast.directives = [];
    
    let match;
    while ((match = directiveRegex.exec(template)) !== null) {
      ast.directives.push({
        type: match[1],
        expression: match[2],
        position: match.index
      });
    }

    ast.interpolations = [];
    while ((match = interpolationRegex.exec(template)) !== null) {
      ast.interpolations.push({
        expression: match[1].trim(),
        position: match.index
      });
    }

    return ast;
  }

  /**
   * Generate executable function from AST
   * @param {Object} ast - Abstract Syntax Tree
   * @returns {Function} Render function
   */
  generateFunction(ast) {
    return (data) => {
      let result = ast.template;

      // Process interpolations
      ast.interpolations.forEach(interp => {
        const value = this.evaluateExpression(interp.expression, data);
        const placeholder = `{{${interp.expression}}}`;
        result = result.replace(placeholder, this.escapeHTML(String(value)));
      });

      return result;
    };
  }

  /**
   * Evaluate expression in context
   * @param {string} expr - Expression to evaluate
   * @param {Object} context - Data context
   * @returns {*} Expression result
   */
  evaluateExpression(expr, context) {
    try {
      const func = new Function(...Object.keys(context), `return ${expr}`);
      return func(...Object.values(context));
    } catch (e) {
      console.error(`Error evaluating expression: ${expr}`, e);
      return '';
    }
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  escapeHTML(str) {
    const div = { innerHTML: '' };
    const text = String(str);
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Render template with data
   * @param {string} template - Template string
   * @param {Object} data - Data object
   * @returns {string} Rendered HTML
   */
  render(template, data = {}) {
    const renderFn = this.parse(template);
    return renderFn(data);
  }

  /**
   * Register a named template
   * @param {string} name - Template name
   * @param {string} template - Template string
   */
  register(name, template) {
    this.templates.set(name, template);
  }

  /**
   * Render a named template
   * @param {string} name - Template name
   * @param {Object} data - Data object
   * @returns {string} Rendered HTML
   */
  renderNamed(name, data = {}) {
    const template = this.templates.get(name);
    if (!template) {
      throw new Error(`Template not found: ${name}`);
    }
    return this.render(template, data);
  }
}

module.exports = SXMLEngine;
