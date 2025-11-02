/**
 * 全局配置文件（支持外部化配置）
 * 优先从 config/app.config.json 读取，否则使用内置默认值
 * API 签名映射从 config/api-sign-map.js 加载
 */
(function() {
  'use strict';

  // 检测当前环境
  const isDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  
  // 默认配置（在未加载外部 config 时的回退值）
  const DEFAULT_CONFIG = {
    BASE_URL: isDev ? '' : 'https://api.example.com',
    SIGN_MAP: {}  // 将从 config/api-sign-map.js 加载
  };

  // 初始化全局配置为默认值
  window.API_CONFIG = Object.assign({}, DEFAULT_CONFIG);

  // 异步加载外部配置并合并
  (async function loadExternalConfig() {
    const configUrl = window.APP_CONFIG_URL || '../../config/app.config.json';
    try {
      const res = await fetch(configUrl, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const appConfig = await res.json();

      // 合并配置：生产环境使用 api.baseUrl，开发环境保持空串（走代理）
      if (appConfig.api && appConfig.api.baseUrl && !isDev) {
        window.API_CONFIG.BASE_URL = appConfig.api.baseUrl;
      }

      // 存储完整外部配置供其他模块使用
      window.APP_CONFIG = appConfig;

      console.log('📡 API_CONFIG 已从外部配置加载:', window.API_CONFIG);
    } catch (e) {
      console.warn('⚠️  无法加载外部配置，使用默认配置:', e.message);
      console.log('📡 API_CONFIG（默认）:', window.API_CONFIG);
    }
  })();

  // 加载 API 签名映射（带回退动态加载）
  (function loadSignMap() {
    try {
      const applyMap = () => {
        if (window.API_SIGN_MAP && typeof window.API_SIGN_MAP === 'object') {
          window.API_CONFIG.SIGN_MAP = window.API_SIGN_MAP;
          console.log('📝 API_SIGN_MAP 已加载:', Object.keys(window.API_CONFIG.SIGN_MAP).length, '个接口');
          return true;
        }
        return false;
      };

      // 情况1：已在页面中通过 <script src="../../config/api-sign-map.js"> 预先加载
      if (applyMap()) return;

      // 情况2：尝试查找是否已有正在加载的脚本标签
      const existing = Array.from(document.getElementsByTagName('script') || [])
        .find(s => s.src && /\/config\/api-sign-map\.js(?:$|[?#])/i.test(s.src));
      if (existing) {
        // 若已存在脚本，监听其 onload/onerror，再次尝试应用
        existing.addEventListener('load', () => applyMap());
        existing.addEventListener('error', () => console.warn('⚠️  api-sign-map.js 脚本加载失败'));
        // 同时设置一个短轮询，避免错过 load 事件
        let tries = 0;
        const timer = setInterval(() => {
          tries++;
          if (applyMap() || tries > 20) clearInterval(timer);
        }, 100);
        return;
      }

      // 情况3：动态加载回退（相对页面路径）
      if (!window.__SIGN_MAP_LOADING__) {
        window.__SIGN_MAP_LOADING__ = true;
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = '../../config/api-sign-map.js';
        script.async = false; // 保持顺序，尽量在后续逻辑前完成
        // 继承页面 CSP Nonce（若存在）
        try {
          const current = (document.currentScript && (document.currentScript.nonce || document.currentScript.getAttribute && document.currentScript.getAttribute('nonce'))) || null;
          const existNonceEl = document.querySelector && document.querySelector('script[nonce]');
          const detectedNonce = current || (existNonceEl && (existNonceEl.nonce || existNonceEl.getAttribute('nonce')));
          if (detectedNonce) script.setAttribute('nonce', detectedNonce);
        } catch (_) {}
        script.onload = () => {
          if (applyMap()) {
            console.log('📝 API_SIGN_MAP 动态注入完成');
          }
          window.__SIGN_MAP_LOADING__ = false;
        };
        script.onerror = () => {
          console.warn('⚠️  无法加载 ../../config/api-sign-map.js，请检查路径与 CSP');
          window.__SIGN_MAP_LOADING__ = false;
        };
        document.head.appendChild(script);
        console.warn('ℹ️  API_SIGN_MAP 未预加载，已尝试动态注入 ../../config/api-sign-map.js');
      }
    } catch (e) {
      console.error('❌ 加载 API_SIGN_MAP 失败:', e && e.message || e);
    }
  })();
})();

