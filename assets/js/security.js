/**
 * SECURITY & VALIDATION UTILITIES
 * Fixes for XSS vulnerabilities and input validation
 */

const SecurityUtils = {
  /**
   * Escape HTML to prevent XSS attacks
   * Converts <script> to &lt;script&gt;
   */
  escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';

    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * Sanitize text for safe display
   * Removes any HTML tags
   */
  sanitizeText(text) {
    if (!text) return '';

    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Validate email address
   */
  validateEmail(email) {
    if (!email || typeof email !== 'string') return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate webhook payload structure
   */
  validateKofiWebhook(payload) {
    const required = ['kofi_transaction_id', 'email', 'from_name', 'amount', 'currency'];

    for (const field of required) {
      if (!payload || !payload[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (!this.validateEmail(payload.email)) {
      throw new Error('Invalid email address');
    }

    if (isNaN(parseFloat(payload.amount)) || parseFloat(payload.amount) <= 0) {
      throw new Error('Invalid amount');
    }

    return true;
  },

  /**
   * Validate Gumroad webhook payload
   */
  validateGumroadWebhook(payload) {
    const required = ['sale_id', 'email', 'product_id', 'price'];

    for (const field of required) {
      if (!payload || !payload[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (!this.validateEmail(payload.email)) {
      throw new Error('Invalid email address');
    }

    if (isNaN(parseInt(payload.price)) || parseInt(payload.price) <= 0) {
      throw new Error('Invalid price');
    }

    return true;
  },

  /**
   * Safe JSON parse with fallback
   */
  safeJSONParse(jsonString, fallback = null) {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('JSON parse error:', error);
      return fallback;
    }
  },

  /**
   * Safe localStorage get with fallback
   */
  safeLocalStorageGet(key, fallback = null) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return fallback;

      // Try to parse as JSON, fall back to raw string
      try {
        return JSON.parse(item);
      } catch {
        return item;
      }
    } catch (error) {
      console.error('localStorage get error:', error);
      return fallback;
    }
  },

  /**
   * Safe localStorage set with error handling
   */
  safeLocalStorageSet(key, value) {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, stringValue);
      return true;
    } catch (error) {
      console.error('localStorage set error:', error);

      // If quota exceeded, try to clear old data
      if (error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, attempting cleanup...');
        this.cleanupOldData();

        // Try again
        try {
          localStorage.setItem(key, stringValue);
          return true;
        } catch (retryError) {
          console.error('localStorage set failed after cleanup:', retryError);
          return false;
        }
      }

      return false;
    }
  },

  /**
   * Clean up old localStorage data
   */
  cleanupOldData() {
    const keys = Object.keys(localStorage);
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    keys.forEach(key => {
      try {
        const item = JSON.parse(localStorage.getItem(key));

        // Remove if has timestamp and is old
        if (item && item.timestamp) {
          const timestamp = new Date(item.timestamp).getTime();
          if (timestamp < thirtyDaysAgo) {
            localStorage.removeItem(key);
            console.log(`Removed old item: ${key}`);
          }
        }
      } catch {
        // Not a JSON item or no timestamp, skip
      }
    });
  },

  /**
   * Validate access code format
   */
  validateAccessCode(code) {
    if (!code || typeof code !== 'string') return false;

    // Remove dashes and check format
    const cleaned = code.replace(/-/g, '').toUpperCase();

    // Should be 12 alphanumeric characters
    return /^[A-Z0-9]{12}$/.test(cleaned);
  },

  /**
   * Sanitize filename for safe downloads
   * Prevents directory traversal and invalid characters
   */
  sanitizeFilename(filename) {
    if (!filename || typeof filename !== 'string') {
      return 'download.txt';
    }

    return String(filename)
      .replace(/[^a-z0-9_\-\.]/gi, '_')  // Remove invalid filesystem chars
      .replace(/_{2,}/g, '_')             // Collapse multiple underscores
      .replace(/^\.+/, '')                // Remove leading dots (hidden files)
      .replace(/\.+$/, '')                // Remove trailing dots
      .substring(0, 200)                  // Limit to 200 chars
      || 'download.txt';                  // Fallback if empty after sanitization
  },

  /**
   * Check if object has required properties
   */
  hasRequiredProps(obj, props) {
    if (!obj || typeof obj !== 'object') return false;

    return props.every(prop => obj.hasOwnProperty(prop) && obj[prop] !== undefined && obj[prop] !== null);
  },

  /**
   * Rate limiting check
   */
  checkRateLimit(key, maxAttempts = 5, windowMs = 60000) {
    const now = Date.now();
    const attempts = this.safeLocalStorageGet(`rateLimit_${key}`, []);

    // Filter out old attempts
    const recentAttempts = attempts.filter(timestamp => now - timestamp < windowMs);

    if (recentAttempts.length >= maxAttempts) {
      return {
        allowed: false,
        retryAfter: windowMs - (now - recentAttempts[0])
      };
    }

    // Add new attempt
    recentAttempts.push(now);
    this.safeLocalStorageSet(`rateLimit_${key}`, recentAttempts);

    return {
      allowed: true,
      remaining: maxAttempts - recentAttempts.length
    };
  }
};

// Make globally available
if (typeof window !== 'undefined') {
  window.SecurityUtils = SecurityUtils;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SecurityUtils;
}
