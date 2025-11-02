// 文档映射配置
const DOC_MAP = {
  // 快速开始
  'README': { 
    title: '项目简介', 
    file: '../../README.md', 
    category: 'quickstart',
    order: 1
  },
  'MULTI_ENV_GUIDE': { 
    title: '多环境配置', 
    file: '../../docs/MULTI_ENV_GUIDE.md', 
    category: 'quickstart',
    order: 2
  },
  
  // 核心功能
  'SXML_README': { 
    title: 'SXML 模板引擎', 
    file: '../../docs/SXML_README.md', 
    category: 'core',
    order: 1
  },
  'SXML_COMPILE_GUIDE': { 
    title: 'SXML 编译指南', 
    file: '../../docs/SXML_COMPILE_GUIDE.md', 
    category: 'core',
    order: 2
  },
  'REACTIVE_README': { 
    title: '响应式系统', 
    file: '../../docs/REACTIVE_README.md', 
    category: 'core',
    order: 3
  },
  'SMART_DEPENDENCY': { 
    title: '智能依赖系统', 
    file: '../../docs/SMART_DEPENDENCY.md', 
    category: 'core',
    order: 4
  },
  'PAGE_DEV_GUIDE': { 
    title: '页面开发指南', 
    file: '../../docs/PAGE_DEV_GUIDE.md', 
    category: 'core',
    order: 5
  },
  
  // API 文档
  'SAPI_README': { 
    title: 'SuperAPI 加密通信', 
    file: '../../docs/SAPI_README.md', 
    category: 'api',
    order: 1
  },
  'WSAPI_README': { 
    title: 'WebSocket API', 
    file: '../../docs/WSAPI_README.md', 
    category: 'api',
    order: 2
  },
  'FILEAPI_README': { 
    title: '文件 API', 
    file: '../../docs/FILEAPI_README.md', 
    category: 'api',
    order: 3
  },
  'API_SIGN_MAP_GUIDE': { 
    title: 'API 签名映射', 
    file: '../../docs/API_SIGN_MAP_GUIDE.md', 
    category: 'api',
    order: 4
  },
  
  // 安全配置
  'SECURITY': { 
    title: '安全配置指南', 
    file: '../../docs/SECURITY.md', 
    category: 'security',
    order: 1
  },
  'WSAPI_SECURITY_GUIDE': { 
    title: 'WebSocket 安全', 
    file: '../../docs/WSAPI_SECURITY_GUIDE.md', 
    category: 'security',
    order: 2
  },
  'EMAIL_ALERT_GUIDE': { 
    title: 'CSP 告警配置', 
    file: '../../docs/EMAIL_ALERT_GUIDE.md', 
    category: 'security',
    order: 3
  },
  'EMAIL_PASSWORD_SECURITY': { 
    title: '敏感信息处理', 
    file: '../../docs/EMAIL_PASSWORD_SECURITY.md', 
    category: 'security',
    order: 4
  },
  'SECURITY_AUDIT_REPORT': { 
    title: '安全审计报告', 
    file: '../../docs/SECURITY_AUDIT_REPORT.md', 
    category: 'security',
    order: 5
  },
  
  // 部署与运维
  'DEPLOYMENT': { 
    title: '生产部署指南', 
    file: '../../docs/DEPLOYMENT.md', 
    category: 'deployment',
    order: 1
  },
  'CORS_SOLUTION': { 
    title: 'CORS 跨域解决', 
    file: '../../docs/CORS_SOLUTION.md', 
    category: 'deployment',
    order: 2
  },
  'LOGGER_README': { 
    title: '日志系统', 
    file: '../../docs/LOGGER_README.md', 
    category: 'deployment',
    order: 3
  },
  'LOGGER_QUICKSTART': { 
    title: '日志快速上手', 
    file: '../../docs/LOGGER_QUICKSTART.md', 
    category: 'deployment',
    order: 4
  },
  
  // 开发参考
  'SXML_STYLE_GUIDE': { 
    title: '代码风格指南', 
    file: '../../docs/SXML_STYLE_GUIDE.md', 
    category: 'reference',
    order: 1
  },
  'SXML_FILE_GUIDE': { 
    title: 'SXML 文件指南', 
    file: '../../docs/SXML_FILE_GUIDE.md', 
    category: 'reference',
    order: 2
  },
  'SXML_SOLUTION': { 
    title: '常见问题解决', 
    file: '../../docs/SXML_SOLUTION.md', 
    category: 'reference',
    order: 3
  },
  'TEST_SXML_FEATURES': { 
    title: '功能测试', 
    file: '../../docs/TEST_SXML_FEATURES.md', 
    category: 'reference',
    order: 4
  }
};

