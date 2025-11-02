// 认证路由辅助（优化版）：
// - 兼容原有 API：window.route(status)
// - 改为跳转到统一路径：/pages/login/login.html（适配开发与构建产物）
// - 健壮性增强：安全解析 USERINFO、校验结构、可选过期判断、优雅回退
(function () {
    'use strict';

    function safeParse(json) {
        try { return JSON.parse(json); } catch (_) { return null; }
    }

    function isExpired(info) {
        try {
            // 可选：支持 expiresAt(ISO 或 ms 时间戳) / expiresIn(ms)
            if (info && info.expiresAt) {
                const t = typeof info.expiresAt === 'number' ? info.expiresAt : Date.parse(info.expiresAt);
                if (!isNaN(t) && Date.now() > t) return true;
            }
            if (info && typeof info.expiresIn === 'number' && info.issuedAt) {
                const base = typeof info.issuedAt === 'number' ? info.issuedAt : Date.parse(info.issuedAt);
                if (!isNaN(base) && Date.now() > base + info.expiresIn) return true;
            }
        } catch (_) { /* ignore */ }
        return false;
    }

    function getUserInfo() {
        const raw = sessionStorage.getItem('USERINFO');
        if (!raw) return null;
        const info = safeParse(raw);
        if (!info || typeof info !== 'object') {
            // 数据损坏，清理
            sessionStorage.removeItem('USERINFO');
            return null;
        }
        if (isExpired(info)) {
            sessionStorage.removeItem('USERINFO');
            return null;
        }
        return info;
    }

    function getLoginUrl() {
        // 统一使用绝对路径，兼容 dev-server 与 dist 目录结构
        return '/pages/login/login.html';
    }

    function redirectToLogin() {
        try { window.location.replace(getLoginUrl()); } catch (_) { window.location.href = getLoginUrl(); }
    }

    function redirectTo(url) {
        if (!url) {
            try { window.location.replace('/'); } catch (_) { window.location.href = '/'; }
            return;
        }
        try {
            const u = new URL(url, window.location.origin);
            const next = u.pathname + u.search + u.hash;
            window.location.replace(next);
        } catch (_) {
            // 如果不是合法 URL，直接尝试作为相对路径
            try { window.location.replace(url); } catch (e) { window.location.href = url; }
        }
    }

    function route(status) {
        // status=true: 受保护页面，未登录则跳到登录页
        // status=false: 登录页，已登录则按 USERINFO.url 跳转
        const info = getUserInfo();
        if (status) {
            if (!info) {
                redirectToLogin();
                return;
            }
        } else {
            if (info && info.url) {
                redirectTo(info.url);
                return;
            }
        }
    }

    // 保持与旧代码兼容的全局导出
    window.route = route;
    // 可选导出实用函数，便于后续扩展
    window.__auth = {
        getUserInfo,
        redirectToLogin,
        redirectTo,
        getLoginUrl
    };
})();