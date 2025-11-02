(function () {
  'use strict';

  function get(obj, path, fallback) {
    if (!obj || !path) return fallback;
    const parts = String(path).split('.');
    let cur = obj;
    for (const p of parts) {
      if (cur && Object.prototype.hasOwnProperty.call(cur, p)) {
        cur = cur[p];
      } else {
        return fallback;
      }
    }
    return cur == null ? fallback : cur;
  }

  function detectLang() {
    const saved = localStorage.getItem('lang');
    if (saved) return saved;
    const nav = (navigator.language || navigator.userLanguage || 'en-US');
    if (/^zh/i.test(nav)) return "zh-CN";
    return "en-US";
  }

  const i18n = {
    lang: detectLang(),
    dict: {},

    async load(lang) {
      this.lang = lang || this.lang;

      const jsPackKey = "LOCALE_" + this.lang.replace("-", "_");
      if (window[jsPackKey]) {
        this.dict = window[jsPackKey];
        this.replacePlaceholders();
        console && console.log && console.log('[i18n]', 'using pre-loaded JS pack:', jsPackKey);
        return this.dict;
      }

      const jsUrl = '../../locales/' + this.lang + '.js';
      try {
        await this.loadScript(jsUrl);
        if (window[jsPackKey]) {
          this.dict = window[jsPackKey];
          this.replacePlaceholders();
          console && console.log && console.log('[i18n]', 'loaded JS pack from:', jsUrl);
          return this.dict;
        }
      } catch (e) {
        console && console.warn && console.warn('[i18n]', 'failed to load JS pack:', jsUrl, e);
      }

      const isFile = location.protocol === 'file:';
      const candidates = [
        '../../locales/' + this.lang + '.json',
        '../locales/' + this.lang + '.json',
        './locales/' + this.lang + '.json',
        '/locales/' + this.lang + '.json'
      ];

      if (!isFile) {
        const controller = (typeof AbortController !== "undefined") ? new AbortController() : null;
        const signal = controller ? controller.signal : undefined;
        const timeout = new Promise((resolve) => setTimeout(() => resolve({ timeout: true }), 600));

        const fetchers = candidates.map(function(url){
          return fetch(url, { cache: "no-store", signal })
            .then(function(res){ return res.ok ? res.json().then(function(json){ return { ok: true, url: url, json: json }; }) : Promise.reject(new Error(res.statusText)); })
            .catch(function(){ return { ok: false, url: url }; });
        });

        try {
          const results = await Promise.race([
            Promise.all(fetchers).then(function(list){ return list.find(function(x){ return x && x.ok; }); }),
            timeout
          ]);

          if (results && results.ok) {
            this.dict = results.json;
            this.replacePlaceholders();
            console && console.log && console.log('[i18n]', 'loaded locale from', results.url);
            if (controller) controller.abort();
            return this.dict;
          }
        } catch (e) {
          // ignore and fallback
        }
        if (controller) controller.abort();
      }

      // no embedded fallback by design
      this.dict = {};
      this.replacePlaceholders();
      console && console.warn && console.warn('[i18n]', 'no locale loaded for', this.lang);
      return this.dict;
    },

    replacePlaceholders() {
      if (!window.APP_CONFIG || !window.APP_CONFIG.app) {
        return;
      }

      const appName = window.APP_CONFIG.app.name || "Your App";
      const appTitle = window.APP_CONFIG.app.title || "Your App Title";
      const appSubtitle = window.APP_CONFIG.app.subtitle || "Management System";

      const replaceIn = (obj) => {
        if (typeof obj === "string") {
          return obj
            .replace(/{{APP_NAME}}/g, appName)
            .replace(/{{APP_TITLE}}/g, appTitle)
            .replace(/{{APP_SUBTITLE}}/g, appSubtitle);
        } else if (Array.isArray(obj)) {
          return obj.map(replaceIn);
        } else if (obj && typeof obj === "object") {
          const newObj = {};
          for (const k in obj) {
            newObj[k] = replaceIn(obj[k]);
          }
          return newObj;
        }
        return obj;
      };

      this.dict = replaceIn(this.dict);
    },

    loadScript(src) {
      return new Promise(function(resolve, reject){
        const existing = document.querySelector("script[src='" + src + "']");
        if (existing) {
          setTimeout(resolve, 10);
          return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.onload = function(){ resolve(); };
        script.onerror = function(){ reject(new Error("Failed to load "+ src)); };
        document.head.appendChild(script);
      });
    },

    t(key, fallback) {
      return get(this.dict, key, (fallback != null ? fallback : key));
    },

    apply(root) {
      const scope = root || document;

      scope.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        const val = this.t(key, el.textContent);
        if (el.hasAttribute("data-i18n-html")) {
          el.innerHTML = val;
        } else {
          el.textContent = val;
        }
      });

      scope.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.setAttribute('placeholder', this.t(key, el.getAttribute('placeholder')));
      });

      scope.querySelectorAll('[data-i18n-title]').forEach((el) => {
        const key = el.getAttribute('data-i18n-title');
        el.setAttribute('title', this.t(key, el.getAttribute('title')));
      });

      scope.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
        const key = el.getAttribute('data-i18n-aria-label');
        el.setAttribute('aria-label', this.t(key, el.getAttribute('aria-label')));
      });

      const titleKey = document.documentElement.getAttribute('data-i18n-title-key');
      if (titleKey) {
        document.title = this.t(titleKey, document.title);
      }

      const sel = document.getElementById("langSelect");
      if (sel && sel.value !== this.lang) sel.value = this.lang;

      document.documentElement.setAttribute('lang', this.lang);
    },

    async setLang(lang) {
      if (!lang) return;
      this.lang = lang;
      localStorage.setItem('lang', this.lang);
      await this.load(this.lang);
      this.apply();
    }
  };

  window.i18n = i18n;

  document.addEventListener('DOMContentLoaded', async () => {
    try {
      await i18n.load(i18n.lang);
      i18n.apply();
      try {
        document.documentElement.classList.add('i18n-ready');
        const evt = new Event('i18n:ready');
        window.dispatchEvent(evt);
      } catch (_) { }
    } catch (e) {
      console && console.warn && console.warn('i18n init failed:', e);
      try {
        document.documentElement.classList.add('i18n-ready');
        const evt = new Event('i18n:ready');
        window.dispatchEvent(evt);
      } catch (_) { }
    }
  });
})();