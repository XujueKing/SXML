// 全局应用入口 app.js
// 用于初始化全局配置、语言包、全局事件、loading 控制等

const App = {
    globalData: {
        lang: 'zh-CN', // 默认语言
        user: null,
        loading: false,
        config: {},
    },
    /**
     * 应用启动时初始化
     */
    onLaunch() {
        this.loadConfig();
        this.initLang();
        this.listenNetwork();
        this.setupGlobalErrorHandler();
    },
    /**
     * 加载全局配置
     */
    async loadConfig() {
        try {
            const res = await fetch('/utils/config.js');
            if (res.ok) {
                // 假设 config.js 导出 window.CONFIG
                await import('/utils/config.js');
                this.globalData.config = window.CONFIG || {};
            }
        } catch (e) {
            console.warn('加载全局配置失败', e);
        }
    },
    /**
     * 初始化语言
     */
    async initLang() {
        try {
            const lang = localStorage.getItem('lang') || navigator.language || 'zh-CN';
            this.globalData.lang = lang;
            // 动态加载语言包
            const langFile = lang === 'en-US' ? '/locales/en-US.json' : '/locales/zh-CN.json';
            const res = await fetch(langFile);
            if (res.ok) {
                this.globalData.locale = await res.json();
            }
        } catch (e) {
            console.warn('加载语言包失败', e);
        }
    },
    /**
     * 监听网络状态
     */
    listenNetwork() {
        window.addEventListener('online', () => {
            this.globalData.network = 'online';
            console.log('网络已连接');
        });
        window.addEventListener('offline', () => {
            this.globalData.network = 'offline';
            console.warn('网络已断开');
        });
    },
    /**
     * 全局 loading 控制
     */
    setLoading(val) {
        this.globalData.loading = val;
        document.body.classList.toggle('loading', val);
        // 可选：显示/隐藏全局 loading 元素
        let loadingEl = document.getElementById('globalLoading');
        if (!loadingEl && val) {
            loadingEl = document.createElement('div');
            loadingEl.id = 'globalLoading';
            loadingEl.innerHTML = '<div class="loading-spinner"></div>';
            loadingEl.style = 'position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:9999;background:rgba(255,255,255,0.7);display:flex;align-items:center;justify-content:center;';
            document.body.appendChild(loadingEl);
        }
        if (loadingEl) loadingEl.style.display = val ? 'flex' : 'none';
    },
    setUser(user) {
        this.globalData.user = user;
    },
    getUser() {
        return this.globalData.user;
    },
    /**
     * 全局错误处理
     */
    setupGlobalErrorHandler() {
        window.onerror = function(msg, url, line, col, error) {
            console.error('全局错误:', msg, url, line, col, error);
        };
        window.onunhandledrejection = function(e) {
            console.error('未捕获的Promise错误:', e.reason);
        };
    }
};

// 启动全局应用
App.onLaunch();

// 挂载到 window，方便页面访问
window.App = App;

export default App;
