/**
 * ADVANCED BOOKMARKLET ENGINE v2.0
 * Production-grade prompt injection with multi-platform support,
 * error handling, retry logic, and comprehensive user feedback
 */

const BookmarkletEngine = {
  // Configuration
  config: {
    maxRetries: 3,
    retryDelay: 500, // ms
    notificationDuration: 4000, // ms
    debug: false
  },

  // Supported AI platforms with multiple selector strategies
  platforms: {
    chatgpt: {
      name: 'ChatGPT',
      domains: ['chat.openai.com', 'chatgpt.com'],
      selectors: [
        // New ChatGPT interface
        { type: 'textarea', selector: '#prompt-textarea' },
        { type: 'textarea', selector: 'textarea[data-id="root"]' },
        { type: 'contenteditable', selector: '.ProseMirror[contenteditable="true"]' },
        // Fallback
        { type: 'textarea', selector: 'textarea[placeholder*="Message"]' },
        { type: 'textarea', selector: 'textarea[tabindex="0"]' }
      ],
      inject: (element, text) => {
        if (element.tagName === 'TEXTAREA') {
          element.value = text;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          // ProseMirror / ContentEditable
          element.focus();
          const p = element.querySelector('p') || element;
          p.textContent = text;
          element.dispatchEvent(new Event('input', { bubbles: true }));

          // Trigger React's synthetic event
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement?.prototype || window.HTMLElement.prototype,
            'value'
          )?.set;
          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(element, text);
          }
        }
        return true;
      }
    },

    claude: {
      name: 'Claude',
      domains: ['claude.ai'],
      selectors: [
        { type: 'contenteditable', selector: 'div[contenteditable="true"][role="textbox"]' },
        { type: 'contenteditable', selector: '.ProseMirror[contenteditable="true"]' },
        { type: 'contenteditable', selector: 'div.ProseMirror' },
        { type: 'textarea', selector: 'textarea' }
      ],
      inject: (element, text) => {
        element.focus();

        if (element.tagName === 'TEXTAREA') {
          element.value = text;
          element.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
          // Clear existing content
          while (element.firstChild) {
            element.removeChild(element.firstChild);
          }

          // Create paragraph with text
          const p = document.createElement('p');
          p.textContent = text;
          element.appendChild(p);

          // Move cursor to end
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(element);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);

          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        }
        return true;
      }
    },

    gemini: {
      name: 'Gemini',
      domains: ['gemini.google.com', 'bard.google.com'],
      selectors: [
        { type: 'contenteditable', selector: '.ql-editor[contenteditable="true"]' },
        { type: 'contenteditable', selector: 'div[contenteditable="true"]' },
        { type: 'textarea', selector: 'textarea' }
      ],
      inject: (element, text) => {
        element.focus();

        if (element.tagName === 'TEXTAREA') {
          element.value = text;
          element.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
          element.textContent = text;
          element.dispatchEvent(new Event('input', { bubbles: true }));

          // Quill editor specific
          if (element.classList.contains('ql-editor')) {
            const event = new InputEvent('input', {
              bubbles: true,
              cancelable: true,
              inputType: 'insertText',
              data: text
            });
            element.dispatchEvent(event);
          }
        }
        return true;
      }
    },

    perplexity: {
      name: 'Perplexity',
      domains: ['perplexity.ai'],
      selectors: [
        { type: 'textarea', selector: 'textarea[placeholder*="Ask"]' },
        { type: 'textarea', selector: 'textarea' }
      ],
      inject: (element, text) => {
        element.value = text;
        element.focus();
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    },

    poe: {
      name: 'Poe',
      domains: ['poe.com'],
      selectors: [
        { type: 'textarea', selector: 'textarea[class*="GrowingTextArea"]' },
        { type: 'textarea', selector: 'textarea' }
      ],
      inject: (element, text) => {
        element.value = text;
        element.focus();
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    },

    // Generic fallback for unknown platforms
    generic: {
      name: 'AI Chat',
      domains: [],
      selectors: [
        { type: 'textarea', selector: 'textarea:not([type="hidden"])' },
        { type: 'contenteditable', selector: 'div[contenteditable="true"]' },
        { type: 'contenteditable', selector: '[contenteditable="true"]' }
      ],
      inject: (element, text) => {
        if (element.tagName === 'TEXTAREA') {
          element.value = text;
          element.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
          element.textContent = text;
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
        return true;
      }
    }
  },

  /**
   * Detect current AI platform
   * @returns {Object|null} Platform configuration or null
   */
  detectPlatform() {
    const hostname = window.location.hostname;

    for (const [key, platform] of Object.entries(this.platforms)) {
      if (key === 'generic') continue;

      if (platform.domains.some(domain => hostname.includes(domain))) {
        return { key, ...platform };
      }
    }

    // Check if page has AI chat-like elements
    const hasTextarea = document.querySelector('textarea');
    const hasContentEditable = document.querySelector('[contenteditable="true"]');

    if (hasTextarea || hasContentEditable) {
      return { key: 'generic', ...this.platforms.generic };
    }

    return null;
  },

  /**
   * Find input element on page
   * @param {Object} platform - Platform configuration
   * @returns {HTMLElement|null} Input element or null
   */
  findInputElement(platform) {
    if (!platform) return null;

    for (const selectorConfig of platform.selectors) {
      const element = document.querySelector(selectorConfig.selector);
      if (element && this.isElementVisible(element)) {
        this.log('Found element:', selectorConfig.selector);
        return element;
      }
    }

    return null;
  },

  /**
   * Check if element is visible and interactable
   * @param {HTMLElement} element
   * @returns {boolean}
   */
  isElementVisible(element) {
    if (!element) return false;

    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      rect.width > 0 &&
      rect.height > 0
    );
  },

  /**
   * Inject prompt with retry logic
   * @param {string} promptText - Text to inject
   * @param {string} promptTitle - Prompt name
   * @param {number} attempt - Current attempt number
   * @returns {Promise<Object>} Result object
   */
  async injectWithRetry(promptText, promptTitle, attempt = 1) {
    const platform = this.detectPlatform();

    if (!platform) {
      return {
        success: false,
        error: 'NOT_SUPPORTED',
        message: 'This page doesn\'t appear to be a supported AI chat interface.'
      };
    }

    const element = this.findInputElement(platform);

    if (!element) {
      if (attempt < this.config.maxRetries) {
        this.log(`Attempt ${attempt} failed, retrying in ${this.config.retryDelay}ms...`);
        await this.sleep(this.config.retryDelay * attempt); // Exponential backoff
        return this.injectWithRetry(promptText, promptTitle, attempt + 1);
      }

      return {
        success: false,
        error: 'ELEMENT_NOT_FOUND',
        message: `Could not find input field on ${platform.name}. Please make sure the page is fully loaded.`
      };
    }

    try {
      const injected = platform.inject(element, promptText);

      if (injected) {
        element.focus();

        return {
          success: true,
          platform: platform.name,
          message: `Prompt "${promptTitle}" loaded successfully!`
        };
      } else {
        throw new Error('Injection returned false');
      }
    } catch (error) {
      this.log('Injection error:', error);

      if (attempt < this.config.maxRetries) {
        await this.sleep(this.config.retryDelay * attempt);
        return this.injectWithRetry(promptText, promptTitle, attempt + 1);
      }

      return {
        success: false,
        error: 'INJECTION_FAILED',
        message: `Failed to inject prompt after ${attempt} attempts. Error: ${error.message}`
      };
    }
  },

  /**
   * Show notification to user
   * @param {string} message - Notification text
   * @param {string} type - success, error, warning
   */
  showNotification(message, type = 'success') {
    // Remove existing notifications
    const existing = document.querySelectorAll('.pp-notification');
    existing.forEach(el => el.remove());

    const colors = {
      success: { bg: '#10b981', border: '#059669' },
      error: { bg: '#ef4444', border: '#dc2626' },
      warning: { bg: '#f59e0b', border: '#d97706' },
      info: { bg: '#3b82f6', border: '#2563eb' }
    };

    const color = colors[type] || colors.info;

    const notification = document.createElement('div');
    notification.className = 'pp-notification';
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${color.bg};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-weight: 600;
        font-size: 14px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        z-index: 999999;
        max-width: 400px;
        animation: ppSlideIn 0.3s ease-out;
        border-left: 4px solid ${color.border};
        display: flex;
        align-items: center;
        gap: 12px;
      ">
        <span style="font-size: 20px;">
          ${type === 'success' ? '✓' : type === 'error' ? '✗' : type === 'warning' ? '⚠' : 'ℹ'}
        </span>
        <span>${message}</span>
      </div>
    `;

    // Add animation
    if (!document.getElementById('pp-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'pp-notification-styles';
      style.textContent = `
        @keyframes ppSlideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes ppSlideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Auto-remove after duration
    setTimeout(() => {
      notification.firstElementChild.style.animation = 'ppSlideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, this.config.notificationDuration);
  },

  /**
   * Generate bookmarklet JavaScript URL
   * @param {string} promptText - The prompt
   * @param {string} promptTitle - Prompt name
   * @returns {string} Bookmarklet URL
   */
  generate(promptText, promptTitle) {
    // Escape text for JavaScript
    const escapedPrompt = this.escapeForJS(promptText);
    const escapedTitle = this.escapeForJS(promptTitle);

    // Minified injection code (will be executed in browser)
    const code = `
(function(){
  const engine={
    config:{maxRetries:3,retryDelay:500,notificationDuration:4000},
    platforms:{
      chatgpt:{
        domains:['chat.openai.com','chatgpt.com'],
        selectors:[
          {selector:'#prompt-textarea'},
          {selector:'textarea[data-id="root"]'},
          {selector:'.ProseMirror[contenteditable="true"]'},
          {selector:'textarea[placeholder*="Message"]'}
        ]
      },
      claude:{
        domains:['claude.ai'],
        selectors:[
          {selector:'div[contenteditable="true"][role="textbox"]'},
          {selector:'.ProseMirror[contenteditable="true"]'}
        ]
      },
      gemini:{
        domains:['gemini.google.com','bard.google.com'],
        selectors:[
          {selector:'.ql-editor[contenteditable="true"]'},
          {selector:'div[contenteditable="true"]'}
        ]
      },
      perplexity:{
        domains:['perplexity.ai'],
        selectors:[{selector:'textarea[placeholder*="Ask"]'},{selector:'textarea'}]
      },
      poe:{
        domains:['poe.com'],
        selectors:[{selector:'textarea[class*="GrowingTextArea"]'},{selector:'textarea'}]
      },
      generic:{
        domains:[],
        selectors:[
          {selector:'textarea:not([type="hidden"])'},
          {selector:'div[contenteditable="true"]'}
        ]
      }
    },
    detectPlatform(){
      const h=window.location.hostname;
      for(const[k,p]of Object.entries(this.platforms)){
        if(k==='generic')continue;
        if(p.domains.some(d=>h.includes(d)))return p;
      }
      return this.platforms.generic;
    },
    findElement(p){
      for(const s of p.selectors){
        const e=document.querySelector(s.selector);
        if(e&&this.isVisible(e))return e;
      }
      return null;
    },
    isVisible(e){
      if(!e)return false;
      const s=getComputedStyle(e);
      const r=e.getBoundingClientRect();
      return s.display!=='none'&&s.visibility!=='hidden'&&s.opacity!=='0'&&r.width>0&&r.height>0;
    },
    inject(e,t){
      e.focus();
      if(e.tagName==='TEXTAREA'){
        e.value=t;
        e.dispatchEvent(new Event('input',{bubbles:true}));
        e.dispatchEvent(new Event('change',{bubbles:true}));
      }else{
        while(e.firstChild)e.removeChild(e.firstChild);
        const p=document.createElement('p');
        p.textContent=t;
        e.appendChild(p);
        e.dispatchEvent(new Event('input',{bubbles:true}));
      }
      return true;
    },
    notify(msg,type='success'){
      const c={success:'#10b981',error:'#ef4444'};
      const col=c[type]||c.success;
      const n=document.createElement('div');
      n.innerHTML='<div style="position:fixed;top:20px;right:20px;background:'+col+';color:white;padding:16px 24px;border-radius:8px;font-family:system-ui;font-weight:600;font-size:14px;box-shadow:0 10px 25px rgba(0,0,0,0.3);z-index:999999;animation:slideIn 0.3s"><span style="font-size:20px;margin-right:8px">'+(type==='success'?'✓':'✗')+'</span>'+msg+'</div>';
      const s=document.createElement('style');
      s.textContent='@keyframes slideIn{from{transform:translateX(400px);opacity:0}to{transform:translateX(0);opacity:1}}';
      document.head.appendChild(s);
      document.body.appendChild(n);
      setTimeout(()=>n.remove(),4000);
    }
  };
  const p=engine.detectPlatform();
  if(!p){
    engine.notify('Not on a supported AI platform','error');
    return;
  }
  const e=engine.findElement(p);
  if(!e){
    engine.notify('Could not find input field. Please reload the page.','error');
    return;
  }
  try{
    engine.inject(e,'${escapedPrompt}');
    engine.notify('Prompt "${escapedTitle}" loaded!','success');
  }catch(err){
    engine.notify('Injection failed: '+err.message,'error');
  }
})();
    `.trim().replace(/\s+/g, ' ').replace(/\n/g, '');

    return 'javascript:' + encodeURIComponent(code);
  },

  /**
   * Escape text for JavaScript string
   * @param {string} text
   * @returns {string}
   */
  escapeForJS(text) {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
      .replace(/\f/g, '\\f')
      .replace(/\v/g, '\\v');
  },

  /**
   * Create draggable bookmarklet link
   * @param {Object} promptData - Prompt object
   * @returns {HTMLElement}
   */
  createBookmarkletLink(promptData) {
    const bookmarkletCode = this.generate(promptData.prompt, promptData.title);

    const link = document.createElement('a');
    link.href = bookmarkletCode;
    link.className = 'bookmarklet-button';
    link.textContent = `📌 ${promptData.title}`;
    link.title = 'Drag to bookmarks bar to install';
    link.setAttribute('data-prompt-id', promptData.id);

    // Prevent default click, show instructions
    link.addEventListener('click', (e) => {
      e.preventDefault();

      // Check if mobile
      if (this.isMobile()) {
        this.showMobileInstructions(promptData);
      } else {
        alert(
          `📌 Installation Instructions:\n\n` +
          `1. Drag this button to your bookmarks bar\n` +
          `2. Go to ChatGPT or Claude\n` +
          `3. Click the bookmark\n` +
          `4. The prompt auto-loads!\n\n` +
          `Alternative: Use the "Copy Code" button below.`
        );
      }
    });

    return link;
  },

  /**
   * Check if mobile device
   * @returns {boolean}
   */
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  /**
   * Show mobile-specific instructions
   * @param {Object} promptData
   */
  showMobileInstructions(promptData) {
    alert(
      `📱 Mobile Setup:\n\n` +
      `Bookmarklets work best on desktop, but you can:\n\n` +
      `1. Copy the prompt text\n` +
      `2. Paste into ChatGPT/Claude manually\n\n` +
      `Or use desktop for one-click bookmarklets!`
    );
  },

  /**
   * Copy bookmarklet code to clipboard
   * @param {string} bookmarkletCode
   * @returns {Promise<boolean>}
   */
  async copyToClipboard(bookmarkletCode) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(bookmarkletCode);
        return true;
      } else {
        return this.fallbackCopy(bookmarkletCode);
      }
    } catch (err) {
      this.log('Clipboard error:', err);
      return this.fallbackCopy(bookmarkletCode);
    }
  },

  /**
   * Fallback clipboard copy
   * @param {string} text
   * @returns {boolean}
   */
  fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';
    textarea.setAttribute('readonly', '');

    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    let success = false;
    try {
      success = document.execCommand('copy');
    } catch (err) {
      this.log('Fallback copy failed:', err);
    }

    document.body.removeChild(textarea);
    return success;
  },

  /**
   * Generate installation instructions HTML
   * @returns {string} - HTML instructions
   */
  getInstructions() {
    return `
      <div class="bookmarklet-instructions">
        <h3>📚 How to Install Bookmarklets</h3>
        <ol>
          <li><strong>Show your bookmarks bar:</strong>
            <ul>
              <li>Chrome/Edge: Press <code>Ctrl+Shift+B</code> (Windows) or <code>Cmd+Shift+B</code> (Mac)</li>
              <li>Firefox: Press <code>Ctrl+Shift+B</code> or go to View → Toolbars → Bookmarks Toolbar</li>
              <li>Safari: Press <code>Cmd+Shift+B</code></li>
            </ul>
          </li>
          <li><strong>Drag the bookmarklet button</strong> to your bookmarks bar</li>
          <li><strong>To use:</strong> Go to ChatGPT, Claude, Gemini, or any AI chat, click the bookmark</li>
          <li><strong>The prompt auto-loads</strong> - just add your specific details and send!</li>
        </ol>

        <div class="alert alert-info mt-lg">
          <strong>💡 Pro Tip:</strong> Organize bookmarklets in a folder called "AI Prompts"
          for easy access to your entire library!
        </div>
      </div>
    `;
  },

  /**
   * Generate shareable bookmarklet HTML
   * @param {Object} promptData - Prompt object
   * @returns {string} - Shareable HTML
   */
  generateShareableHTML(promptData) {
    const bookmarkletCode = this.generate(promptData.prompt, promptData.title);

    return `
<!DOCTYPE html>
<html>
<head>
  <title>${promptData.title} - AI Prompt Bookmarklet</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
      line-height: 1.6;
    }
    .bookmarklet {
      display: inline-block;
      padding: 12px 24px;
      background: #6366f1;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: move;
    }
    .bookmarklet:hover {
      background: #4f46e5;
    }
  </style>
</head>
<body>
  <h1>${promptData.title}</h1>
  <p>${promptData.description}</p>

  <h2>Installation</h2>
  <p>Drag this button to your bookmarks bar:</p>
  <p><a href="${bookmarkletCode}" class="bookmarklet">📌 ${promptData.title}</a></p>

  <h2>How to Use</h2>
  <ol>
    <li>Go to ChatGPT, Claude, or any AI chat</li>
    <li>Click the bookmark in your bookmarks bar</li>
    <li>The prompt will auto-load!</li>
  </ol>
</body>
</html>
    `.trim();
  },

  /**
   * Test if we're on a supported AI chat page
   * @returns {string|null} - Name of detected AI platform or null
   */
  detectAIPlatform() {
    const url = window.location.href;

    if (url.includes('chat.openai.com') || url.includes('chatgpt.com')) {
      return 'ChatGPT';
    } else if (url.includes('claude.ai')) {
      return 'Claude';
    } else if (url.includes('bard.google.com') || url.includes('gemini.google.com')) {
      return 'Gemini';
    } else if (url.includes('perplexity.ai')) {
      return 'Perplexity';
    } else if (url.includes('poe.com')) {
      return 'Poe';
    }

    return null;
  },

  /**
   * Direct injection (for testing on same domain)
   * @param {string} promptText - Prompt to inject
   */
  injectDirectly(promptText) {
    const platform = this.detectPlatform();

    if (!platform) {
      console.error('Not on a supported AI platform');
      return false;
    }

    // Use the same injection code as bookmarklet
    const textarea = document.querySelector('textarea') ||
                    document.querySelector('div[contenteditable="true"]');

    if (textarea) {
      if (textarea.tagName === 'TEXTAREA') {
        textarea.value = promptText;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        textarea.textContent = promptText;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
      return true;
    }

    return false;
  },

  /**
   * Sleep utility
   * @param {number} ms
   * @returns {Promise}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Debug logger
   * @param {...any} args
   */
  log(...args) {
    if (this.config.debug) {
      console.log('[BookmarkletEngine]', ...args);
    }
  },

  /**
   * Enable debug mode
   */
  enableDebug() {
    this.config.debug = true;
  },

  /**
   * Test injection (for development)
   * @param {string} promptText
   * @param {string} promptTitle
   */
  async test(promptText, promptTitle) {
    this.enableDebug();
    const result = await this.injectWithRetry(promptText, promptTitle);

    if (result.success) {
      this.showNotification(result.message, 'success');
    } else {
      this.showNotification(result.message, 'error');
    }

    return result;
  }
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BookmarkletEngine;
}

// Make globally available
if (typeof window !== 'undefined') {
  window.BookmarkletEngine = BookmarkletEngine;
}
