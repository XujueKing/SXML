/**
 * 简易代码高亮工具
 * 支持常见语言的语法高亮
 */

class SimpleHighlighter {
  constructor() {
    // 语言关键字映射
    this.keywords = {
      javascript: /\b(const|let|var|function|class|if|else|for|while|return|import|export|async|await|try|catch|new|this|null|undefined|true|false)\b/g,
      python: /\b(def|class|if|elif|else|for|while|return|import|from|try|except|finally|with|as|True|False|None)\b/g,
      java: /\b(public|private|protected|class|interface|extends|implements|void|int|String|boolean|if|else|for|while|return|new|this|null|true|false)\b/g,
      css: /\b(color|background|padding|margin|border|width|height|display|flex|grid|position|font|text)\b/g,
      xml: /<\/?[\w\s="/.':;#-\/\?]+>/g,
      json: /"(\\.|[^"\\])*"\s*:/g
    };

    // 字符串匹配
    this.strings = {
      single: /'(?:\\.|[^'\\])*'/g,
      double: /"(?:\\.|[^"\\])*"/g,
      template: /`(?:\\.|[^`\\])*`/g
    };

    // 注释匹配
    this.comments = {
      line: /\/\/.*/g,
      block: /\/\*[\s\S]*?\*\//g,
      python: /#.*/g,
      xml: /<!--[\s\S]*?-->/g
    };

    // 数字匹配
    this.numbers = /\b\d+(\.\d+)?\b/g;
  }

  /**
   * 高亮代码块
   * @param {HTMLElement} block - 代码块元素
   */
  highlightBlock(block) {
    const code = block.textContent;
    const language = this.detectLanguage(block);
    
    let html = this.escapeHtml(code);
    html = this.highlightSyntax(html, language);
    
    block.innerHTML = html;
    block.classList.add('hljs', `language-${language}`);
  }

  /**
   * 检测语言
   */
  detectLanguage(block) {
    const className = block.className || '';
    const match = className.match(/language-(\w+)/);
    return match ? match[1] : 'text';
  }

  /**
   * 语法高亮
   */
  highlightSyntax(code, language) {
    let html = code;

    // 注释高亮（优先处理，避免被关键字影响）
    if (language === 'javascript' || language === 'java' || language === 'css') {
      html = html.replace(this.comments.line, match => 
        `<span class="hljs-comment">${match}</span>`
      );
      html = html.replace(this.comments.block, match => 
        `<span class="hljs-comment">${match}</span>`
      );
    } else if (language === 'python') {
      html = html.replace(this.comments.python, match => 
        `<span class="hljs-comment">${match}</span>`
      );
    } else if (language === 'xml' || language === 'html') {
      html = html.replace(this.comments.xml, match => 
        `<span class="hljs-comment">${match}</span>`
      );
    }

    // 字符串高亮
    html = html.replace(this.strings.single, match => 
      `<span class="hljs-string">${match}</span>`
    );
    html = html.replace(this.strings.double, match => 
      `<span class="hljs-string">${match}</span>`
    );
    if (language === 'javascript') {
      html = html.replace(this.strings.template, match => 
        `<span class="hljs-string">${match}</span>`
      );
    }

    // 关键字高亮
    const keywordPattern = this.keywords[language];
    if (keywordPattern) {
      // 避免高亮已经在 span 标签内的内容
      html = html.replace(keywordPattern, match => {
        // 简单检查是否已在标签内
        if (match.includes('<span')) return match;
        return `<span class="hljs-keyword">${match}</span>`;
      });
    }

    // 数字高亮
    html = html.replace(this.numbers, match => {
      if (match.includes('<span')) return match;
      return `<span class="hljs-number">${match}</span>`;
    });

    // XML/HTML 标签高亮
    if (language === 'xml' || language === 'html' || language === 'sxml') {
      html = html.replace(/<\/?[\w\-]+/g, match => 
        `<span class="hljs-tag">${match}</span>`
      );
      html = html.replace(/(\w+)=/g, (match, attr) => 
        `<span class="hljs-attr">${attr}</span>=`
      );
    }

    return html;
  }

  /**
   * HTML 转义
   */
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

  /**
   * 批量高亮页面中所有代码块
   */
  highlightAll() {
    document.querySelectorAll('pre code').forEach(block => {
      this.highlightBlock(block);
    });
  }
}

// 创建全局实例
window.hljs = new SimpleHighlighter();

// 页面加载完成后自动高亮
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.hljs.highlightAll();
  });
} else {
  window.hljs.highlightAll();
}
