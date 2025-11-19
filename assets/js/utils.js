/**
 * UTILITY LIBRARY
 * Common functions used throughout the application
 * Production-grade with comprehensive error handling
 */

const Utils = {
  /**
   * Debounce function calls
   * @param {Function} func - Function to debounce
   * @param {number} wait - Milliseconds to wait
   * @returns {Function} Debounced function
   */
  debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Throttle function calls
   * @param {Function} func - Function to throttle
   * @param {number} limit - Milliseconds between calls
   * @returns {Function} Throttled function
   */
  throttle(func, limit = 300) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Deep clone object
   * @param {Object} obj - Object to clone
   * @returns {Object} Cloned object
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (obj instanceof Object) {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
  },

  /**
   * Safe JSON parse with fallback
   * @param {string} str - JSON string
   * @param {*} fallback - Fallback value if parse fails
   * @returns {*} Parsed object or fallback
   */
  safeJSONParse(str, fallback = null) {
    try {
      return JSON.parse(str);
    } catch (error) {
      console.warn('JSON parse error:', error);
      return fallback;
    }
  },

  /**
   * Safe JSON stringify
   * @param {*} obj - Object to stringify
   * @param {string} fallback - Fallback string
   * @returns {string} JSON string or fallback
   */
  safeJSONStringify(obj, fallback = '{}') {
    try {
      return JSON.stringify(obj);
    } catch (error) {
      console.warn('JSON stringify error:', error);
      return fallback;
    }
  },

  /**
   * Safe localStorage get with expiration
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default if not found or expired
   * @returns {*} Stored value or default
   */
  storageGet(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;

      const parsed = this.safeJSONParse(item);

      // Check for expiration
      if (parsed && parsed._expires && parsed._expires < Date.now()) {
        localStorage.removeItem(key);
        return defaultValue;
      }

      return parsed && parsed._value !== undefined ? parsed._value : parsed;
    } catch (error) {
      console.warn('Storage get error:', error);
      return defaultValue;
    }
  },

  /**
   * Safe localStorage set with optional expiration
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @param {number} ttl - Time to live in milliseconds (optional)
   * @returns {boolean} Success status
   */
  storageSet(key, value, ttl = null) {
    try {
      const data = ttl
        ? { _value: value, _expires: Date.now() + ttl }
        : value;

      localStorage.setItem(key, this.safeJSONStringify(data));
      return true;
    } catch (error) {
      console.warn('Storage set error:', error);

      // Handle quota exceeded
      if (error.name === 'QuotaExceededError') {
        this.clearExpiredStorage();
        try {
          localStorage.setItem(key, this.safeJSONStringify(value));
          return true;
        } catch (retryError) {
          return false;
        }
      }
      return false;
    }
  },

  /**
   * Clear expired items from localStorage
   */
  clearExpiredStorage() {
    const now = Date.now();
    const keysToRemove = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const item = this.safeJSONParse(localStorage.getItem(key));

      if (item && item._expires && item._expires < now) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  },

  /**
   * Validate email address
   * @param {string} email - Email to validate
   * @returns {boolean} Valid status
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate URL
   * @param {string} url - URL to validate
   * @returns {boolean} Valid status
   */
  isValidURL(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Sanitize string for display
   * @param {string} str - String to sanitize
   * @returns {string} Sanitized string
   */
  sanitizeString(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  /**
   * Truncate string with ellipsis
   * @param {string} str - String to truncate
   * @param {number} length - Max length
   * @returns {string} Truncated string
   */
  truncate(str, length = 100) {
    if (str.length <= length) return str;
    return str.substring(0, length - 3) + '...';
  },

  /**
   * Format number with separators
   * @param {number} num - Number to format
   * @returns {string} Formatted number
   */
  formatNumber(num) {
    return num.toLocaleString();
  },

  /**
   * Format currency
   * @param {number} amount - Amount in dollars
   * @param {string} currency - Currency code
   * @returns {string} Formatted currency
   */
  formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  },

  /**
   * Format date
   * @param {Date|string} date - Date to format
   * @param {string} format - Format type
   * @returns {string} Formatted date
   */
  formatDate(date, format = 'short') {
    const d = new Date(date);

    if (format === 'short') {
      return d.toLocaleDateString();
    } else if (format === 'long') {
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } else if (format === 'relative') {
      return this.getRelativeTime(d);
    }

    return d.toISOString();
  },

  /**
   * Get relative time (e.g., "2 hours ago")
   * @param {Date} date - Date to compare
   * @returns {string} Relative time string
   */
  getRelativeTime(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  },

  /**
   * Generate unique ID
   * @param {string} prefix - Optional prefix
   * @returns {string} Unique ID
   */
  generateId(prefix = '') {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 9);
    return `${prefix}${timestamp}_${randomStr}`;
  },

  /**
   * Sleep/delay function
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} Promise that resolves after delay
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Retry async function with exponential backoff
   * @param {Function} fn - Async function to retry
   * @param {number} maxRetries - Maximum retry attempts
   * @param {number} baseDelay - Base delay in ms
   * @returns {Promise} Function result or error
   */
  async retry(fn, maxRetries = 3, baseDelay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxRetries) throw error;

        const delay = baseDelay * Math.pow(2, attempt - 1);
        await this.sleep(delay);
      }
    }
  },

  /**
   * Check if online
   * @returns {boolean} Online status
   */
  isOnline() {
    return navigator.onLine;
  },

  /**
   * Check if mobile device
   * @returns {boolean} Mobile status
   */
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  /**
   * Check if touch device
   * @returns {boolean} Touch support status
   */
  isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },

  /**
   * Get browser info
   * @returns {Object} Browser information
   */
  getBrowserInfo() {
    const ua = navigator.userAgent;

    return {
      isChrome: /Chrome/.test(ua) && !/Edge/.test(ua),
      isFirefox: /Firefox/.test(ua),
      isSafari: /Safari/.test(ua) && !/Chrome/.test(ua),
      isEdge: /Edge/.test(ua) || /Edg/.test(ua),
      isOpera: /Opera|OPR/.test(ua),
      isMobile: this.isMobile(),
      isTouch: this.isTouchDevice()
    };
  },

  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} Success status
   */
  async copyToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        return this.fallbackCopyToClipboard(text);
      }
    } catch (error) {
      console.warn('Clipboard copy error:', error);
      return this.fallbackCopyToClipboard(text);
    }
  },

  /**
   * Fallback clipboard copy
   * @param {string} text - Text to copy
   * @returns {boolean} Success status
   */
  fallbackCopyToClipboard(text) {
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
    } catch (error) {
      console.warn('Fallback copy failed:', error);
    }

    document.body.removeChild(textarea);
    return success;
  },

  /**
   * Show notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type
   * @param {number} duration - Duration in ms
   */
  notify(message, type = 'info', duration = 4000) {
    // Remove existing notifications
    document.querySelectorAll('.pp-notification').forEach(el => el.remove());

    const colors = {
      success: { bg: '#10b981', icon: '✓' },
      error: { bg: '#ef4444', icon: '✗' },
      warning: { bg: '#f59e0b', icon: '⚠' },
      info: { bg: '#3b82f6', icon: 'ℹ' }
    };

    const config = colors[type] || colors.info;

    const notification = document.createElement('div');
    notification.className = 'pp-notification';
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${config.bg};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        font-family: -apple-system, system-ui;
        font-weight: 600;
        font-size: 14px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        z-index: 999999;
        max-width: 400px;
        animation: slideIn 0.3s;
        display: flex;
        align-items: center;
        gap: 12px;
      ">
        <span style="font-size: 20px;">${config.icon}</span>
        <span>${this.sanitizeString(message)}</span>
      </div>
    `;

    // Add animation styles if not present
    if (!document.getElementById('pp-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'pp-notification-styles';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Auto-remove
    setTimeout(() => {
      notification.style.transition = 'opacity 0.3s, transform 0.3s';
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(400px)';
      setTimeout(() => notification.remove(), 300);
    }, duration);
  },

  /**
   * Create loading spinner
   * @param {HTMLElement} container - Container element
   * @returns {HTMLElement} Spinner element
   */
  createSpinner(container) {
    const spinner = document.createElement('div');
    spinner.className = 'pp-spinner';
    spinner.innerHTML = `
      <div style="
        display: inline-block;
        width: 40px;
        height: 40px;
        border: 4px solid rgba(99, 102, 241, 0.1);
        border-top-color: #6366f1;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      "></div>
    `;

    // Add animation
    if (!document.getElementById('pp-spinner-styles')) {
      const style = document.createElement('style');
      style.id = 'pp-spinner-styles';
      style.textContent = `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }

    if (container) {
      container.appendChild(spinner);
    }

    return spinner;
  },

  /**
   * Remove all spinners
   */
  removeSpinners() {
    document.querySelectorAll('.pp-spinner').forEach(el => el.remove());
  },

  /**
   * Parse query string
   * @param {string} search - Query string
   * @returns {Object} Parsed parameters
   */
  parseQueryString(search = window.location.search) {
    const params = new URLSearchParams(search);
    const result = {};

    for (const [key, value] of params) {
      result[key] = value;
    }

    return result;
  },

  /**
   * Build query string
   * @param {Object} params - Parameters object
   * @returns {string} Query string
   */
  buildQueryString(params) {
    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined) {
        searchParams.append(key, value);
      }
    }

    return searchParams.toString();
  },

  /**
   * Scroll to element smoothly
   * @param {HTMLElement|string} element - Element or selector
   * @param {Object} options - Scroll options
   */
  scrollTo(element, options = {}) {
    const target = typeof element === 'string'
      ? document.querySelector(element)
      : element;

    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        ...options
      });
    }
  },

  /**
   * Add event listener with cleanup
   * @param {HTMLElement} element - Element
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @returns {Function} Cleanup function
   */
  on(element, event, handler) {
    element.addEventListener(event, handler);
    return () => element.removeEventListener(event, handler);
  },

  /**
   * Delegate event listener
   * @param {HTMLElement} parent - Parent element
   * @param {string} selector - Child selector
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @returns {Function} Cleanup function
   */
  delegate(parent, selector, event, handler) {
    const wrappedHandler = (e) => {
      const target = e.target.closest(selector);
      if (target && parent.contains(target)) {
        handler.call(target, e);
      }
    };

    parent.addEventListener(event, wrappedHandler);
    return () => parent.removeEventListener(event, wrappedHandler);
  }
};

// Make globally available
if (typeof window !== 'undefined') {
  window.Utils = Utils;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
}
