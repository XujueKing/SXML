// webapp 页面逻辑 - 底部 tabBar（Home, Markets, Trades, Funds）
Page({
  data: {
    pageTitle: 'ICE Markets',
    active: 'home', // home | markets | trades | funds
    tabs: [
      { key: 'home', label: 'Home' },
      { key: 'markets', label: 'Markets' },
      { key: 'trades', label: 'Trades' },
      { key: 'funds', label: 'Funds' }
    ]
  },

  onLoad() {
    this.updateTitle();
    // 根据全局配置动态应用主题（白天 / 夜间）
    try {
      const applyTheme = (mode) => {
        try {
          const el = document.body || document.documentElement;
          if (!el) return;
          if (mode === 'day' || mode === 'light') {
            el.classList.add('theme-day');
          } else {
            el.classList.remove('theme-day');
          }
        } catch (_) {}
      };

      // 优先读取 window.APP_CONFIG.theme 或 window.APP_CONFIG.themeMode
      if (window && window.APP_CONFIG && (window.APP_CONFIG.theme || window.APP_CONFIG.themeMode)) {
        applyTheme((window.APP_CONFIG.theme || window.APP_CONFIG.themeMode).toString().toLowerCase());
      } else {
        // 若 APP_CONFIG 尚未加载（config.js 异步注入），尝试短轮询几次
        let tries = 0;
        const timer = setInterval(() => {
          tries++;
          if (window && window.APP_CONFIG && (window.APP_CONFIG.theme || window.APP_CONFIG.themeMode)) {
            applyTheme((window.APP_CONFIG.theme || window.APP_CONFIG.themeMode).toString().toLowerCase());
            clearInterval(timer);
          } else if (tries > 10) {
            clearInterval(timer);
          }
        }, 200);
      }
    } catch (_) {}
    // 在运行时根据 active 切换显示：先移除 hidden（以允许过渡），再激活初始 tab
    try {
      const root = document.querySelector('.webapp-root');
      if (root) {
        root.querySelectorAll('.page').forEach(p => p.classList.remove('hidden'));
        const start = root.querySelector(`.page-${this.data.active}`);
        if (start) start.classList.add('active');
      }
    } catch (_) {}
    // 小延时确保 DOM 准备好，然后统一入口逻辑
    setTimeout(() => { this.switchTab(this.data.active); this.updateThemeToggleUI(); }, 50);
  },

  updateTitle() {
    try { document.title = this.data.pageTitle || document.title; } catch(_) {}
  },

  switchTab(e) {
    // 支持传入事件对象或字符串 tab key
    const tab = (typeof e === 'string') ? e : (e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.tab) || (e && e.target && e.target.dataset && e.target.dataset.tab);
    if (!tab) return;
    // 更新页面数据状态
    try { this.setData({ active: tab }); } catch (_) { /* ignore if setData not available */ }

    // 运行时切换 DOM：通过 .active class 切换并依赖 CSS 过渡
    try {
      const root = document.querySelector('.webapp-root');
      if (root) {
        const current = root.querySelector('.page.active');
        const target = root.querySelector(`.page-${tab}`);
        if (current && target && current === target) {
          // 已在目标页，无需切换
        } else {
          if (current) current.classList.remove('active');
          if (target) target.classList.add('active');
        }

        // 更新 tab 按钮激活态
        root.querySelectorAll('.tab').forEach(btn => {
          try {
            const t = btn.getAttribute('data-tab') || btn.dataset.tab;
            if (t === tab) btn.classList.add('active'); else btn.classList.remove('active');
          } catch (_) {}
        });
      }
    } catch (err) {
      // 防御性容错
      console.warn('switchTab DOM update failed', err);
    }

    // 可选：触发特定 tab 的数据加载
    if (tab === 'markets') { this.loadMarkets(); }
  },

  // 示例占位方法：在切换到 Markets 时可以加载行情数据
  loadMarkets() {
    // TODO: 使用 WebSocket 或 API 拉取实时行情并渲染
    console.log('加载Markets数据（占位）');
  }

  // 切换主题（由页面按钮调用）
  ,toggleTheme() {
    try {
  // 检查 body 或 html 上是否存在 theme-day（两者可能在不同时间被设置）
  const isDay = ((document.documentElement && document.documentElement.classList && document.documentElement.classList.contains('theme-day')) || (document.body && document.body.classList && document.body.classList.contains('theme-day'))) || false;
  const newMode = isDay ? 'night' : 'day';
      try { if (window && window.setAppTheme) window.setAppTheme(newMode); } catch (_) {}
      this.updateThemeToggleUI();
    } catch (e) { console.warn('toggleTheme failed', e); }
  }

  // 更新主题切换按钮显示
  ,updateThemeToggleUI() {
    try {
      const btn = document.querySelector('.theme-toggle');
      if (!btn) return;
  const isDay = ((document.documentElement && document.documentElement.classList && document.documentElement.classList.contains('theme-day')) || (document.body && document.body.classList && document.body.classList.contains('theme-day'))) || false;
      btn.textContent = isDay ? '🌞' : '🌙';
    } catch (_) {}
  }
});
