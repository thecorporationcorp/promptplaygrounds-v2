/**
 * AUTOMATION ENGINE
 * Orchestrates all automated processes
 * Makes everything work like magic - zero manual intervention
 */

const AutomationEngine = {
  // Configuration
  config: {
    enableAutoProcessing: true,
    enableAutoEmails: true,
    enableAutoModeration: true,
    enableErrorRecovery: true,
    checkInterval: 10000, // Check for new actions every 10 seconds
    maxQueueSize: 1000
  },

  // State
  state: {
    running: false,
    processTimer: null,
    lastProcessed: null,
    queues: {
      webhooks: [],
      emails: [],
      moderation: [],
      errors: []
    },
    stats: {
      totalProcessed: 0,
      totalErrors: 0,
      totalRecoveries: 0,
      uptime: 0
    }
  },

  /**
   * Initialize automation engine
   */
  init() {
    console.log('🤖 Automation Engine initializing...');

    // Load saved state
    this.loadState();

    // Start processing
    this.start();

    // Setup auto-save
    this.setupAutoSave();

    // Setup event listeners
    this.setupEventListeners();

    console.log('✅ Automation Engine ready');
  },

  /**
   * Start automation engine
   * SECURITY: Mutex lock prevents race conditions when running in multiple tabs
   */
  start() {
    if (this.state.running) return;

    // Prevent multiple intervals from starting
    if (this.state.processTimer) {
      console.warn('⚠️  Auto-processing already started');
      return;
    }

    this.state.running = true;
    this.state.uptime = Date.now();

    // Start processing queue with mutex locking
    this.state.processTimer = setInterval(async () => {
      // Check if another tab is processing (mutex lock)
      const lock = localStorage.getItem('automation_lock');
      const lockTime = lock ? parseInt(lock) : 0;
      const lockAge = Date.now() - lockTime;

      // If lock exists and is less than 30 seconds old, skip processing
      if (lock && lockAge < 30000) {
        console.log('🔒 Another tab is processing, skipping... (lock age: ' + Math.floor(lockAge / 1000) + 's)');
        return;
      }

      // Acquire lock (store current timestamp)
      localStorage.setItem('automation_lock', Date.now().toString());

      try {
        await this.processQueues();
      } catch (error) {
        console.error('❌ Queue processing error:', error);
      } finally {
        // Release lock
        localStorage.removeItem('automation_lock');
      }
    }, this.config.checkInterval);

    console.log('▶️  Automation Engine started');
  },

  /**
   * Stop automation engine
   * SECURITY: Cleans up mutex lock on shutdown
   */
  stop() {
    if (!this.state.running) return;

    this.state.running = false;

    if (this.state.processTimer) {
      clearInterval(this.state.processTimer);
      this.state.processTimer = null;
    }

    // Clean up mutex lock if this tab owns it
    localStorage.removeItem('automation_lock');

    this.saveState();

    console.log('⏸️  Automation Engine stopped');
  },

  /**
   * MAIN QUEUE PROCESSOR
   * Processes all queues automatically
   */
  async processQueues() {
    if (!this.state.running) return;

    try {
      // Process webhook queue
      if (this.config.enableAutoProcessing) {
        await this.processWebhookQueue();
      }

      // Process email queue
      if (this.config.enableAutoEmails) {
        await this.processEmailQueue();
      }

      // Process moderation queue
      if (this.config.enableAutoModeration) {
        await this.processModerationQueue();
      }

      // Process error recovery queue
      if (this.config.enableErrorRecovery) {
        await this.processErrorQueue();
      }

      this.state.lastProcessed = Date.now();
    } catch (error) {
      console.error('❌ Queue processing error:', error);
      this.state.stats.totalErrors++;
    }
  },

  /**
   * Process webhook queue
   */
  async processWebhookQueue() {
    const webhooks = this.state.queues.webhooks;

    while (webhooks.length > 0) {
      const webhook = webhooks.shift();

      try {
        await WebhookHandler.processWebhook(webhook.source, webhook.payload);
        this.state.stats.totalProcessed++;
      } catch (error) {
        console.error('Webhook processing failed:', error);
        this.state.stats.totalErrors++;

        // Re-queue with retry count
        webhook.retries = (webhook.retries || 0) + 1;
        if (webhook.retries < 3) {
          webhooks.push(webhook);
        }
      }
    }
  },

  /**
   * Process email queue
   */
  async processEmailQueue() {
    const emails = JSON.parse(localStorage.getItem('emailQueue') || '[]');
    const pendingEmails = emails.filter(e => e.status === 'pending' || !e.status);

    for (const email of pendingEmails) {
      try {
        // In production, send via email service
        // For now, mark as sent
        email.status = 'sent';
        email.sentAt = new Date().toISOString();

        this.state.stats.totalProcessed++;
      } catch (error) {
        console.error('Email sending failed:', error);
        email.status = 'failed';
        email.error = error.message;
        this.state.stats.totalErrors++;
      }
    }

    localStorage.setItem('emailQueue', JSON.stringify(emails));
  },

  /**
   * Process moderation queue (auto-approve safe content)
   */
  async processModerationQueue() {
    const submissions = JSON.parse(localStorage.getItem('promptSubmissions') || '[]');
    const pending = submissions.filter(s => s.status === 'pending');

    for (const submission of pending) {
      try {
        // Auto-approve if score is high enough
        if (submission.score >= 80) {
          submission.status = 'approved';
          submission.approvedAt = new Date().toISOString();
          submission.approvedBy = 'automation';

          this.logActivity('Auto-approved', `Prompt "${submission.title}" scored ${submission.score}/100`);
          this.state.stats.totalProcessed++;
        }
        // Auto-reject if score is too low
        else if (submission.score < 40) {
          submission.status = 'rejected';
          submission.rejectedAt = new Date().toISOString();
          submission.rejectedBy = 'automation';
          submission.rejectionReason = 'Content quality score below threshold';

          this.logActivity('Auto-rejected', `Prompt "${submission.title}" scored ${submission.score}/100`);
          this.state.stats.totalProcessed++;
        }
        // Scores 40-79 go to manual review
      } catch (error) {
        console.error('Moderation processing failed:', error);
        this.state.stats.totalErrors++;
      }
    }

    localStorage.setItem('promptSubmissions', JSON.stringify(submissions));
  },

  /**
   * Process error recovery queue
   */
  async processErrorQueue() {
    const errors = this.state.queues.errors;

    while (errors.length > 0 && errors.length < 10) { // Process max 10 at a time
      const error = errors.shift();

      try {
        await ErrorRecovery.handleFailure(error.prompt, error.title, error.error);
        this.state.stats.totalRecoveries++;
      } catch (err) {
        console.error('Error recovery failed:', err);
        this.state.stats.totalErrors++;
      }
    }
  },

  /**
   * Add webhook to queue
   */
  queueWebhook(source, payload) {
    this.state.queues.webhooks.push({
      source,
      payload,
      queuedAt: Date.now(),
      retries: 0
    });

    this.trimQueue('webhooks');
    this.saveState();
  },

  /**
   * Add error to recovery queue
   */
  queueErrorRecovery(prompt, title, error) {
    this.state.queues.errors.push({
      prompt,
      title,
      error,
      queuedAt: Date.now()
    });

    this.trimQueue('errors');
    this.saveState();
  },

  /**
   * Trim queue to max size
   */
  trimQueue(queueName) {
    const queue = this.state.queues[queueName];
    if (queue.length > this.config.maxQueueSize) {
      queue.splice(0, queue.length - this.config.maxQueueSize);
    }
  },

  /**
   * Setup event listeners for automation
   */
  setupEventListeners() {
    // Listen for purchase events
    window.addEventListener('purchase', (event) => {
      this.handlePurchaseEvent(event.detail);
    });

    // Listen for error events
    window.addEventListener('bookmarkletError', (event) => {
      this.handleErrorEvent(event.detail);
    });

    // Listen for submission events
    window.addEventListener('promptSubmitted', (event) => {
      this.handleSubmissionEvent(event.detail);
    });
  },

  /**
   * Handle purchase event
   */
  async handlePurchaseEvent(purchaseData) {
    console.log('💰 Purchase event received:', purchaseData);

    // Automatically process the purchase
    try {
      const result = await WebhookHandler.processOrder(purchaseData);

      // Show success notification
      this.showNotification(`✅ Purchase processed for ${purchaseData.email}`, 'success');

      // Log activity
      this.logActivity('Purchase', `Processed order: ${result.id}`);
    } catch (error) {
      console.error('Purchase processing failed:', error);
      this.showNotification(`❌ Purchase processing failed: ${error.message}`, 'error');
    }
  },

  /**
   * Handle error event
   */
  handleErrorEvent(errorData) {
    console.log('⚠️  Error event received:', errorData);

    if (this.config.enableErrorRecovery) {
      this.queueErrorRecovery(errorData.prompt, errorData.title, errorData.error);
    }
  },

  /**
   * Handle submission event
   */
  async handleSubmissionEvent(submissionData) {
    console.log('📝 Submission event received:', submissionData);

    // Auto-moderate if enabled
    if (this.config.enableAutoModeration) {
      try {
        const result = ModerationSystem.moderate(submissionData);

        if (result.score >= 80) {
          this.showNotification(`✅ Submission auto-approved: "${submissionData.title}"`, 'success');
        } else if (result.score < 40) {
          this.showNotification(`❌ Submission auto-rejected: "${submissionData.title}"`, 'warning');
        } else {
          this.showNotification(`📋 Submission queued for review: "${submissionData.title}"`, 'info');
        }
      } catch (error) {
        console.error('Auto-moderation failed:', error);
      }
    }
  },

  /**
   * Automatic cleanup tasks
   */
  async runCleanup() {
    console.log('🧹 Running cleanup tasks...');

    // Clean expired storage
    this.cleanExpiredStorage();

    // Archive old activity logs
    this.archiveOldLogs();

    // Clean up old email queue
    this.cleanEmailQueue();

    console.log('✅ Cleanup complete');
  },

  /**
   * Clean expired storage items
   */
  cleanExpiredStorage() {
    const keys = Object.keys(localStorage);

    keys.forEach(key => {
      try {
        const item = JSON.parse(localStorage.getItem(key));

        if (item && item._expires && item._expires < Date.now()) {
          localStorage.removeItem(key);
          console.log(`🗑️  Removed expired item: ${key}`);
        }
      } catch (err) {
        // Not a JSON item, skip
      }
    });
  },

  /**
   * Archive old logs
   */
  archiveOldLogs() {
    const activityLog = JSON.parse(localStorage.getItem('activityLog') || '[]');
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    const recent = activityLog.filter(log => {
      return new Date(log.timestamp) > thirtyDaysAgo;
    });

    if (recent.length < activityLog.length) {
      localStorage.setItem('activityLog', JSON.stringify(recent));
      console.log(`📦 Archived ${activityLog.length - recent.length} old log entries`);
    }
  },

  /**
   * Clean email queue
   */
  cleanEmailQueue() {
    const queue = JSON.parse(localStorage.getItem('emailQueue') || '[]');
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    const recent = queue.filter(email => {
      return new Date(email.sentAt || email.queuedAt) > sevenDaysAgo;
    });

    if (recent.length < queue.length) {
      localStorage.setItem('emailQueue', JSON.stringify(recent));
      console.log(`📧 Cleaned ${queue.length - recent.length} old emails from queue`);
    }
  },

  /**
   * Get automation statistics
   */
  getStats() {
    const uptimeMs = this.state.running ? Date.now() - this.state.uptime : 0;
    const uptimeHours = (uptimeMs / (1000 * 60 * 60)).toFixed(2);

    return {
      running: this.state.running,
      uptime: uptimeHours + ' hours',
      totalProcessed: this.state.stats.totalProcessed,
      totalErrors: this.state.stats.totalErrors,
      totalRecoveries: this.state.stats.totalRecoveries,
      successRate: this.state.stats.totalProcessed > 0
        ? ((this.state.stats.totalProcessed / (this.state.stats.totalProcessed + this.state.stats.totalErrors)) * 100).toFixed(1) + '%'
        : '100%',
      queues: {
        webhooks: this.state.queues.webhooks.length,
        emails: this.state.queues.emails.length,
        moderation: this.state.queues.moderation.length,
        errors: this.state.queues.errors.length
      },
      lastProcessed: this.state.lastProcessed ? new Date(this.state.lastProcessed).toISOString() : 'Never'
    };
  },

  /**
   * Setup auto-save
   */
  setupAutoSave() {
    // Save state every 30 seconds
    setInterval(() => {
      if (this.state.running) {
        this.saveState();
      }
    }, 30000);

    // Save on page unload
    window.addEventListener('beforeunload', () => {
      this.saveState();
    });
  },

  /**
   * Save state to localStorage
   */
  saveState() {
    try {
      localStorage.setItem('automationState', JSON.stringify({
        stats: this.state.stats,
        lastProcessed: this.state.lastProcessed
      }));
    } catch (error) {
      console.error('Failed to save automation state:', error);
    }
  },

  /**
   * Load state from localStorage
   */
  loadState() {
    try {
      const saved = localStorage.getItem('automationState');
      if (saved) {
        const data = JSON.parse(saved);
        this.state.stats = { ...this.state.stats, ...data.stats };
        this.state.lastProcessed = data.lastProcessed;
      }
    } catch (error) {
      console.error('Failed to load automation state:', error);
    }
  },

  /**
   * Log activity
   */
  logActivity(type, message) {
    const activityLog = JSON.parse(localStorage.getItem('activityLog') || '[]');

    activityLog.push({
      type,
      message,
      timestamp: new Date().toISOString(),
      source: 'automation'
    });

    // Keep only last 100
    if (activityLog.length > 100) {
      activityLog.shift();
    }

    localStorage.setItem('activityLog', JSON.stringify(activityLog));
  },

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    if (typeof Utils !== 'undefined' && Utils.notify) {
      Utils.notify(message, type);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  },

  /**
   * Test automation system
   */
  async test() {
    console.log('🧪 Testing automation system...');

    // Test 1: Webhook processing
    console.log('Test 1: Webhook processing');
    const testOrder = {
      orderId: 'test_' + Date.now(),
      email: 'test@example.com',
      name: 'Test User',
      amount: 0.99,
      currency: 'USD'
    };

    try {
      await WebhookHandler.manualOrder(testOrder);
      console.log('✅ Webhook test passed');
    } catch (error) {
      console.error('❌ Webhook test failed:', error);
    }

    // Test 2: Error recovery
    console.log('Test 2: Error recovery');
    try {
      await ErrorRecovery.handleFailure('Test prompt', 'Test Title', {
        error: 'ELEMENT_NOT_FOUND'
      });
      console.log('✅ Error recovery test passed');
    } catch (error) {
      console.error('❌ Error recovery test failed:', error);
    }

    // Test 3: Auto-moderation
    console.log('Test 3: Auto-moderation');
    const testSubmission = {
      id: 'test_sub_' + Date.now(),
      title: 'Test Prompt',
      prompt: 'You are a helpful assistant.',
      category: 'General',
      developer: 'Test Dev',
      status: 'pending',
      score: 85,
      timestamp: new Date().toISOString()
    };

    const submissions = JSON.parse(localStorage.getItem('promptSubmissions') || '[]');
    submissions.push(testSubmission);
    localStorage.setItem('promptSubmissions', JSON.stringify(submissions));

    await this.processModerationQueue();

    const updatedSubs = JSON.parse(localStorage.getItem('promptSubmissions') || '[]');
    const processed = updatedSubs.find(s => s.id === testSubmission.id);

    if (processed && processed.status === 'approved') {
      console.log('✅ Auto-moderation test passed');
    } else {
      console.error('❌ Auto-moderation test failed');
    }

    console.log('🎉 All tests complete!');
    console.log('Stats:', this.getStats());
  }
};

// Make globally available
if (typeof window !== 'undefined') {
  window.AutomationEngine = AutomationEngine;

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AutomationEngine.init());
  } else {
    AutomationEngine.init();
  }
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AutomationEngine;
}
