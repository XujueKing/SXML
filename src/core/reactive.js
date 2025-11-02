/**
 * Reactive System
 * ES6 Proxy-based automatic UI update system
 */

class ReactiveSystem {
  constructor() {
    this.observers = new WeakMap();
    this.currentEffect = null;
    this.effectStack = [];
  }

  /**
   * Create a reactive object with ES6 Proxy
   * @param {Object} target - Target object to make reactive
   * @param {Function} callback - Callback for updates
   * @returns {Proxy} Reactive proxy object
   */
  reactive(target, callback = null) {
    if (typeof target !== 'object' || target === null) {
      return target;
    }

    // If already reactive, return as is
    if (this.observers.has(target)) {
      return target;
    }

    const deps = new Map();
    this.observers.set(target, deps);

    const self = this;
    const handler = {
      get(obj, prop) {
        // Track dependency
        self.track(deps, prop);
        const value = obj[prop];
        
        // Make nested objects reactive
        if (typeof value === 'object' && value !== null) {
          return self.reactive(value, callback);
        }
        
        return value;
      },

      set(obj, prop, value) {
        const oldValue = obj[prop];
        
        // Only update if value changed
        if (oldValue !== value) {
          obj[prop] = value;
          
          // Trigger update
          self.trigger(deps, prop);
          
          // Call global callback if provided
          if (callback) {
            callback(prop, value, oldValue);
          }
        }
        
        return true;
      },

      deleteProperty(obj, prop) {
        if (prop in obj) {
          delete obj[prop];
          self.trigger(deps, prop);
        }
        return true;
      }
    };

    return new Proxy(target, handler);
  }

  /**
   * Track dependency for current effect
   * @param {Map} deps - Dependencies map
   * @param {string} key - Property key
   */
  track(deps, key) {
    if (this.currentEffect) {
      if (!deps.has(key)) {
        deps.set(key, new Set());
      }
      deps.get(key).add(this.currentEffect);
    }
  }

  /**
   * Trigger effects for a property
   * @param {Map} deps - Dependencies map
   * @param {string} key - Property key
   */
  trigger(deps, key) {
    const effects = deps.get(key);
    if (effects) {
      effects.forEach(effect => {
        if (effect !== this.currentEffect) {
          effect();
        }
      });
    }
  }

  /**
   * Create an effect that runs when dependencies change
   * @param {Function} fn - Effect function
   * @returns {Function} Stop function
   */
  effect(fn) {
    const effectFn = () => {
      this.currentEffect = effectFn;
      this.effectStack.push(effectFn);
      
      try {
        fn();
      } finally {
        this.effectStack.pop();
        this.currentEffect = this.effectStack[this.effectStack.length - 1] || null;
      }
    };

    // Run effect immediately
    effectFn();

    // Return stop function
    return () => {
      // Remove effect from all dependencies
      this.observers.forEach(deps => {
        deps.forEach(effects => {
          effects.delete(effectFn);
        });
      });
    };
  }

  /**
   * Create a computed value
   * @param {Function} getter - Getter function
   * @returns {Object} Computed value object
   */
  computed(getter) {
    let value;
    let dirty = true;

    const computedEffect = this.effect(() => {
      if (dirty) {
        value = getter();
        dirty = false;
      }
    });

    return {
      get value() {
        if (dirty) {
          value = getter();
          dirty = false;
        }
        return value;
      },
      effect: computedEffect
    };
  }

  /**
   * Watch a reactive property
   * @param {Function} getter - Property getter
   * @param {Function} callback - Callback when value changes
   * @returns {Function} Stop function
   */
  watch(getter, callback) {
    let oldValue = getter();
    
    return this.effect(() => {
      const newValue = getter();
      if (newValue !== oldValue) {
        callback(newValue, oldValue);
        oldValue = newValue;
      }
    });
  }

  /**
   * Batch multiple updates
   * @param {Function} fn - Function with multiple updates
   */
  batch(fn) {
    const originalEffect = this.currentEffect;
    this.currentEffect = null;
    
    try {
      fn();
    } finally {
      this.currentEffect = originalEffect;
    }
  }
}

module.exports = ReactiveSystem;
