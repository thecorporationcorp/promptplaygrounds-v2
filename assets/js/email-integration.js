/**
 * EMAIL INTEGRATION - CLIENT SIDE
 *
 * Sends emails via serverless backend API
 * Integrates with system-monitor.js for alerts and reports
 */

const EmailIntegration = {
  // Configuration
  config: {
    apiEndpoint: null, // Set via setEndpoint() or auto-detect
    timeout: 10000, // 10 seconds
    retryAttempts: 3,
    retryDelay: 2000 // 2 seconds
  },

  // State
  state: {
    emailQueue: [],
    sending: false,
    lastSent: null,
    totalSent: 0,
    totalFailed: 0
  },

  /**
   * Initialize email integration
   */
  init(apiEndpoint = null) {
    this.config.apiEndpoint = apiEndpoint || this.detectEndpoint();

    // Load state from localStorage
    const savedState = SecurityUtils.safeLocalStorageGet('emailIntegration_state', null);
    if (savedState) {
      this.state = { ...this.state, ...savedState };
    }

    // Load queue from localStorage
    const savedQueue = SecurityUtils.safeLocalStorageGet('emailIntegration_queue', []);
    if (savedQueue.length > 0) {
      this.state.emailQueue = savedQueue;
      console.log(`📧 Loaded ${savedQueue.length} queued emails from storage`);
    }

    // Process queue on initialization
    this.processQueue();

    console.log('📧 Email integration initialized', {
      endpoint: this.config.apiEndpoint,
      queueSize: this.state.emailQueue.length
    });
  },

  /**
   * Auto-detect API endpoint based on current domain
   */
  detectEndpoint() {
    const currentDomain = window.location.origin;

    // Common serverless patterns
    // Vercel: /api/send-email
    // Netlify: /.netlify/functions/send-email
    // AWS Lambda: /api/send-email or custom domain

    // Default to Vercel pattern
    return `${currentDomain}/api/send-email`;
  },

  /**
   * Set custom API endpoint
   */
  setEndpoint(endpoint) {
    this.config.apiEndpoint = endpoint;
    console.log('📧 Email endpoint updated:', endpoint);
  },

  /**
   * Queue an email for sending
   */
  queueEmail(emailData) {
    const email = {
      id: this.generateEmailId(),
      to: emailData.to || 'thecorporationcorp@thecorporationcorp.com',
      subject: emailData.subject || 'Notification from PROMPT PLAYGROUNDZ',
      htmlBody: emailData.htmlBody || emailData.body || '',
      textBody: emailData.textBody || '',
      timestamp: new Date().toISOString(),
      attempts: 0,
      maxAttempts: this.config.retryAttempts,
      status: 'queued',
      type: emailData.type || 'notification'
    };

    this.state.emailQueue.push(email);
    this.persistState();
    this.persistQueue();

    console.log('📧 Email queued:', {
      id: email.id,
      subject: email.subject,
      type: email.type
    });

    // Try to send immediately
    this.processQueue();

    return email.id;
  },

  /**
   * Process the email queue
   */
  async processQueue() {
    if (this.state.sending) {
      console.log('📧 Already processing queue, skipping...');
      return;
    }

    if (this.state.emailQueue.length === 0) {
      return;
    }

    this.state.sending = true;

    while (this.state.emailQueue.length > 0) {
      const email = this.state.emailQueue[0];

      try {
        console.log(`📧 Sending email ${email.id}...`);
        await this.sendEmail(email);

        // Success - remove from queue
        this.state.emailQueue.shift();
        this.state.totalSent++;
        this.state.lastSent = new Date().toISOString();

        console.log(`✅ Email ${email.id} sent successfully`);

      } catch (error) {
        console.error(`❌ Email ${email.id} failed:`, error);

        email.attempts++;
        email.lastError = error.message;
        email.lastAttempt = new Date().toISOString();

        if (email.attempts >= email.maxAttempts) {
          // Max attempts reached - remove from queue
          console.error(`❌ Email ${email.id} failed permanently after ${email.attempts} attempts`);
          this.state.emailQueue.shift();
          this.state.totalFailed++;

          // Log to console for debugging
          this.logFailedEmail(email);
        } else {
          // Keep in queue for retry
          console.warn(`⚠️  Email ${email.id} will retry (attempt ${email.attempts}/${email.maxAttempts})`);

          // Wait before next attempt
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        }
      }

      this.persistState();
      this.persistQueue();
    }

    this.state.sending = false;
  },

  /**
   * Send a single email via API
   */
  async sendEmail(email) {
    if (!this.config.apiEndpoint) {
      throw new Error('Email API endpoint not configured');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: email.to,
          subject: email.subject,
          htmlBody: email.htmlBody,
          textBody: email.textBody
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Email send failed');
      }

      return result;

    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error('Email send timeout');
      }

      throw error;
    }
  },

  /**
   * Log failed email to console for debugging
   */
  logFailedEmail(email) {
    console.group('❌ FAILED EMAIL DETAILS');
    console.log('ID:', email.id);
    console.log('To:', email.to);
    console.log('Subject:', email.subject);
    console.log('Attempts:', email.attempts);
    console.log('Last Error:', email.lastError);
    console.log('Timestamp:', email.timestamp);
    console.log('Body Preview:', email.htmlBody.substring(0, 200) + '...');
    console.groupEnd();

    // Save to localStorage for manual review
    const failedEmails = SecurityUtils.safeLocalStorageGet('emailIntegration_failed', []);
    failedEmails.push(email);

    // Keep only last 10 failed emails
    if (failedEmails.length > 10) {
      failedEmails.shift();
    }

    SecurityUtils.safeLocalStorageSet('emailIntegration_failed', failedEmails);
  },

  /**
   * Generate unique email ID
   */
  generateEmailId() {
    return `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Get queue status
   */
  getStatus() {
    return {
      queueSize: this.state.emailQueue.length,
      sending: this.state.sending,
      lastSent: this.state.lastSent,
      totalSent: this.state.totalSent,
      totalFailed: this.state.totalFailed
    };
  },

  /**
   * Clear the queue (emergency use only)
   */
  clearQueue() {
    const count = this.state.emailQueue.length;
    this.state.emailQueue = [];
    this.persistQueue();
    console.warn(`⚠️  Cleared ${count} emails from queue`);
    return count;
  },

  /**
   * Retry failed emails
   */
  retryFailed() {
    const failedEmails = SecurityUtils.safeLocalStorageGet('emailIntegration_failed', []);

    if (failedEmails.length === 0) {
      console.log('📧 No failed emails to retry');
      return 0;
    }

    // Reset attempts and add back to queue
    failedEmails.forEach(email => {
      email.attempts = 0;
      email.status = 'queued';
      delete email.lastError;
      this.state.emailQueue.push(email);
    });

    // Clear failed list
    SecurityUtils.safeLocalStorageSet('emailIntegration_failed', []);

    this.persistQueue();
    this.processQueue();

    console.log(`📧 Retrying ${failedEmails.length} failed emails`);
    return failedEmails.length;
  },

  /**
   * Persist state to localStorage
   */
  persistState() {
    SecurityUtils.safeLocalStorageSet('emailIntegration_state', {
      lastSent: this.state.lastSent,
      totalSent: this.state.totalSent,
      totalFailed: this.state.totalFailed
    });
  },

  /**
   * Persist queue to localStorage
   */
  persistQueue() {
    SecurityUtils.safeLocalStorageSet('emailIntegration_queue', this.state.emailQueue);
  },

  /**
   * Test email integration
   */
  async testEmail() {
    console.log('📧 Sending test email...');

    const testEmailId = this.queueEmail({
      subject: '✅ Test Email from PROMPT PLAYGROUNDZ',
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #00ff41;">✅ Email Integration Test</h1>
          <p>This is a test email from the PROMPT PLAYGROUNDZ email integration system.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>Status:</strong> Email integration is working correctly!</p>
          <hr style="border: 1px solid #00ff41; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            This email was sent automatically by the PROMPT PLAYGROUNDZ monitoring system.
          </p>
        </div>
      `,
      textBody: `Email Integration Test\n\nThis is a test email from the PROMPT PLAYGROUNDZ email integration system.\n\nTimestamp: ${new Date().toISOString()}\nStatus: Email integration is working correctly!`,
      type: 'test'
    });

    return testEmailId;
  }
};

// Auto-initialize on load
if (typeof window !== 'undefined') {
  window.EmailIntegration = EmailIntegration;

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      EmailIntegration.init();
    });
  } else {
    EmailIntegration.init();
  }
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EmailIntegration;
}
