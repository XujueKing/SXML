/**
 * SXML Framework Main Entry
 * Combines all core components
 */

const SXMLEngine = require('./core/template-engine');
const ReactiveSystem = require('./core/reactive');
const EncryptionUtil = require('./utils/encryption');
const ResourceLoader = require('./utils/resource-loader');

class SXML {
  constructor(options = {}) {
    this.options = {
      secretKey: options.secretKey || 'sxml-default-secret',
      baseDir: options.baseDir || process.cwd(),
      cache: options.cache !== false,
      ...options
    };

    // Initialize core components
    this.templateEngine = new SXMLEngine();
    this.reactive = new ReactiveSystem();
    this.encryption = new EncryptionUtil(this.options.secretKey);
    this.resourceLoader = new ResourceLoader(this.options.baseDir);
  }

  /**
   * Create a reactive component
   * @param {Object} config - Component configuration
   * @returns {Object} Component instance
   */
  component(config) {
    const { template, data = {}, methods = {}, computed = {} } = config;

    // Create reactive data
    const reactiveData = this.reactive.reactive(data, () => {
      if (component.update) {
        component.update();
      }
    });

    // Create component instance
    const component = {
      data: reactiveData,
      methods: {},
      computed: {},
      template,

      /**
       * Render component
       * @returns {string} Rendered HTML
       */
      render() {
        const context = {
          ...this.data,
          ...this.methods,
          ...this.computed
        };
        return this.templateEngine.render(this.template, context);
      },

      /**
       * Update component
       */
      update() {
        if (this.onUpdate) {
          this.onUpdate(this.render());
        }
      },

      /**
       * Mount component to DOM element
       * @param {string} selector - DOM selector
       */
      mount(selector) {
        if (typeof document !== 'undefined') {
          const el = document.querySelector(selector);
          if (el) {
            el.innerHTML = this.render();
            this.onUpdate = (html) => {
              el.innerHTML = html;
            };
          }
        }
      }
    };

    // Bind methods to component context
    Object.keys(methods).forEach(key => {
      component.methods[key] = methods[key].bind(component);
    });

    // Setup computed properties
    Object.keys(computed).forEach(key => {
      const computedProp = this.reactive.computed(() => {
        return computed[key].call(component);
      });
      component.computed[key] = computedProp.value;
    });

    component.templateEngine = this.templateEngine;
    return component;
  }

  /**
   * Create encrypted API client
   * @returns {Object} API client
   */
  createAPIClient() {
    const encryption = this.encryption;

    return {
      /**
       * Make encrypted API request
       * @param {string} url - API URL
       * @param {Object} data - Request data
       * @param {Object} options - Request options
       * @returns {Promise<Object>} Response data
       */
      async request(url, data = {}, options = {}) {
        const encrypted = encryption.encryptAPIRequest(data);
        
        const response = await fetch(url, {
          method: options.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          },
          body: JSON.stringify(encrypted)
        });

        const encryptedResponse = await response.json();
        return encryption.decryptAPIResponse(encryptedResponse);
      },

      /**
       * GET request
       * @param {string} url - API URL
       * @param {Object} params - Query parameters
       * @returns {Promise<Object>} Response data
       */
      async get(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(fullUrl, {}, { method: 'GET' });
      },

      /**
       * POST request
       * @param {string} url - API URL
       * @param {Object} data - Request data
       * @returns {Promise<Object>} Response data
       */
      async post(url, data = {}) {
        return this.request(url, data, { method: 'POST' });
      }
    };
  }

  /**
   * Parse and render SXML template
   * @param {string} template - Template string
   * @param {Object} data - Template data
   * @returns {string} Rendered HTML
   */
  render(template, data = {}) {
    return this.templateEngine.render(template, data);
  }

  /**
   * Load and render template with auto-resources
   * @param {string} templatePath - Path to template file
   * @param {Object} data - Template data
   * @returns {string} Rendered HTML with resources
   */
  renderWithResources(templatePath, data = {}) {
    const fs = require('fs');
    const template = fs.readFileSync(templatePath, 'utf8');
    const rendered = this.render(template, data);
    return this.resourceLoader.injectResources(templatePath, rendered);
  }
}

module.exports = SXML;
