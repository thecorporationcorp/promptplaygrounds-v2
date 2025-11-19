/**
 * SYSTEM-WIDE MONITORING & HEALTH CHECK FRAMEWORK
 * Production-grade monitoring with real-time alerts and daily reports
 * Email notifications to: thecorporationcorp@thecorporationcorp.com
 */

const SystemMonitor = {
  // Configuration
  config: {
    healthCheckInterval: 60000, // 1 minute
    alertEmail: 'thecorporationcorp@thecorporationcorp.com',
    criticalThresholds: {
      errorRate: 0.05, // 5% error rate triggers alert
      loadTime: 3000, // 3s load time triggers alert
      apiLatency: 2000, // 2s API latency triggers alert
      failureStreak: 3 // 3 consecutive failures triggers alert
    },
    reportSchedule: '09:00', // Daily report time (24h format)
    trackingEnabled: true
  },

  // State
  state: {
    initialized: false,
    lastHealthCheck: null,
    consecutiveFailures: 0,
    systemHealth: 'unknown',
    activeAlerts: [],
    metrics: {
      errors: [],
      performance: [],
      api: [],
      users: []
    }
  },

  /**
   * Initialize monitoring system
   */
  init() {
    if (this.state.initialized) return;

    console.log('🔍 Initializing System Monitor...');

    // Start health checks
    this.startHealthChecks();

    // Set up error tracking
    this.setupGlobalErrorHandler();

    // Set up performance monitoring
    this.setupPerformanceMonitoring();

    // Schedule daily reports
    this.scheduleDailyReport();

    // Set up API monitoring
    this.setupAPIMonitoring();

    // Recovery from localStorage
    this.loadPersistedState();

    this.state.initialized = true;
    console.log('✅ System Monitor initialized');

    // Initial health check
    this.performHealthCheck();
  },

  /**
   * Start periodic health checks
   */
  startHealthChecks() {
    setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);

    // Also check on visibility change (tab becomes active)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.performHealthCheck();
      }
    });
  },

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck() {
    this.state.lastHealthCheck = new Date().toISOString();

    const checks = {
      localStorage: this.checkLocalStorage(),
      prompts: await this.checkPromptsLoading(),
      auth: this.checkAuthSystem(),
      cheatCodez: this.checkCheatCodez(),
      performance: this.checkPerformance(),
      api: await this.checkAPIHealth(),
      dom: this.checkDOMIntegrity()
    };

    const failedChecks = Object.entries(checks).filter(([, status]) => !status.healthy);

    if (failedChecks.length === 0) {
      this.state.systemHealth = 'healthy';
      this.state.consecutiveFailures = 0;
    } else {
      this.state.systemHealth = 'degraded';
      this.state.consecutiveFailures++;

      // Log failures
      failedChecks.forEach(([check, status]) => {
        this.logError('HEALTH_CHECK_FAILED', `${check}: ${status.reason}`, 'critical');
      });

      // Send alert if critical
      if (this.state.consecutiveFailures >= this.config.criticalThresholds.failureStreak) {
        this.sendCriticalAlert('Multiple consecutive health check failures', {
          failedChecks: failedChecks.map(([name, status]) => ({ name, reason: status.reason })),
          consecutiveFailures: this.state.consecutiveFailures
        });
      }
    }

    // Persist state
    this.persistState();

    return {
      timestamp: this.state.lastHealthCheck,
      status: this.state.systemHealth,
      checks,
      failedChecks: failedChecks.length
    };
  },

  /**
   * Check localStorage availability and quota
   */
  checkLocalStorage() {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);

      // Check quota usage
      const used = new Blob(Object.values(localStorage)).size;
      const quota = 5 * 1024 * 1024; // 5MB typical quota
      const usage = (used / quota * 100).toFixed(1);

      if (usage > 90) {
        return {
          healthy: false,
          reason: `localStorage ${usage}% full - critical!`,
          usage
        };
      } else if (usage > 75) {
        return {
          healthy: true,
          warning: `localStorage ${usage}% full`,
          usage
        };
      }

      return { healthy: true, usage };
    } catch (error) {
      return {
        healthy: false,
        reason: `localStorage unavailable: ${error.message}`
      };
    }
  },

  /**
   * Check prompts loading
   */
  async checkPromptsLoading() {
    try {
      const response = await fetch('assets/data/prompts.json', {
        method: 'HEAD',
        cache: 'no-cache'
      });

      if (!response.ok) {
        return {
          healthy: false,
          reason: `Prompts file returned ${response.status}`
        };
      }

      // Check if PromptPlayground has loaded prompts
      if (typeof PromptPlayground !== 'undefined' && PromptPlayground.prompts.length === 0) {
        return {
          healthy: false,
          reason: 'PromptPlayground has no prompts loaded'
        };
      }

      return { healthy: true };
    } catch (error) {
      return {
        healthy: false,
        reason: `Failed to check prompts: ${error.message}`
      };
    }
  },

  /**
   * Check auth system
   */
  checkAuthSystem() {
    try {
      if (typeof AuthSystem === 'undefined') {
        return {
          healthy: false,
          reason: 'AuthSystem not loaded'
        };
      }

      if (!AuthSystem.validCodes || AuthSystem.validCodes.length === 0) {
        return {
          healthy: false,
          reason: 'No valid access codes configured'
        };
      }

      return { healthy: true };
    } catch (error) {
      return {
        healthy: false,
        reason: `Auth check failed: ${error.message}`
      };
    }
  },

  /**
   * Check Cheat Codez system
   */
  checkCheatCodez() {
    try {
      if (typeof CheatCodez === 'undefined') {
        // Not on cheat-codez page, skip check
        return { healthy: true, skipped: true };
      }

      // Check if API key is configured (optional)
      const hasAPIKey = !!localStorage.getItem('cheatCodezAPIKey');

      // Check credits system
      if (!CheatCodez.state) {
        return {
          healthy: false,
          reason: 'CheatCodez state not initialized'
        };
      }

      return {
        healthy: true,
        apiConfigured: hasAPIKey,
        creditsRemaining: CheatCodez.state.creditsRemaining
      };
    } catch (error) {
      return {
        healthy: false,
        reason: `CheatCodez check failed: ${error.message}`
      };
    }
  },

  /**
   * Check performance metrics
   */
  checkPerformance() {
    try {
      if (typeof performance === 'undefined') {
        return { healthy: true, noData: true };
      }

      const navigation = performance.getEntriesByType('navigation')[0];
      if (!navigation) {
        return { healthy: true, noData: true };
      }

      const loadTime = navigation.loadEventEnd - navigation.fetchStart;
      const domReady = navigation.domContentLoadedEventEnd - navigation.fetchStart;

      if (loadTime > this.config.criticalThresholds.loadTime) {
        return {
          healthy: false,
          reason: `Page load time ${(loadTime / 1000).toFixed(2)}s exceeds threshold`,
          loadTime,
          domReady
        };
      }

      return {
        healthy: true,
        loadTime,
        domReady
      };
    } catch (error) {
      return {
        healthy: true,
        error: error.message
      };
    }
  },

  /**
   * Check API health (OpenAI for Cheat Codez)
   */
  async checkAPIHealth() {
    // Only check if on Cheat Codez page and API key exists
    if (typeof CheatCodez === 'undefined') {
      return { healthy: true, skipped: true };
    }

    const apiKey = localStorage.getItem('cheatCodezAPIKey');
    if (!apiKey) {
      return { healthy: true, noAPIKey: true };
    }

    try {
      // Simple health check - just verify key format
      if (!apiKey.startsWith('sk-')) {
        return {
          healthy: false,
          reason: 'Invalid API key format'
        };
      }

      // Don't actually call API in health check (costs money)
      // Just verify the key exists and looks valid
      return { healthy: true, apiConfigured: true };
    } catch (error) {
      return {
        healthy: false,
        reason: `API check failed: ${error.message}`
      };
    }
  },

  /**
   * Check DOM integrity
   */
  checkDOMIntegrity() {
    try {
      // Check critical elements exist
      const criticalSelectors = [
        'nav.navbar',
        '.container, .cheat-container, .filez-container'
      ];

      const missing = criticalSelectors.filter(selector => !document.querySelector(selector));

      if (missing.length > 0) {
        return {
          healthy: false,
          reason: `Missing critical elements: ${missing.join(', ')}`
        };
      }

      return { healthy: true };
    } catch (error) {
      return {
        healthy: false,
        reason: `DOM check failed: ${error.message}`
      };
    }
  },

  /**
   * Global error handler
   */
  setupGlobalErrorHandler() {
    // Catch all uncaught errors
    window.addEventListener('error', (event) => {
      this.logError('UNCAUGHT_ERROR', event.message, 'error', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError('UNHANDLED_REJECTION', event.reason, 'error', {
        promise: event.promise
      });
    });

    // Intercept console.error
    const originalError = console.error;
    console.error = (...args) => {
      this.logError('CONSOLE_ERROR', args.join(' '), 'warning');
      originalError.apply(console, args);
    };
  },

  /**
   * Performance monitoring
   */
  setupPerformanceMonitoring() {
    // Monitor resource timing
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 1000) { // Slow resources > 1s
              this.logMetric('SLOW_RESOURCE', {
                name: entry.name,
                duration: entry.duration,
                type: entry.initiatorType
              });
            }
          }
        });

        observer.observe({ entryTypes: ['resource', 'navigation'] });
      } catch (error) {
        console.warn('PerformanceObserver not available:', error);
      }
    }

    // Monitor long tasks
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.logMetric('LONG_TASK', {
              duration: entry.duration,
              startTime: entry.startTime
            });
          }
        });

        observer.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        // Long task API not supported in all browsers
      }
    }
  },

  /**
   * API call monitoring
   */
  setupAPIMonitoring() {
    // Intercept fetch calls
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = Date.now();
      const url = args[0];

      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;

        // Log slow API calls
        if (duration > this.config.criticalThresholds.apiLatency) {
          this.logMetric('SLOW_API_CALL', {
            url,
            duration,
            status: response.status
          });
        }

        // Log API errors
        if (!response.ok) {
          this.logError('API_ERROR', `${url} returned ${response.status}`, 'warning', {
            url,
            status: response.status,
            statusText: response.statusText
          });
        }

        return response;
      } catch (error) {
        const duration = Date.now() - startTime;

        this.logError('API_FAILURE', `${url} failed: ${error.message}`, 'error', {
          url,
          duration,
          error: error.message
        });

        throw error;
      }
    };
  },

  /**
   * Log error with context
   */
  logError(type, message, severity = 'error', context = {}) {
    if (!this.config.trackingEnabled) return;

    const error = {
      type,
      message,
      severity,
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.state.metrics.errors.push(error);

    // Keep only last 100 errors
    if (this.state.metrics.errors.length > 100) {
      this.state.metrics.errors = this.state.metrics.errors.slice(-100);
    }

    // Send immediate alert for critical errors
    if (severity === 'critical') {
      this.sendCriticalAlert(message, context);
    }

    // Persist
    this.persistErrors();

    console.error(`[${severity.toUpperCase()}] ${type}:`, message, context);
  },

  /**
   * Log performance metric
   */
  logMetric(type, data) {
    if (!this.config.trackingEnabled) return;

    const metric = {
      type,
      data,
      timestamp: new Date().toISOString()
    };

    this.state.metrics.performance.push(metric);

    // Keep only last 50 metrics
    if (this.state.metrics.performance.length > 50) {
      this.state.metrics.performance = this.state.metrics.performance.slice(-50);
    }
  },

  /**
   * Send critical alert email
   */
  async sendCriticalAlert(subject, details) {
    const alert = {
      to: this.config.alertEmail,
      subject: `🚨 CRITICAL: ${subject}`,
      body: this.formatAlertEmail(subject, details),
      timestamp: new Date().toISOString(),
      type: 'critical_alert'
    };

    // Add to active alerts
    this.state.activeAlerts.push(alert);

    // Queue for sending
    this.queueEmail(alert);

    console.error('🚨 CRITICAL ALERT:', subject, details);
  },

  /**
   * Format alert email
   */
  formatAlertEmail(subject, details) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .alert { background: #fee; border-left: 4px solid #f00; padding: 20px; margin: 20px 0; }
          .details { background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 15px 0; }
          pre { background: #000; color: #0f0; padding: 15px; border-radius: 4px; overflow-x: auto; }
          .timestamp { color: #666; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <div class="alert">
          <h2>🚨 Critical Alert: ${SecurityUtils.escapeHtml(subject)}</h2>
          <p class="timestamp">Time: ${new Date().toLocaleString()}</p>
        </div>

        <div class="details">
          <h3>Details:</h3>
          <pre>${JSON.stringify(details, null, 2)}</pre>
        </div>

        <div class="details">
          <h3>System Status:</h3>
          <ul>
            <li><strong>Health:</strong> ${this.state.systemHealth}</li>
            <li><strong>Consecutive Failures:</strong> ${this.state.consecutiveFailures}</li>
            <li><strong>Active Alerts:</strong> ${this.state.activeAlerts.length}</li>
            <li><strong>URL:</strong> ${window.location.href}</li>
            <li><strong>User Agent:</strong> ${navigator.userAgent}</li>
          </ul>
        </div>

        <div class="details">
          <h3>Recent Errors (last 5):</h3>
          <pre>${JSON.stringify(this.state.metrics.errors.slice(-5), null, 2)}</pre>
        </div>

        <hr>
        <p style="color: #666; font-size: 0.9em;">
          This is an automated alert from PROMPT PLAYGROUNDZ System Monitor.<br>
          Generated: ${new Date().toISOString()}
        </p>
      </body>
      </html>
    `;
  },

  /**
   * Generate daily report
   */
  generateDailyReport() {
    const now = new Date();
    const yesterday = new Date(now - 24 * 60 * 60 * 1000);

    // Filter metrics from last 24 hours
    const recentErrors = this.state.metrics.errors.filter(e =>
      new Date(e.timestamp) > yesterday
    );

    const recentMetrics = this.state.metrics.performance.filter(m =>
      new Date(m.timestamp) > yesterday
    );

    // Calculate statistics
    const stats = {
      totalErrors: recentErrors.length,
      errorsBySeverity: this.groupBy(recentErrors, 'severity'),
      errorsByType: this.groupBy(recentErrors, 'type'),
      slowResources: recentMetrics.filter(m => m.type === 'SLOW_RESOURCE').length,
      slowAPICalls: recentMetrics.filter(m => m.type === 'SLOW_API_CALL').length,
      longTasks: recentMetrics.filter(m => m.type === 'LONG_TASK').length,
      systemHealth: this.state.systemHealth,
      uptime: this.calculateUptime()
    };

    // Get usage stats
    const usageStats = this.getUsageStats();

    const report = {
      date: now.toISOString().split('T')[0],
      generatedAt: now.toISOString(),
      stats,
      usageStats,
      recentErrors: recentErrors.slice(-10),
      recommendations: this.generateRecommendations(stats)
    };

    return report;
  },

  /**
   * Send daily report email
   */
  async sendDailyReport() {
    const report = this.generateDailyReport();

    const email = {
      to: this.config.alertEmail,
      subject: `📊 Daily Report: PROMPT PLAYGROUNDZ - ${report.date}`,
      body: this.formatDailyReportEmail(report),
      timestamp: new Date().toISOString(),
      type: 'daily_report'
    };

    this.queueEmail(email);

    console.log('📊 Daily report generated and queued:', report.date);

    return report;
  },

  /**
   * Format daily report email
   */
  formatDailyReportEmail(report) {
    const healthColor = {
      healthy: '#10b981',
      degraded: '#f59e0b',
      critical: '#ef4444'
    }[report.stats.systemHealth] || '#6b7280';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
          .container { max-width: 800px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .section { padding: 20px 30px; border-bottom: 1px solid #e5e7eb; }
          .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
          .stat-card { background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #6366f1; }
          .stat-value { font-size: 2em; font-weight: bold; color: #6366f1; }
          .stat-label { color: #6b7280; font-size: 0.9em; margin-top: 5px; }
          .health-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; color: white; }
          pre { background: #1f2937; color: #10b981; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 0.85em; }
          .recommendation { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 10px 0; border-radius: 4px; }
          .footer { padding: 20px 30px; text-align: center; color: #6b7280; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Daily System Report</h1>
            <p>${report.date}</p>
            <p style="opacity: 0.9;">PROMPT PLAYGROUNDZ</p>
          </div>

          <div class="section">
            <h2>System Health</h2>
            <div style="text-align: center; margin: 20px 0;">
              <span class="health-badge" style="background: ${healthColor};">
                ${report.stats.systemHealth.toUpperCase()}
              </span>
            </div>
            <p><strong>Uptime:</strong> ${report.stats.uptime}</p>
          </div>

          <div class="section">
            <h2>Error Summary (Last 24 Hours)</h2>
            <div class="stat-grid">
              <div class="stat-card">
                <div class="stat-value">${report.stats.totalErrors}</div>
                <div class="stat-label">Total Errors</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${report.stats.errorsBySeverity.critical || 0}</div>
                <div class="stat-label">Critical</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${report.stats.errorsBySeverity.error || 0}</div>
                <div class="stat-label">Errors</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${report.stats.errorsBySeverity.warning || 0}</div>
                <div class="stat-label">Warnings</div>
              </div>
            </div>

            ${report.stats.totalErrors > 0 ? `
              <h3>Error Breakdown:</h3>
              <pre>${JSON.stringify(report.stats.errorsByType, null, 2)}</pre>
            ` : '<p style="color: #10b981; font-weight: bold;">✅ No errors in the last 24 hours!</p>'}
          </div>

          <div class="section">
            <h2>Performance Metrics</h2>
            <div class="stat-grid">
              <div class="stat-card">
                <div class="stat-value">${report.stats.slowResources}</div>
                <div class="stat-label">Slow Resources</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${report.stats.slowAPICalls}</div>
                <div class="stat-label">Slow API Calls</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${report.stats.longTasks}</div>
                <div class="stat-label">Long Tasks</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>Usage Statistics</h2>
            <div class="stat-grid">
              <div class="stat-card">
                <div class="stat-value">${report.usageStats.promptViews || 0}</div>
                <div class="stat-label">Prompt Views</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${report.usageStats.cheatCodezGenerations || 0}</div>
                <div class="stat-label">Cheat Codez Generated</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${report.usageStats.bookmarkletInstalls || 0}</div>
                <div class="stat-label">Bookmarklet Installs</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${report.usageStats.activeUsers || 0}</div>
                <div class="stat-label">Active Users</div>
              </div>
            </div>
          </div>

          ${report.recommendations.length > 0 ? `
            <div class="section">
              <h2>Recommendations</h2>
              ${report.recommendations.map(rec => `
                <div class="recommendation">
                  <strong>${rec.title}</strong><br>
                  ${rec.description}
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${report.recentErrors.length > 0 ? `
            <div class="section">
              <h2>Recent Errors (Last 10)</h2>
              <pre>${JSON.stringify(report.recentErrors, null, 2)}</pre>
            </div>
          ` : ''}

          <div class="footer">
            <p>Generated: ${new Date(report.generatedAt).toLocaleString()}</p>
            <p>PROMPT PLAYGROUNDZ System Monitor v1.0</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  /**
   * Generate recommendations based on stats
   */
  generateRecommendations(stats) {
    const recommendations = [];

    if (stats.totalErrors > 50) {
      recommendations.push({
        title: '⚠️ High Error Rate',
        description: `${stats.totalErrors} errors in last 24h. Review error logs and implement fixes.`
      });
    }

    if (stats.slowResources > 10) {
      recommendations.push({
        title: '🐌 Slow Resources',
        description: `${stats.slowResources} resources took >1s to load. Consider optimization or CDN.`
      });
    }

    if (stats.slowAPICalls > 5) {
      recommendations.push({
        title: '🕐 Slow API Calls',
        description: `${stats.slowAPICalls} API calls exceeded 2s. Check OpenAI API performance or implement caching.`
      });
    }

    if (stats.systemHealth !== 'healthy') {
      recommendations.push({
        title: '🔴 System Health Degraded',
        description: 'Run immediate health check and review console logs for root cause.'
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        title: '✅ All Systems Nominal',
        description: 'No issues detected. System is running smoothly.'
      });
    }

    return recommendations;
  },

  /**
   * Get usage statistics
   */
  getUsageStats() {
    return {
      promptViews: JSON.parse(localStorage.getItem('promptViews') || '[]').length,
      cheatCodezGenerations: JSON.parse(localStorage.getItem('cheatCodezHistory') || '[]').length,
      bookmarkletInstalls: JSON.parse(localStorage.getItem('bookmarkletInstalls') || '[]').length,
      activeUsers: this.countActiveUsers(),
      purchases: JSON.parse(localStorage.getItem('purchasedPrompts') || '[]').length
    };
  },

  /**
   * Count active users (unique session IDs in last 24h)
   */
  countActiveUsers() {
    const sessions = JSON.parse(localStorage.getItem('userSessions') || '[]');
    const yesterday = Date.now() - 24 * 60 * 60 * 1000;
    return sessions.filter(s => new Date(s.timestamp) > yesterday).length;
  },

  /**
   * Schedule daily report
   */
  scheduleDailyReport() {
    const scheduleTime = this.config.reportSchedule.split(':');
    const targetHour = parseInt(scheduleTime[0]);
    const targetMinute = parseInt(scheduleTime[1] || 0);

    const checkAndSend = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      if (currentHour === targetHour && currentMinute === targetMinute) {
        const lastReport = localStorage.getItem('lastDailyReport');
        const today = now.toISOString().split('T')[0];

        // Only send once per day
        if (lastReport !== today) {
          this.sendDailyReport();
          localStorage.setItem('lastDailyReport', today);
        }
      }
    };

    // Check every minute
    setInterval(checkAndSend, 60000);

    // Also check immediately
    checkAndSend();
  },

  /**
   * Queue email for sending
   */
  queueEmail(email) {
    // Use EmailIntegration if available, otherwise fallback to localStorage
    if (typeof EmailIntegration !== 'undefined' && EmailIntegration.queueEmail) {
      EmailIntegration.queueEmail({
        to: email.to || this.config.alertEmail,
        subject: email.subject,
        htmlBody: email.body,
        textBody: email.body ? email.body.replace(/<[^>]*>/g, '') : '',
        type: email.type || 'notification'
      });
      console.log('📧 Email queued via EmailIntegration:', email.subject);
    } else {
      // Fallback: Store in localStorage for manual review
      const queue = JSON.parse(localStorage.getItem('emailQueue') || '[]');
      queue.push(email);

      // Keep only last 100 emails
      if (queue.length > 100) {
        queue.shift();
      }

      localStorage.setItem('emailQueue', JSON.stringify(queue));
      console.log('📧 Email queued to localStorage (EmailIntegration not available):', email.subject);
    }
  },

  /**
   * Calculate uptime percentage
   */
  calculateUptime() {
    const healthChecks = this.state.metrics.errors.filter(e => e.type === 'HEALTH_CHECK_FAILED');
    const totalChecks = Math.floor((Date.now() - (this.state.metrics.errors[0]?.timestamp || Date.now())) / this.config.healthCheckInterval);

    if (totalChecks === 0) return '100%';

    const uptime = ((totalChecks - healthChecks.length) / totalChecks * 100).toFixed(2);
    return `${uptime}%`;
  },

  /**
   * Group array by property
   */
  groupBy(array, property) {
    return array.reduce((acc, item) => {
      const key = item[property] || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  },

  /**
   * Persist state to localStorage
   */
  persistState() {
    try {
      localStorage.setItem('systemMonitorState', JSON.stringify({
        lastHealthCheck: this.state.lastHealthCheck,
        systemHealth: this.state.systemHealth,
        consecutiveFailures: this.state.consecutiveFailures,
        activeAlerts: this.state.activeAlerts
      }));
    } catch (error) {
      console.error('Failed to persist monitor state:', error);
    }
  },

  /**
   * Persist errors separately (can be large)
   */
  persistErrors() {
    try {
      localStorage.setItem('systemErrors', JSON.stringify(this.state.metrics.errors));
    } catch (error) {
      console.error('Failed to persist errors:', error);
    }
  },

  /**
   * Load persisted state
   */
  loadPersistedState() {
    try {
      const state = JSON.parse(localStorage.getItem('systemMonitorState') || '{}');
      Object.assign(this.state, state);

      const errors = JSON.parse(localStorage.getItem('systemErrors') || '[]');
      this.state.metrics.errors = errors;
    } catch (error) {
      console.error('Failed to load persisted state:', error);
    }
  },

  /**
   * Get system report (for admin dashboard)
   */
  getSystemReport() {
    return {
      status: this.state.systemHealth,
      lastHealthCheck: this.state.lastHealthCheck,
      consecutiveFailures: this.state.consecutiveFailures,
      activeAlerts: this.state.activeAlerts,
      errorCount: this.state.metrics.errors.length,
      recentErrors: this.state.metrics.errors.slice(-10),
      performance: this.state.metrics.performance.slice(-10),
      uptime: this.calculateUptime(),
      usageStats: this.getUsageStats()
    };
  },

  /**
   * Clear all data (for testing/reset)
   */
  clearAll() {
    this.state.metrics = { errors: [], performance: [], api: [], users: [] };
    this.state.activeAlerts = [];
    this.state.consecutiveFailures = 0;
    localStorage.removeItem('systemMonitorState');
    localStorage.removeItem('systemErrors');
    localStorage.removeItem('emailQueue');
    console.log('🗑️ System monitor data cleared');
  }
};

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => SystemMonitor.init());
} else {
  SystemMonitor.init();
}

// Make globally available
window.SystemMonitor = SystemMonitor;

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SystemMonitor;
}
