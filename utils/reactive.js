/**
 * 轻量级响应式数据系统
 * 基于 Proxy 实现数据劫持和依赖收集
 * 提供 reactive()、watch()、computed() API
 */
(function(global) {
  'use strict';

  // 当前正在执行的effect（用于依赖收集）
  let activeEffect = null;
  const effectStack = [];

  // 依赖映射：target -> key -> Set<effect>
  const targetMap = new WeakMap();

  /**
   * 依赖收集：记录当前 effect 依赖了哪个对象的哪个属性
   */
  function track(target, key) {
    if (!activeEffect) return;
    
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      depsMap = new Map();
      targetMap.set(target, depsMap);
    }
    
    let dep = depsMap.get(key);
    if (!dep) {
      dep = new Set();
      depsMap.set(key, dep);
    }
    
    dep.add(activeEffect);
  }

  /**
   * 触发更新：当数据变化时，执行所有依赖该数据的 effect
   */
  function trigger(target, key) {
    const depsMap = targetMap.get(target);
    if (!depsMap) return;
    
    const dep = depsMap.get(key);
    if (!dep) return;
    
    // 复制一份避免循环引用
    const effects = [...dep];
    effects.forEach(effect => {
      if (effect.scheduler) {
        effect.scheduler();
      } else {
        effect();
      }
    });
  }

  /**
   * 创建响应式对象
   */
  function reactive(target) {
    if (!target || typeof target !== 'object') {
      console.warn('reactive() only accepts objects');
      return target;
    }

    // 如果已经是代理对象，直接返回
    if (target.__isReactive) {
      return target;
    }

    const handler = {
      get(target, key, receiver) {
        // 标记为响应式对象
        if (key === '__isReactive') {
          return true;
        }
        
        // 依赖收集
        track(target, key);
        
        const result = Reflect.get(target, key, receiver);
        
        // 嵌套对象也转为响应式
        if (result && typeof result === 'object') {
          return reactive(result);
        }
        
        return result;
      },
      
      set(target, key, value, receiver) {
        const oldValue = target[key];
        const result = Reflect.set(target, key, value, receiver);
        
        // 值变化时触发更新
        if (oldValue !== value) {
          trigger(target, key);
        }
        
        return result;
      },
      
      deleteProperty(target, key) {
        const hadKey = Object.prototype.hasOwnProperty.call(target, key);
        const result = Reflect.deleteProperty(target, key);
        
        if (hadKey && result) {
          trigger(target, key);
        }
        
        return result;
      }
    };

    return new Proxy(target, handler);
  }

  /**
   * 监听数据变化
   * @param {Function} fn - 监听函数，访问的响应式数据会被自动收集
   * @param {Object} options - 配置选项
   */
  function watch(fn, options = {}) {
    const effect = () => {
      try {
        effectStack.push(effect);
        activeEffect = effect;
        return fn();
      } finally {
        effectStack.pop();
        activeEffect = effectStack[effectStack.length - 1] || null;
      }
    };

    // 支持调度器（延迟执行、批量更新等）
    if (options.scheduler) {
      effect.scheduler = options.scheduler;
    }

    // 立即执行一次，收集依赖
    if (options.immediate !== false) {
      effect();
    }

    // 返回停止监听的函数
    return function stop() {
      targetMap.forEach(depsMap => {
        depsMap.forEach(dep => {
          dep.delete(effect);
        });
      });
    };
  }

  /**
   * 计算属性
   * @param {Function} getter - 计算函数
   */
  function computed(getter) {
    let value;
    let dirty = true; // 是否需要重新计算
    const subscribers = new Set(); // 订阅该计算属性的 effect

    const effect = () => {
      try {
        effectStack.push(effect);
        activeEffect = effect;
        value = getter();
        dirty = false;
      } finally {
        effectStack.pop();
        activeEffect = effectStack[effectStack.length - 1] || null;
      }
    };

    effect.scheduler = () => {
      if (!dirty) {
        dirty = true;
        // 通知订阅者
        subscribers.forEach(sub => {
          if (sub.scheduler) {
            sub.scheduler();
          } else {
            sub();
          }
        });
      }
    };

    // 初始计算
    effect();

    return {
      get value() {
        // 收集依赖：谁在读取这个计算属性
        if (activeEffect && !subscribers.has(activeEffect)) {
          subscribers.add(activeEffect);
        }
        
        if (dirty) {
          effect();
        }
        return value;
      }
    };
  }

  /**
   * 批量更新调度器（防抖）
   */
  function createScheduler() {
    const queue = new Set();
    let isFlushing = false;

    return function scheduler(job) {
      queue.add(job);
      
      if (!isFlushing) {
        isFlushing = true;
        Promise.resolve().then(() => {
          queue.forEach(j => j());
          queue.clear();
          isFlushing = false;
        });
      }
    };
  }

  // 暴露到全局
  global.Reactive = {
    reactive,
    watch,
    computed,
    createScheduler
  };

  // 同时暴露便捷别名，供现有代码直接使用
  global.reactive = reactive;
  global.watch = watch;
  global.computed = computed;

  // 兼容旧版本浏览器的提示
  if (typeof Proxy === 'undefined') {
    console.error('Reactive system requires Proxy support. Please use a modern browser.');
  }

})(window);