// 简易 Markdown 解析器
class MarkdownParser {
  constructor() {
    this.tocItems = [];
  }

  parse(markdown) {
    this.tocItems = [];
    let html = markdown;

    // 代码块处理（先处理，避免被其他规则影响）
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      const language = lang || 'text';
      const escapedCode = this.escapeHtml(code.trim());
      return `<pre><code class="language-${language}">${escapedCode}</code></pre>`;
    });

    // 行内代码
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // 标题（同时生成目录）
    html = html.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, text) => {
      const level = hashes.length;
      const id = this.generateId(text);
      
      // 添加到目录
      this.tocItems.push({
        id,
        text: text.replace(/\*\*/g, '').replace(/\*/g, ''),
        level,
        href: `#${id}`
      });

      return `<h${level} id="${id}">${this.parseInline(text)}</h${level}>`;
    });

    // 水平线
    html = html.replace(/^---$/gm, '<hr>');

    // 表格
    html = this.parseTables(html);

    // 列表
    html = this.parseLists(html);

    // 引用块
    html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');

    // 链接（区分内部锚点与外部链接）
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
      if (url.startsWith('#')) {
        const id = url.slice(1);
        return `<a href="#${id}" class="md-anchor">${text}</a>`;
      }
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    });

    // 图片
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

    // 粗体
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // 斜体
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // 段落
    html = html.replace(/^(?!<[huplbdi]|```)(.*?)$/gm, (match, text) => {
      if (text.trim() === '') return '';
      if (text.startsWith('<')) return text;
      return `<p>${text}</p>`;
    });

    // 基础解析完成后，进行安全清洗：禁止在正文中注入会影响页面策略/执行的危险标签
    html = this.sanitizeDangerousHtml(html);
    return html;
  }

  parseInline(text) {
    return text
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  parseTables(html) {
    return html.replace(/(\|.+\|)\n(\|[-:\s|]+\|)\n(((\|.+\|)\n?)+)/g, (match) => {
      const lines = match.trim().split('\n');
      const headers = lines[0].split('|').filter(c => c.trim());
      const rows = lines.slice(2).map(row => 
        row.split('|').filter(c => c.trim())
      );

      let table = '<table><thead><tr>';
      headers.forEach(h => {
        table += `<th>${h.trim()}</th>`;
      });
      table += '</tr></thead><tbody>';

      rows.forEach(row => {
        table += '<tr>';
        row.forEach(cell => {
          table += `<td>${this.parseInline(cell.trim())}</td>`;
        });
        table += '</tr>';
      });

      table += '</tbody></table>';
      return table;
    });
  }

  parseLists(html) {
    // 无序列表
    html = html.replace(/^([*-])\s+(.+)$/gm, '<li>$2</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, match => `<ul>${match}</ul>`);

    // 有序列表
    html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
    
    return html;
  }

  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  generateId(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  getToc() {
    return this.tocItems;
  }

  // 将危险标签(<meta>, <script>, <style>, <iframe>, <link>, <base>)转义为文本，避免在正文中生效
  sanitizeDangerousHtml(html) {
    const dangerous = ['meta', 'script', 'style', 'iframe', 'link', 'base'];
    for (const tag of dangerous) {
      const open = new RegExp(`<${tag}(\s|>)`, 'gi');
      const close = new RegExp(`</${tag}(\s|>)`, 'gi');
      html = html.replace(open, (m, p1) => `&lt;${tag}${p1}`);
      html = html.replace(close, (m, p1) => `&lt;/${tag}${p1}`);
    }
    return html;
  }
}

Page({
  data: {
    // UI 状态
    loading: false,
    error: false,
    errorMessage: '',
    sidebarExpanded: true,
    sidebarClass: '',
    themeIcon: '🌙',
    theme: 'light',
    
    // 导航状态
    currentDoc: 'README',
    sections: {
      quickstart: { expanded: true },
      core: { expanded: false },
      api: { expanded: false },
      security: { expanded: false },
      deployment: { expanded: false },
      reference: { expanded: false }
    },
    
    // 内容数据
    breadcrumb: [],
    tocItems: [],
    prevDoc: null,
    nextDoc: null,
    updateTime: '',
    
    // 搜索
    searchKeyword: '',
    searchPlaceholder: '搜索文档...',
    searchResults: [],
    
    // 所有文档索引（用于搜索）
    docIndex: []
  },

  onLoad() {
    // 动态加载代码高亮资源
    if (!document.getElementById('code-highlight-css')) {
      const link = document.createElement('link');
      link.id = 'code-highlight-css';
      link.rel = 'stylesheet';
      link.href = '../../css/code-highlight.css';
      document.head.appendChild(link);
    }
    
    if (!document.getElementById('code-highlighter-js')) {
      const script = document.createElement('script');
      script.id = 'code-highlighter-js';
      script.src = '../../utils/code-highlighter.js';
      // 为动态脚本添加 CSP nonce
      const nonce = this.getCspNonce();
      if (nonce) script.setAttribute('nonce', nonce);
      document.head.appendChild(script);
    }
    
    // 从 URL 参数获取要显示的文档
    const params = new URLSearchParams(window.location.search);
    const doc = params.get('doc') || 'README';
    
  // 初始化主题（与 VS Code Docs 保持一致，默认亮色）
  const savedTheme = localStorage.getItem('docs-theme') || 'light';
    this.setTheme(savedTheme);
    
    // 渲染导航
    this.renderNavigation();
    
    // 加载文档
    this.loadDocById(doc);
    
    // 构建搜索索引
    this.buildSearchIndex();
  },

  // 提取 CSP 中的 nonce，用于给动态创建的 <script> 添加 nonce
  getCspNonce() {
    const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!meta) return '';
    const content = meta.getAttribute('content') || '';
    // 匹配 script-src 中的 nonce-xxxxx（允许包含 /+ 字符）
    const m = content.match(/script-src[^;]*'nonce-([^']+)'/);
    return m ? m[1] : '';
  },

  onReady() {
    // 监听内容区滚动以高亮当前目录项（使用内部滚动容器而非 window）
    const contentWrapper = document.querySelector('.content-wrapper');
    if (contentWrapper) {
      contentWrapper.addEventListener('scroll', this.onScroll.bind(this));
    } else {
      // 兜底：仍监听 window，避免元素不存在导致无高亮
      window.addEventListener('scroll', this.onScroll.bind(this));
    }
    
    // 绑定搜索输入事件
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', this.onSearchInput.bind(this));
    }
    
    // 绑定主题切换按钮
    const themeBtn = document.getElementById('theme-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', this.toggleTheme.bind(this));
    }
    
    // 绑定侧边栏切换按钮
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
    if (sidebarToggleBtn) {
      sidebarToggleBtn.addEventListener('click', this.toggleSidebar.bind(this));
    }
  },

  onUnload() {
    const contentWrapper = document.querySelector('.content-wrapper');
    if (contentWrapper) {
      contentWrapper.removeEventListener('scroll', this.onScroll.bind(this));
    } else {
      window.removeEventListener('scroll', this.onScroll.bind(this));
    }
  },

  // 加载文档
  async loadDoc(e) {
    const docId = e.currentTarget.dataset.doc || e.target.dataset.doc;
    this.loadDocById(docId);
  },

  async loadDocById(docId) {
    if (!DOC_MAP[docId]) {
      const errorEl = document.getElementById('error-message');
      if (errorEl) {
        errorEl.querySelector('span').textContent = '文档不存在';
        errorEl.classList.add('show');
      }
      return;
    }

    // 显示加载中
    const loadingEl = document.getElementById('loading-indicator');
    const errorEl = document.getElementById('error-message');
    if (loadingEl) loadingEl.classList.add('show');
    if (errorEl) errorEl.classList.remove('show');
    
    this.data.currentDoc = docId;

    try {
      const docInfo = DOC_MAP[docId];
      const response = await fetch(docInfo.file);
      
      if (!response.ok) {
        throw new Error('文档加载失败');
      }

      const markdown = await response.text();
      
      // 解析 Markdown
      const parser = new MarkdownParser();
      const html = parser.parse(markdown);
      const toc = parser.getToc();

      // 渲染到页面
      const contentEl = document.getElementById('markdown-content');
      if (contentEl) {
        contentEl.innerHTML = html;
        
        // 代码高亮（使用 SimpleHighlighter）
        if (window.SimpleHighlighter) {
          const highlighter = new SimpleHighlighter();
          contentEl.querySelectorAll('pre code').forEach(block => {
            highlighter.highlightBlock(block);
          });
        }

        // 拦截正文内部锚点点击，滚动到对应标题（适配内部滚动容器）
        contentEl.addEventListener('click', (e) => {
          const link = e.target && e.target.closest('a[href^="#"]');
          if (!link) return;
          e.preventDefault();
          const id = decodeURIComponent((link.getAttribute('href') || '').slice(1));
          if (!id) return;
          const target = document.getElementById(id);
          const contentWrapper = document.querySelector('.content-wrapper');
          if (target) {
            if (contentWrapper) {
              const top = target.offsetTop - 12;
              contentWrapper.scrollTo({ top: top < 0 ? 0 : top, behavior: 'smooth' });
            } else {
              target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            try { history.replaceState(null, '', `#${encodeURIComponent(id)}`); } catch (_) {}
          }
        });
      }

      // 隐藏加载中
      if (loadingEl) loadingEl.classList.remove('show');

      // 更新导航信息
      const { prevDoc, nextDoc } = this.getAdjacentDocs(docId);
      const breadcrumb = this.getBreadcrumb(docId);

      // 更新面包屑
      const breadcrumbEl = document.getElementById('breadcrumb');
      if (breadcrumbEl) {
        const parts = breadcrumb.map((item) => {
          // item 可能是字符串或对象，兼容两者
          if (item && typeof item === 'object') {
            const text = String(item.name ?? '');
            if (item.link) {
              return `<a class="crumb-item" href="${item.link}">${text}</a>`;
            }
            return `<span class="crumb-item">${text}</span>`;
          }
          return `<span class="crumb-item">${String(item)}</span>`;
        });
        breadcrumbEl.innerHTML = parts.join('<span class="crumb-separator">›</span>');
      }

      // 更新目录
      this.data.tocItems = toc;
      this.renderToc(toc);

      // 更新文档底部导航
      this.renderFooterNav(prevDoc, nextDoc);

      // 更新时间
      const updateTimeEl = document.getElementById('update-time');
      if (updateTimeEl) {
        updateTimeEl.textContent = `最后更新: ${new Date().toLocaleDateString('zh-CN')}`;
      }

      // 更新 URL
      const url = new URL(window.location);
      url.searchParams.set('doc', docId);
      window.history.pushState({}, '', url);

      // 重置内部滚动容器到顶部
      const contentWrapper = document.querySelector('.content-wrapper');
      if (contentWrapper) {
        contentWrapper.scrollTop = 0;
      } else {
        window.scrollTo(0, 0);
      }

      // 展开当前分类
      this.expandCurrentSection(docInfo.category);

    } catch (error) {
      console.error('加载文档失败:', error);
      
      // 隐藏加载中，显示错误
      const loadingEl = document.getElementById('loading-indicator');
      const errorEl = document.getElementById('error-message');
      if (loadingEl) loadingEl.classList.remove('show');
      if (errorEl) {
        errorEl.querySelector('span').textContent = error.message || '文档加载失败';
        errorEl.classList.add('show');
      }
    }
  },

  // 渲染目录
  renderToc(toc) {
    const tocWrapper = document.getElementById('docs-toc');
    const tocEl = document.getElementById('toc-items');
    if (!tocWrapper || !tocEl || !toc || toc.length === 0) return;

    const html = toc.map(item => `
      <div class="toc-item toc-level-${item.level}" data-id="${item.id}">
        <a href="#${item.id}" class="toc-link">${item.text}</a>
      </div>
    `).join('');

  tocEl.innerHTML = html;
  tocWrapper.classList.add('show');

    // 目录点击滚动到目标标题（适配内部滚动容器）
  tocEl.addEventListener('click', (e) => {
      const link = e.target && e.target.closest('a.toc-link');
      if (!link) return;
      const href = link.getAttribute('href') || '';
      if (!href.startsWith('#')) return;
      e.preventDefault();
      const id = decodeURIComponent(href.slice(1));
      const target = document.getElementById(id);
      const contentWrapper = document.querySelector('.content-wrapper');
      if (target) {
        if (contentWrapper) {
          // 计算目标相对 wrapper 的偏移，预留 12px 顶部空间
          const top = target.offsetTop - 12;
          contentWrapper.scrollTo({ top: top < 0 ? 0 : top, behavior: 'smooth' });
        } else {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        // 更新 hash 但不产生历史记录
        try { history.replaceState(null, '', `#${encodeURIComponent(id)}`); } catch (_) {}
      }
    });

    // 初始计算一次高亮
    try { this.onScroll(); } catch (_) {}
  },

  // 渲染底部导航
  renderFooterNav(prevDoc, nextDoc) {
    const footerNavEl = document.getElementById('footer-nav');
    const footerEl = document.getElementById('doc-footer');
    
    if (!footerNavEl || (!prevDoc && !nextDoc)) {
      if (footerEl) footerEl.classList.remove('show');
      return;
    }

    let html = '';
    
    if (prevDoc) {
      html += `
        <div class="footer-nav-prev">
          <span class="nav-label">← 上一篇</span>
          <span class="nav-title" data-doc="${prevDoc.id}">${prevDoc.title}</span>
        </div>
      `;
    } else {
      html += '<div></div>';
    }

    if (nextDoc) {
      html += `
        <div class="footer-nav-next">
          <span class="nav-label">下一篇 →</span>
          <span class="nav-title" data-doc="${nextDoc.id}">${nextDoc.title}</span>
        </div>
      `;
    }

    footerNavEl.innerHTML = html;
    
    // 绑定点击事件
    footerNavEl.querySelectorAll('[data-doc]').forEach(el => {
      el.addEventListener('click', (e) => {
        const docId = e.currentTarget.dataset.doc;
        this.loadDocById(docId);
      });
    });

    if (footerEl) footerEl.classList.add('show');
  },

  // 获取面包屑导航
  getBreadcrumb(docId) {
    const docInfo = DOC_MAP[docId];
    if (!docInfo) return [];

    const categoryNames = {
      quickstart: '快速开始',
      core: '核心功能',
      api: 'API 文档',
      security: '安全配置',
      deployment: '部署与运维',
      reference: '开发参考'
    };

    return [
      { name: '文档', link: '#' },
      { name: categoryNames[docInfo.category] || docInfo.category },
      { name: docInfo.title }
    ];
  },

  // 获取前后文档
  getAdjacentDocs(currentDocId) {
    const currentDoc = DOC_MAP[currentDocId];
    if (!currentDoc) return { prevDoc: null, nextDoc: null };

    // 获取同类文档并排序
    const sameCategoryDocs = Object.entries(DOC_MAP)
      .filter(([_, doc]) => doc.category === currentDoc.category)
      .sort((a, b) => a[1].order - b[1].order);

    const currentIndex = sameCategoryDocs.findIndex(([id]) => id === currentDocId);

    const prevDoc = currentIndex > 0 
      ? { id: sameCategoryDocs[currentIndex - 1][0], title: sameCategoryDocs[currentIndex - 1][1].title }
      : null;

    const nextDoc = currentIndex < sameCategoryDocs.length - 1
      ? { id: sameCategoryDocs[currentIndex + 1][0], title: sameCategoryDocs[currentIndex + 1][1].title }
      : null;

    return { prevDoc, nextDoc };
  },

  // 展开当前分类
  expandCurrentSection(category) {
    const sections = { ...this.data.sections };
    Object.keys(sections).forEach(key => {
      sections[key].expanded = (key === category);
    });
    this.setData({ sections });
  },

  // 切换分类展开/折叠
  toggleSection(e) {
    const section = e.currentTarget.dataset.section;
    const sections = { ...this.data.sections };
    sections[section].expanded = !sections[section].expanded;
    this.setData({ sections });
  },

  // 切换侧边栏（移动端）
  toggleSidebar() {
    const expanded = !this.data.sidebarExpanded;
    this.setData({
      sidebarExpanded: expanded,
      sidebarClass: expanded ? '' : 'collapsed'
    });
  },

  // 切换主题
  toggleTheme() {
    const newTheme = this.data.theme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  },

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('docs-theme', theme);
    this.data.theme = theme;
    
    // 更新主题按钮图标
    const themeBtn = document.getElementById('theme-btn');
    if (themeBtn) {
      themeBtn.textContent = theme === 'light' ? '🌙' : '☀️';
    }
  },

  // 搜索
  onSearchInput(e) {
    const keyword = e.target.value.trim();
    this.data.searchKeyword = keyword;

    const searchResultsEl = document.getElementById('search-results');
    
    if (keyword.length < 2) {
      if (searchResultsEl) searchResultsEl.classList.remove('show');
      return;
    }

    // 简单搜索实现
    const results = this.data.docIndex
      .filter(doc => 
        doc.title.toLowerCase().includes(keyword.toLowerCase()) ||
        doc.content.toLowerCase().includes(keyword.toLowerCase())
      )
      .slice(0, 10)
      .map(doc => ({
        id: doc.id,
        title: doc.title,
        excerpt: this.getExcerpt(doc.content, keyword)
      }));

    // 渲染搜索结果
    if (searchResultsEl && results.length > 0) {
      const html = results.map(result => `
        <div class="search-result-item" data-doc="${result.id}">
          <div class="result-title">${result.title}</div>
          <div class="result-excerpt">${result.excerpt}</div>
        </div>
      `).join('');
      
      searchResultsEl.innerHTML = html;
      searchResultsEl.classList.add('show');
      
      // 绑定点击事件
      searchResultsEl.querySelectorAll('[data-doc]').forEach(el => {
        el.addEventListener('click', (e) => {
          const docId = e.currentTarget.dataset.doc;
          this.loadDocById(docId);
          if (searchResultsEl) searchResultsEl.classList.remove('show');
          e.target.closest('input').value = '';
        });
      });
    } else if (searchResultsEl) {
      searchResultsEl.innerHTML = '<div class="no-results">未找到相关文档</div>';
      searchResultsEl.classList.add('show');
    }
  },

  getExcerpt(content, keyword) {
    const index = content.toLowerCase().indexOf(keyword.toLowerCase());
    if (index === -1) return content.substring(0, 100) + '...';
    
    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + 100);
    let excerpt = content.substring(start, end);
    
    if (start > 0) excerpt = '...' + excerpt;
    if (end < content.length) excerpt = excerpt + '...';
    
    return excerpt;
  },

  closeSearch() {
    this.setData({ 
      searchResults: [],
      searchKeyword: ''
    });
  },

  // 构建搜索索引
  async buildSearchIndex() {
    const index = [];
    
    for (const [id, docInfo] of Object.entries(DOC_MAP)) {
      try {
        const response = await fetch(docInfo.file);
        const content = await response.text();
        index.push({
          id,
          title: docInfo.title,
          content: content.substring(0, 5000) // 只索引前5000字符
        });
      } catch (error) {
        console.warn(`索引文档失败: ${id}`, error);
      }
    }

    this.setData({ docIndex: index });
  },

  // 滚动到锚点
  scrollToAnchor(e) {
    e.preventDefault();
    const id = e.currentTarget.dataset.id;
    const element = document.getElementById(id);
    
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },

  // 滚动监听（高亮当前目录项）
  onScroll() {
    const contentWrapper = document.querySelector('.content-wrapper');
    const tocItems = this.data.tocItems.map(item => {
      const el = document.getElementById(item.id);
      if (el) {
        let top = 0;
        if (contentWrapper) {
          // 计算元素相对 wrapper 可视区域的 top
          top = el.getBoundingClientRect().top - contentWrapper.getBoundingClientRect().top;
        } else {
          top = el.getBoundingClientRect().top;
        }
        item.active = top >= 0 && top < 120;
      }
      return item;
    });

    this.setData({ tocItems });
    // 同步 DOM 高亮
    this.updateTocActive();
  },

  // 根据 this.data.tocItems 的 active 状态更新目录条目高亮
  updateTocActive() {
    const tocEl = document.getElementById('docs-toc');
    if (!tocEl) return;
    const activeIds = new Set(this.data.tocItems.filter(i => i.active).map(i => i.id));
    tocEl.querySelectorAll('.toc-item').forEach((node) => {
      const id = node.getAttribute('data-id');
      if (id && activeIds.has(id)) {
        node.classList.add('active');
      } else {
        node.classList.remove('active');
      }
    });
  },

  // 渲染导航栏
  renderNavigation() {
    const categories = {
      quickstart: { title: '快速开始', expanded: true },
      core: { title: '核心功能', expanded: false },
      api: { title: 'API 文档', expanded: false },
      security: { title: '安全配置', expanded: false },
      deployment: { title: '部署与运维', expanded: false },
      reference: { title: '开发参考', expanded: false }
    };

    const sidebarNav = document.getElementById('sidebar-nav');
    if (!sidebarNav) return;

    let html = '';
    
    for (const [catId, catInfo] of Object.entries(categories)) {
      // 获取该分类下的所有文档
      const docs = Object.entries(DOC_MAP)
        .filter(([_, doc]) => doc.category === catId)
        .sort((a, b) => a[1].order - b[1].order);

      if (docs.length === 0) continue;

      html += `
        <div class="nav-section">
          <div class="section-title" data-section="${catId}">
            <span class="toggle-icon">${catInfo.expanded ? '▼' : '▶'}</span>
            <span>${catInfo.title}</span>
          </div>
          <div class="nav-items ${catInfo.expanded ? '' : 'hide'}" data-section-content="${catId}">
      `;

      docs.forEach(([docId, doc]) => {
        html += `
          <div class="nav-item" data-doc="${docId}">
            <span>${doc.title}</span>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    }

    sidebarNav.innerHTML = html;

    // 绑定点击事件
    sidebarNav.querySelectorAll('.section-title').forEach(el => {
      el.addEventListener('click', (e) => {
        const section = e.currentTarget.dataset.section;
        const content = sidebarNav.querySelector(`[data-section-content="${section}"]`);
        const icon = e.currentTarget.querySelector('.toggle-icon');
        
        if (content.classList.contains('hide')) {
          content.classList.remove('hide');
          icon.textContent = '▼';
        } else {
          content.classList.add('hide');
          icon.textContent = '▶';
        }
      });
    });

    sidebarNav.querySelectorAll('.nav-item').forEach(el => {
      el.addEventListener('click', (e) => {
        const docId = e.currentTarget.dataset.doc;
        this.loadDocById(docId);
        
        // 更新 active 状态
        sidebarNav.querySelectorAll('.nav-item').forEach(item => {
          item.classList.remove('active');
        });
        e.currentTarget.classList.add('active');
      });
    });
  }
});

