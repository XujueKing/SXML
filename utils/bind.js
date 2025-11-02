/**
 * 视图绑定模块
 * 提供声明式指令（v-model, v-text, v-show, v-if 等）
 * 实现数据与 DOM 的双向绑定
 */
(function(global) {
  'use strict';

  if (!global.Reactive) {
    console.error('Bind module requires Reactive module. Please load reactive.js first.');
    return;
  }

  const { reactive, watch } = global.Reactive;

  /**
   * 解析表达式路径，支持嵌套属性访问
   * 例如: "user.name" => state.user.name
   */
  function getValueByPath(obj, path) {
    const keys = path.split('.');
    let result = obj;
    for (const key of keys) {
      if (result && typeof result === 'object') {
        result = result[key];
      } else {
        return undefined;
      }
    }
    return result;
  }

  function setValueByPath(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let target = obj;
    
    for (const key of keys) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
      }
      target = target[key];
    }
    
    target[lastKey] = value;
  }

  /**
   * 指令处理器
   */
  const directives = {
    // v-model: 双向绑定
    model(el, binding, state) {
      const { expression } = binding;
      
      // 数据 -> 视图
      watch(() => {
        const value = getValueByPath(state, expression);
        if (el.type === 'checkbox') {
          el.checked = !!value;
        } else if (el.type === 'radio') {
          el.checked = el.value === value;
        } else {
          el.value = value == null ? '' : value;
        }
      });
      
      // 视图 -> 数据
      const eventType = el.type === 'checkbox' || el.type === 'radio' ? 'change' : 'input';
      el.addEventListener(eventType, (e) => {
        let newValue;
        if (el.type === 'checkbox') {
          newValue = el.checked;
        } else if (el.type === 'radio') {
          newValue = el.value;
        } else if (el.type === 'number') {
          // 数字输入框：转换为数字类型
          newValue = el.value === '' ? '' : Number(el.value);
        } else {
          newValue = el.value;
        }
        setValueByPath(state, expression, newValue);
      });
    },

    // v-text: 文本内容绑定
    text(el, binding, state) {
      const { expression } = binding;
      watch(() => {
        const value = getValueByPath(state, expression);
        el.textContent = value == null ? '' : value;
      });
    },

    // v-html: HTML 内容绑定
    html(el, binding, state) {
      const { expression } = binding;
      watch(() => {
        const value = getValueByPath(state, expression);
        el.innerHTML = value == null ? '' : value;
      });
    },

    // v-show: 显示/隐藏（通过 display）
    show(el, binding, state) {
      const { expression } = binding;
      const originalDisplay = el.style.display || '';
      
      watch(() => {
        const value = getValueByPath(state, expression);
        el.style.display = value ? originalDisplay : 'none';
      });
    },

    // v-if: 条件渲染（移除/添加 DOM）
    if(el, binding, state) {
      const { expression } = binding;
      const placeholder = document.createComment(`v-if: ${expression}`);
      const parent = el.parentNode;
      
      let currentElement = el;
      
      watch(() => {
        const value = getValueByPath(state, expression);
        
        if (value) {
          // 需要显示
          if (currentElement !== el) {
            parent.replaceChild(el, placeholder);
            currentElement = el;
          }
        } else {
          // 需要隐藏
          if (currentElement === el) {
            parent.replaceChild(placeholder, el);
            currentElement = placeholder;
          }
        }
      });
    },

    // v-class: 动态类名绑定
    class(el, binding, state) {
      const { expression } = binding;
      watch(() => {
        const value = getValueByPath(state, expression);
        
        if (typeof value === 'string') {
          el.className = value;
        } else if (typeof value === 'object') {
          // 对象形式：{ active: true, disabled: false }
          Object.keys(value).forEach(className => {
            if (value[className]) {
              el.classList.add(className);
            } else {
              el.classList.remove(className);
            }
          });
        }
      });
    },

    // v-style: 动态样式绑定
    style(el, binding, state) {
      const { expression } = binding;
      watch(() => {
        const value = getValueByPath(state, expression);
        
        if (typeof value === 'object') {
          Object.keys(value).forEach(prop => {
            el.style[prop] = value[prop];
          });
        }
      });
    },

    // v-on: 事件绑定（简化版，建议直接用 @ 或 onclick）
    on(el, binding, state, app) {
      const { arg, expression } = binding; // arg 是事件名，如 'click'
      
      if (!arg) {
        console.warn('v-on requires an event name, e.g., v-on:click="handleClick"');
        return;
      }
      
      // 从 app 方法中查找处理函数
      const handler = app.methods && app.methods[expression];
      if (typeof handler === 'function') {
        el.addEventListener(arg, (e) => handler.call(app, e, state));
      } else {
        console.warn(`Method "${expression}" not found in app.methods`);
      }
    }
  };

  /**
   * 解析指令属性
   */
  function parseDirective(attrName) {
    // v-model, v-text, v-show, v-if, v-on:click 等
    const match = attrName.match(/^v-([a-z]+)(?::(.+))?$/);
    if (!match) return null;
    
    return {
      name: match[1],    // 指令名
      arg: match[2]      // 参数（如 v-on:click 中的 click）
    };
  }

  /**
   * 编译 DOM 树，绑定指令
   */
  function compile(root, state, app) {
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT,
      null,
      false
    );

    const elements = [root];
    let currentNode;
    
    while ((currentNode = walker.nextNode())) {
      elements.push(currentNode);
    }

    elements.forEach(el => {
      const attrs = Array.from(el.attributes || []);
      
      attrs.forEach(attr => {
        const directive = parseDirective(attr.name);
        
        if (directive) {
          const handler = directives[directive.name];
          
          if (handler) {
            handler(el, {
              name: directive.name,
              arg: directive.arg,
              expression: attr.value
            }, state, app);
            
            // 移除指令属性（可选，保留方便调试）
            // el.removeAttribute(attr.name);
          } else {
            console.warn(`Unknown directive: v-${directive.name}`);
          }
        }
      });
    });
  }

  /**
   * 创建应用实例
   */
  function createApp(options) {
    const { el, data, methods, computed: computedOptions } = options;
    
    // 创建响应式状态
    const state = reactive(data || {});
    
    // 计算属性
    if (computedOptions) {
      Object.keys(computedOptions).forEach(key => {
        const computedProp = global.Reactive.computed(() => computedOptions[key].call({ state }));
        
        // 支持嵌套路径，如 'order.total'
        if (key.includes('.')) {
          const keys = key.split('.');
          const lastKey = keys.pop();
          let target = state;
          
          // 确保嵌套对象存在
          for (const k of keys) {
            if (!target[k] || typeof target[k] !== 'object') {
              target[k] = reactive({});
            }
            target = target[k];
          }
          
          // 在目标对象上定义计算属性
          Object.defineProperty(target, lastKey, {
            get() {
              return computedProp.value;
            },
            enumerable: true,
            configurable: true
          });
        } else {
          // 简单属性直接定义在 state 上
          Object.defineProperty(state, key, {
            get() {
              return computedProp.value;
            },
            enumerable: true,
            configurable: true
          });
        }
      });
    }
    
    // 应用实例
    const app = {
      state,
      methods: {},
      mount(selector) {
        const root = typeof selector === 'string' 
          ? document.querySelector(selector) 
          : selector;
        
        if (!root) {
          console.error(`Mount target not found: ${selector}`);
          return;
        }
        
        // 编译模板
        compile(root, state, app);
        
        return app;
      }
    };

    // 绑定 methods 到应用实例，确保 this 指向 app
    if (methods) {
      Object.keys(methods).forEach(key => {
        if (typeof methods[key] === 'function') {
          const bound = methods[key].bind(app);
          app.methods[key] = bound;
          // 兼容 this.renderTasks() 这种在方法里直接调用的写法
          app[key] = bound;
        }
      });
    }
    
    // 自动挂载
    if (el) {
      app.mount(el);
    }
    
    return app;
  }

  // 暴露到全局
  global.Bind = {
    createApp,
    directives
  };

})(window);
