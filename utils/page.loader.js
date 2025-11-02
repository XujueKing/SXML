/**
 * 现代化 Web 3.0 页面加载器
 * 自动加载当前页面同目录下的同名 CSS、JS、JSON、SXML 文件
 * 使用方式：在 HTML 中引入此脚本即可
 * <script src="../utils/page.loader.js"></script>
 * 
 * 约定：
 * - pages/myInfo/myInfo.html 会自动加载：
 *   - pages/myInfo/myInfo.css
 *   - pages/myInfo/myInfo.js
 *   - pages/myInfo/myInfo.json
 *   - pages/myInfo/myInfo.sxml (可选)
 */
(function(global) {
  'use strict';

  /**
   * 获取当前页面路径信息
   */
  function getCurrentPageInfo() {
    const path = global.location.pathname;
    const parts = path.split('/');
    const filename = parts[parts.length - 1];
    const basename = filename.replace(/\.(html|htm)$/i, '');
    const dir = parts.slice(0, -1).join('/');
    
    return {
      path,           // 完整路径
      dir,            // 目录路径
      filename,       // 文件名（含扩展名）
      basename        // 文件名（不含扩展名）
    };
  }

  /**
   * 动态加载 CSS
   */
  function loadCSS(href) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = href;
      
      link.onload = () => {
        console.log(`✅ CSS loaded: ${href}`);
        resolve();
      };
      
      link.onerror = () => {
        console.warn(`⚠️ CSS not found: ${href}`);
        resolve(); // 不阻塞，继续执行
      };
      
      document.head.appendChild(link);
    });
  }

  /**
   * 动态加载 JS
   */
  function loadJS(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = src;
      
      script.onload = () => {
        console.log(`✅ JS loaded: ${src}`);
        resolve();
      };
      
      script.onerror = () => {
        console.warn(`⚠️ JS not found: ${src}`);
        resolve(); // 不阻塞，继续执行
      };
      
      document.head.appendChild(script);
    });
  }

  /**
   * 加载 JSON 配置
   */
  function loadJSON(src) {
    return fetch(src, { cache: 'no-store' })
      .then(res => {
        if (!res.ok) {
          console.warn(`⚠️ JSON not found: ${src}`);
          return null;
        }
        return res.json();
      })
      .then(config => {
        if (config) {
          console.log(`✅ JSON loaded: ${src}`, config);
          // 存储到全局配置对象
          global.PAGE_CONFIG = global.PAGE_CONFIG || {};
          Object.assign(global.PAGE_CONFIG, config);
        }
        return config;
      })
      .catch(err => {
        console.warn(`⚠️ JSON load error: ${src}`, err);
        return null;
      });
  }

  /**
   * 动态加载 SXML 模板
   */
  function loadSXML(src) {
    return fetch(src, { cache: 'no-store' })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.text();
      })
      .then(sxmlContent => {
        console.log(`✅ SXML loaded: ${src}`);
        
        // 将 SXML 内容插入到 body 或指定容器
        const container = document.getElementById('sxml-container') || document.body;
        
        // 创建临时容器解析 SXML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = sxmlContent;
        
        // 将解析后的内容移动到目标容器
        while (tempDiv.firstChild) {
          container.appendChild(tempDiv.firstChild);
        }
        
        // 存储 SXML 内容供后续使用
        global.SXML_CONTENT = sxmlContent;
        
        return sxmlContent;
      })
      .catch(err => {
        console.warn(`⚠️ SXML not found or load error: ${src}`, err);
        return null;
      });
  }

  /**
   * 检查文件是否存在（通过 HEAD 请求）
   */
  function checkFileExists(url) {
    return fetch(url, { method: 'HEAD', cache: 'no-store' })
      .then(res => res.ok)
      .catch(() => false);
  }

  /**
   * 主加载逻辑
   */
  async function autoLoadPageResources() {
    const pageInfo = getCurrentPageInfo();
    const { dir, basename } = pageInfo;

    console.log('📄 Page Loader - Current page:', pageInfo);

    // 检测是否为预编译页面，避免重复加载 SXML（否则会出现内容重复）
    const isPrecompiled = !!(document.querySelector('meta[name="sxml-compiled"]') ||
                            window.SXML_PRECOMPILED ||
                            (document.body && document.body.innerHTML && document.body.innerHTML.indexOf('SXML Compiled at') !== -1));

    // 构建资源路径
    const cssPath = `${dir}/${basename}.css`;
    const jsPath = `${dir}/${basename}.js`;
    const jsonPath = `${dir}/${basename}.json`;
  const sxmlPath = `${dir}/${basename}.sxml`;

    try {
      // 1. 优先加载 JSON 配置
      await loadJSON(jsonPath);

      // 2. 检查是否有 SXML 文件（若已预编译则跳过加载，防止重复 DOM）
      const hasSXML = !isPrecompiled && await checkFileExists(sxmlPath);
      if (hasSXML) {
        await loadSXML(sxmlPath);
      }

      // 3. 加载 CSS（可并行）
      // 预编译页面通常已在 <head> 注入了同名 CSS 链接，这里做一次存在性检测，避免重复加载
      const hasPageCssLink = !!document.querySelector(`link[rel="stylesheet"][href$='/${basename}.css']`);
      if (!hasPageCssLink) {
        await loadCSS(cssPath);
      } else {
        console.log(`🛑 Skip duplicate CSS load: ${cssPath}`);
      }

      // 4. 加载 JS（最后执行，确保 DOM 和配置已准备好）
      await loadJS(jsPath);

      console.log('✅ Page resources loaded successfully');
      
      // 触发自定义事件，通知页面资源加载完成
      const event = new CustomEvent('pageResourcesLoaded', {
        detail: { 
          pageInfo, 
          config: global.PAGE_CONFIG,
          hasSXML,
          isPrecompiled
        }
      });
      document.dispatchEvent(event);
      
    } catch (error) {
      console.error('❌ Error loading page resources:', error);
    }
  }

  /**
   * 页面对象（响应式数据驱动）
   */
  function Page(options) {
    const {
      data = {},
      onLoad,
      onReady,
      onShow,
      onHide,
      onUnload,
      ...methods
    } = options;

    // 创建页面实例
    const pageInstance = {
      data: global.reactive ? global.reactive(data) : data,
      setData(newData) {
        Object.assign(this.data, newData);
        
        // 触发 SXML 重新渲染
        if (global.refreshSXML) {
          global.refreshSXML();
        }
      },
      ...methods
    };

    // 暴露到全局
    global.currentPage = pageInstance;
    console.log('✅ Page instance created:', pageInstance);

    // 生命周期管理
    document.addEventListener('DOMContentLoaded', () => {
      if (typeof onLoad === 'function') {
        onLoad.call(pageInstance, global.PAGE_CONFIG || {});
      }
    });

    global.addEventListener('load', () => {
      if (typeof onReady === 'function') {
        onReady.call(pageInstance);
      }
      if (typeof onShow === 'function') {
        onShow.call(pageInstance);
      }
    });

    global.addEventListener('pagehide', () => {
      if (typeof onHide === 'function') {
        onHide.call(pageInstance);
      }
    });

    global.addEventListener('beforeunload', () => {
      if (typeof onUnload === 'function') {
        onUnload.call(pageInstance);
      }
    });

    // 暴露到全局，供模板访问
    global.currentPage = pageInstance;

    return pageInstance;
  }

  /**
   * 路由导航（声明式导航）
   */
  const wx = {
    navigateTo({ url }) {
      global.location.href = url;
    },
    redirectTo({ url }) {
      global.location.replace(url);
    },
    navigateBack() {
      global.history.back();
    },
    reLaunch({ url }) {
      global.location.replace(url);
    },
    switchTab({ url }) {
      global.location.href = url;
    }
  };

  // 暴露到全局
  global.Page = Page;
  global.wx = wx;
  global.getCurrentPages = () => [global.currentPage];

  console.log('📦 page.loader.js loaded, readyState:', document.readyState);

  // 页面加载时自动执行
  if (document.readyState === 'loading') {
    console.log('⏳ Waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', autoLoadPageResources);
  } else {
    console.log('✅ Document already loaded, starting auto load...');
    autoLoadPageResources();
  }

})(window);
