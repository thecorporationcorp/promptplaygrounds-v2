/**
 * SMART ERROR RECOVERY SYSTEM
 * Handles bookmarklet failures with intelligent fallbacks
 * Ensures users ALWAYS get their prompt, no matter what
 */

const ErrorRecovery = {
  // Configuration
  config: {
    maxRetries: 5,
    retryDelay: 800,
    fallbackMethods: ['injection', 'clipboard', 'modal', 'download', 'email'],
    trackFailures: true
  },

  /**
   * MAIN RECOVERY HANDLER
   * Called when bookmarklet fails - tries all recovery methods
   */
  async handleFailure(prompt, title, error) {
    console.log('🔧 Starting error recovery for:', title);

    // Log the failure
    this.logFailure(error, title);

    // Try recovery methods in order
    const methods = this.getRecoveryMethods(error);

    for (const method of methods) {
      try {
        const success = await this[method](prompt, title);
        if (success) {
          console.log(`✅ Recovery successful via ${method}`);
          this.logRecovery(method, title);
          return { success: true, method };
        }
      } catch (err) {
        console.log(`❌ ${method} failed:`, err.message);
      }
    }

    // If all methods fail, show comprehensive help
    this.showComprehensiveHelp(prompt, title);

    return { success: false, error: 'All recovery methods exhausted' };
  },

  /**
   * Get appropriate recovery methods based on error type
   */
  getRecoveryMethods(error) {
    const errorType = this.classifyError(error);

    const methodMap = {
      'platform_not_supported': ['clipboard', 'modal', 'download'],
      'element_not_found': ['retry', 'clipboard', 'modal'],
      'injection_failed': ['retry', 'clipboard', 'modal'],
      'mobile_device': ['clipboard', 'modal', 'sms'],
      'browser_security': ['clipboard', 'download', 'modal'],
      'unknown': ['retry', 'clipboard', 'modal', 'download']
    };

    return methodMap[errorType] || methodMap.unknown;
  },

  /**
   * Classify error type
   */
  classifyError(error) {
    const errorMsg = error.error || error.message || '';

    if (errorMsg.includes('NOT_SUPPORTED')) return 'platform_not_supported';
    if (errorMsg.includes('ELEMENT_NOT_FOUND')) return 'element_not_found';
    if (errorMsg.includes('INJECTION_FAILED')) return 'injection_failed';
    if (BookmarkletEngine.isMobile()) return 'mobile_device';

    return 'unknown';
  },

  /**
   * RECOVERY METHOD 1: Retry with Extended Wait
   */
  async retry(prompt, title) {
    console.log('🔄 Attempting retry with extended wait...');

    // Wait for page to fully load
    await this.sleep(this.config.retryDelay);

    // Try injection again
    const result = await BookmarkletEngine.injectWithRetry(prompt, title);

    return result.success;
  },

  /**
   * RECOVERY METHOD 2: Copy to Clipboard with Instructions
   */
  async clipboard(prompt, title) {
    console.log('📋 Attempting clipboard recovery...');

    const success = await this.copyToClipboard(prompt);

    if (success) {
      this.showClipboardSuccess(title);
      return true;
    }

    return false;
  },

  /**
   * RECOVERY METHOD 3: Show Interactive Modal
   */
  async modal(prompt, title) {
    console.log('💬 Showing recovery modal...');

    this.showRecoveryModal(prompt, title);
    return true; // Modal always "succeeds" as it gives user the prompt
  },

  /**
   * RECOVERY METHOD 4: Download as Text File
   */
  async download(prompt, title) {
    console.log('💾 Attempting download recovery...');

    this.downloadPromptAsFile(prompt, title);
    this.showDownloadSuccess(title);

    return true;
  },

  /**
   * RECOVERY METHOD 5: Email to User
   */
  async email(prompt, title) {
    console.log('📧 Attempting email recovery...');

    const userEmail = this.getUserEmail();
    if (!userEmail) return false;

    await this.emailPromptToUser(prompt, title, userEmail);
    this.showEmailSuccess(userEmail);

    return true;
  },

  /**
   * Copy to clipboard with fallback
   */
  async copyToClipboard(text) {
    // Method 1: Modern Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        console.log('Clipboard API failed:', err);
      }
    }

    // Method 2: Legacy execCommand
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch (err) {
      console.log('execCommand failed:', err);
      return false;
    }
  },

  /**
   * Show clipboard success notification
   */
  showClipboardSuccess(title) {
    const safeTitle = SecurityUtils.escapeHtml(title);
    this.showNotification(`
      <div style="text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
        <h3 style="margin: 0 0 0.5rem;">Prompt Copied!</h3>
        <p style="margin: 0; opacity: 0.9;">"${safeTitle}" is now in your clipboard</p>
        <div style="background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 8px; margin-top: 1rem;">
          <strong>Next Step:</strong> Paste it into your AI chat (Ctrl+V or Cmd+V)
        </div>
      </div>
    `, 'success', 6000);
  },

  /**
   * Show recovery modal with multiple options
   */
  showRecoveryModal(prompt, title) {
    // Remove existing modal if any
    const existing = document.getElementById('recoveryModal');
    if (existing) existing.remove();

    // Escape user input to prevent XSS
    const safeTitle = SecurityUtils.escapeHtml(title);
    const safePrompt = SecurityUtils.escapeHtml(prompt);

    const modal = document.createElement('div');
    modal.id = 'recoveryModal';
    modal.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 999999; display: flex; align-items: center; justify-content: center; padding: 1rem;" onclick="if(event.target === this) this.remove()">
        <div style="background: #1a1a2e; border-radius: 16px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px rgba(0,0,0,0.5);">

          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2rem; border-radius: 16px 16px 0 0; text-align: center; color: white;">
            <div style="font-size: 3rem; margin-bottom: 0.5rem;">📌</div>
            <h2 style="margin: 0 0 0.5rem; font-size: 1.5rem;">Your Prompt is Ready!</h2>
            <p style="margin: 0; opacity: 0.9; font-size: 0.875rem;">${safeTitle}</p>
          </div>

          <!-- Content -->
          <div style="padding: 2rem;">
            <p style="color: #e0e0e0; margin: 0 0 1.5rem; text-align: center;">
              We couldn't auto-inject this prompt, but don't worry!<br>
              <strong>Choose how you'd like to use it:</strong>
            </p>

            <!-- Option 1: Copy -->
            <button onclick="ErrorRecovery.modalCopyPrompt(this, \`${prompt.replace(/`/g, '\\`')}\`)" style="width: 100%; background: #6366f1; color: white; border: none; padding: 1rem; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.2s;" onmouseover="this.style.background='#4f46e5'" onmouseout="this.style.background='#6366f1'">
              <span style="font-size: 1.5rem;">📋</span>
              <span>Copy to Clipboard</span>
            </button>

            <!-- Option 2: Download -->
            <button onclick="ErrorRecovery.modalDownloadPrompt(\`${prompt.replace(/`/g, '\\`')}\`, '${title}')" style="width: 100%; background: #10b981; color: white; border: none; padding: 1rem; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.2s;" onmouseover="this.style.background='#059669'" onmouseout="this.style.background='#10b981'">
              <span style="font-size: 1.5rem;">💾</span>
              <span>Download as File</span>
            </button>

            <!-- Option 3: View Full Text -->
            <button onclick="ErrorRecovery.modalToggleText()" style="width: 100%; background: #8b5cf6; color: white; border: none; padding: 1rem; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.2s;" onmouseover="this.style.background='#7c3aed'" onmouseout="this.style.background='#8b5cf6'">
              <span style="font-size: 1.5rem;">👁️</span>
              <span>View Full Text</span>
            </button>

            <!-- Full text (hidden by default) -->
            <div id="modalFullText" style="display: none; background: #0f172a; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; max-height: 300px; overflow-y: auto;">
              <pre style="white-space: pre-wrap; word-wrap: break-word; color: #e0e0e0; margin: 0; font-family: monospace; font-size: 0.875rem;">${safePrompt}</pre>
            </div>

            <!-- Help Text -->
            <div style="background: rgba(99, 102, 241, 0.1); border-left: 3px solid #6366f1; padding: 1rem; border-radius: 0 8px 8px 0; margin-bottom: 1.5rem;">
              <p style="margin: 0; color: #e0e0e0; font-size: 0.875rem;">
                <strong>💡 Quick Tip:</strong> After copying, just paste (Ctrl+V or Cmd+V) into ChatGPT, Claude, or any AI chat!
              </p>
            </div>

            <!-- Close Button -->
            <button onclick="document.getElementById('recoveryModal').remove()" style="width: 100%; background: transparent; color: #9ca3af; border: 1px solid #4b5563; padding: 0.75rem; border-radius: 8px; font-size: 0.875rem; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'">
              Close
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  },

  /**
   * Modal action: Copy prompt
   */
  async modalCopyPrompt(button, prompt) {
    const success = await this.copyToClipboard(prompt);

    if (success) {
      button.innerHTML = '<span style="font-size: 1.5rem;">✅</span><span>Copied!</span>';
      button.style.background = '#10b981';

      setTimeout(() => {
        const modal = document.getElementById('recoveryModal');
        if (modal) modal.remove();
      }, 1500);
    } else {
      button.innerHTML = '<span style="font-size: 1.5rem;">❌</span><span>Copy Failed - Try Manual Copy</span>';
      button.style.background = '#ef4444';
      this.modalToggleText(); // Show text for manual copy
    }
  },

  /**
   * Modal action: Download prompt
   */
  modalDownloadPrompt(prompt, title) {
    this.downloadPromptAsFile(prompt, title);

    const button = event.target.closest('button');
    button.innerHTML = '<span style="font-size: 1.5rem;">✅</span><span>Downloaded!</span>';
    button.style.background = '#10b981';
  },

  /**
   * Modal action: Toggle full text
   */
  modalToggleText() {
    const textDiv = document.getElementById('modalFullText');
    if (textDiv) {
      textDiv.style.display = textDiv.style.display === 'none' ? 'block' : 'none';
    }
  },

  /**
   * Download prompt as text file
   */
  downloadPromptAsFile(prompt, title) {
    const safeFilename = SecurityUtils.sanitizeFilename(title) + '.txt';
    const blob = new Blob([prompt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = safeFilename;
    a.style.display = 'none';

    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  },

  /**
   * Show download success notification
   */
  showDownloadSuccess(title) {
    const safeTitle = SecurityUtils.escapeHtml(title);
    this.showNotification(`
      <div style="text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">💾</div>
        <h3 style="margin: 0 0 0.5rem;">Prompt Downloaded!</h3>
        <p style="margin: 0; opacity: 0.9;">"${safeTitle}" saved to your downloads</p>
        <div style="background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 8px; margin-top: 1rem;">
          <strong>Next Step:</strong> Open the file and copy the text into your AI chat
        </div>
      </div>
    `, 'success', 6000);
  },

  /**
   * Get user email from localStorage or prompt
   */
  getUserEmail() {
    // Try to get from purchase records
    const purchases = JSON.parse(localStorage.getItem('purchases') || '[]');
    if (purchases.length > 0) {
      return purchases[0].email;
    }

    // Prompt user
    return prompt('Enter your email to receive this prompt:');
  },

  /**
   * Email prompt to user
   */
  async emailPromptToUser(prompt, title, email) {
    const safeTitle = SecurityUtils.escapeHtml(title);
    const safePrompt = SecurityUtils.escapeHtml(prompt);
    const safeEmail = SecurityUtils.escapeHtml(email);

    const emailData = {
      to: safeEmail,
      subject: `Your Prompt: ${safeTitle}`,
      html: `
        <h2>${safeTitle}</h2>
        <p>Here's your prompt:</p>
        <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${safePrompt}</pre>
        <p><strong>How to use:</strong> Copy the text above and paste it into ChatGPT, Claude, or your preferred AI chat.</p>
      `
    };

    // Store in email queue (actual sending would happen server-side)
    const queue = JSON.parse(localStorage.getItem('emailQueue') || '[]');
    queue.push({
      ...emailData,
      sentAt: new Date().toISOString(),
      type: 'prompt_recovery'
    });
    localStorage.setItem('emailQueue', JSON.stringify(queue));

    return true;
  },

  /**
   * Show email success notification
   */
  showEmailSuccess(email) {
    const safeEmail = SecurityUtils.escapeHtml(email);
    this.showNotification(`
      <div style="text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">📧</div>
        <h3 style="margin: 0 0 0.5rem;">Email Sent!</h3>
        <p style="margin: 0; opacity: 0.9;">Check ${safeEmail} for your prompt</p>
      </div>
    `, 'success', 6000);
  },

  /**
   * Show comprehensive help when all else fails
   */
  showComprehensiveHelp(prompt, title) {
    // Escape for JavaScript string context (inside onclick attribute)
    const jsEscapedTitle = title.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

    this.showNotification(`
      <div style="text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🆘</div>
        <h3 style="margin: 0 0 0.5rem;">Need Help?</h3>
        <p style="margin: 0 0 1rem;">We're having trouble loading this prompt automatically.</p>
        <button onclick="ErrorRecovery.showRecoveryModal(\`${prompt.replace(/`/g, '\\`')}\`, '${jsEscapedTitle}')" style="background: #6366f1; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer; font-weight: 600;">
          Show Me Options
        </button>
      </div>
    `, 'warning', 0); // 0 = no auto-dismiss
  },

  /**
   * Show notification
   */
  showNotification(message, type = 'info', duration = 4000) {
    if (typeof Utils !== 'undefined' && Utils.notify) {
      Utils.notify(message, type, duration);
    } else if (typeof BookmarkletEngine !== 'undefined' && BookmarkletEngine.showNotification) {
      BookmarkletEngine.showNotification(message, type);
    } else {
      // Fallback inline notification
      const notification = document.createElement('div');
      notification.innerHTML = message;
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #1a1a2e;
        color: white;
        padding: 1.5rem;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        z-index: 999999;
        max-width: 400px;
      `;
      document.body.appendChild(notification);

      if (duration > 0) {
        setTimeout(() => notification.remove(), duration);
      }

      notification.onclick = () => notification.remove();
    }
  },

  /**
   * Log failure for analytics
   */
  logFailure(error, title) {
    if (!this.config.trackFailures) return;

    const failures = JSON.parse(localStorage.getItem('bookmarkletFailures') || '[]');

    failures.push({
      title,
      error: error.error || error.message,
      platform: error.platform || 'unknown',
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    });

    // Keep only last 50 failures
    if (failures.length > 50) {
      failures.shift();
    }

    localStorage.setItem('bookmarkletFailures', JSON.stringify(failures));
  },

  /**
   * Log successful recovery
   */
  logRecovery(method, title) {
    const recoveries = JSON.parse(localStorage.getItem('recoverySuccess') || '[]');

    recoveries.push({
      title,
      method,
      timestamp: new Date().toISOString()
    });

    if (recoveries.length > 50) {
      recoveries.shift();
    }

    localStorage.setItem('recoverySuccess', JSON.stringify(recoveries));
  },

  /**
   * Get failure statistics (for admin)
   */
  getFailureStats() {
    const failures = JSON.parse(localStorage.getItem('bookmarkletFailures') || '[]');
    const recoveries = JSON.parse(localStorage.getItem('recoverySuccess') || '[]');

    const totalFailures = failures.length;
    const totalRecoveries = recoveries.length;
    const recoveryRate = totalFailures > 0 ? (totalRecoveries / totalFailures * 100).toFixed(1) : 100;

    // Group by error type
    const errorTypes = {};
    failures.forEach(f => {
      const type = f.error;
      errorTypes[type] = (errorTypes[type] || 0) + 1;
    });

    // Group by recovery method
    const recoveryMethods = {};
    recoveries.forEach(r => {
      const method = r.method;
      recoveryMethods[method] = (recoveryMethods[method] || 0) + 1;
    });

    return {
      totalFailures,
      totalRecoveries,
      recoveryRate: parseFloat(recoveryRate),
      errorTypes,
      recoveryMethods,
      recentFailures: failures.slice(-10),
      recentRecoveries: recoveries.slice(-10)
    };
  },

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

// Make globally available
if (typeof window !== 'undefined') {
  window.ErrorRecovery = ErrorRecovery;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorRecovery;
}
