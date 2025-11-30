/**
 * ADMIN CONTROL PANEL - MASTER BACKEND
 * Complete control system for PROMPT PLAYGROUNDZs creator
 *
 * ⚠️ CRITICAL SECURITY WARNING ⚠️
 * This is CLIENT-SIDE authentication only - suitable for MVP/demo.
 * For production with real users:
 * 1. Move authentication to server-side (see INTEGRITY_REPORT.md)
 * 2. IMMEDIATELY change the masterPassword below
 * 3. Do NOT commit the password to git
 * 4. Consider implementing proper backend auth + JWT tokens
 */

const AdminPanel = {
  // SECURITY CONFIG
  config: {
    // ⚠️ CHANGE THIS PASSWORD IMMEDIATELY! ⚠️
    // This password is visible in client code - change it before deploying
    masterPassword: 'PLAYGROUND_ADMIN_2024',
    sessionTimeout: 3600000, // 1 hour
    autoRefreshInterval: 30000 // 30 seconds
  },

  // STATE
  state: {
    isAuthenticated: false,
    currentSection: 'dashboard',
    autoRefreshTimer: null,
    sessionTimer: null
  },

  /**
   * Initialize admin panel
   */
  init() {
    // Check if already logged in
    const session = localStorage.getItem('adminSession');
    if (session) {
      const sessionData = JSON.parse(session);
      const now = Date.now();

      if (sessionData.expires > now) {
        this.state.isAuthenticated = true;
        this.showPanel();
        this.loadDashboard();
        this.startAutoRefresh();
        this.startSessionTimer();
      } else {
        this.logout();
      }
    }
  },

  /**
   * Handle login
   */
  login(event) {
    event.preventDefault();

    const password = document.getElementById('adminPassword').value;

    // SECURITY: Rate limiting on login attempts
    const rateLimit = SecurityUtils.checkRateLimit('admin_login', 5, 900000); // 5 attempts per 15 min

    if (!rateLimit.allowed) {
      const minutesLeft = Math.ceil(rateLimit.retryAfter / 60000);
      alert(`⛔ Too many login attempts. Please try again in ${minutesLeft} minutes.`);
      this.logActivity('Admin login rate limit exceeded', 'security');
      return;
    }

    if (password === this.config.masterPassword) {
      // Create session
      const session = {
        authenticated: true,
        loginTime: Date.now(),
        expires: Date.now() + this.config.sessionTimeout
      };

      localStorage.setItem('adminSession', JSON.stringify(session));
      this.state.isAuthenticated = true;

      // Clear rate limit on successful login
      SecurityUtils.safeLocalStorageSet('rateLimit_admin_login', []);

      // Show panel
      this.showPanel();
      this.loadDashboard();
      this.startAutoRefresh();
      this.startSessionTimer();

      // Log activity
      this.logActivity('Admin logged in', 'security');
    } else {
      alert(`❌ Incorrect password. ${rateLimit.remaining - 1} attempts remaining.`);
      this.logActivity('Failed admin login attempt', 'security');
    }
  },

  /**
   * Logout
   */
  logout() {
    localStorage.removeItem('adminSession');
    this.state.isAuthenticated = false;

    if (this.state.autoRefreshTimer) {
      clearInterval(this.state.autoRefreshTimer);
    }
    if (this.state.sessionTimer) {
      clearTimeout(this.state.sessionTimer);
    }

    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('adminPanel').classList.add('hidden');

    this.logActivity('Admin logged out', 'security');
  },

  /**
   * Show panel after login
   */
  showPanel() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
  },

  /**
   * Show specific section
   */
  showSection(sectionName) {
    // Update nav
    document.querySelectorAll('.admin-nav a').forEach(link => {
      link.classList.remove('active');
    });
    event.target.classList.add('active');

    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
      section.classList.add('hidden');
    });

    // Show selected section
    const section = document.getElementById(`section-${sectionName}`);
    if (section) {
      section.classList.remove('hidden');
      this.state.currentSection = sectionName;

      // Load section data
      this.loadSectionData(sectionName);
    }
  },

  /**
   * Load section-specific data
   */
  loadSectionData(sectionName) {
    switch(sectionName) {
      case 'dashboard':
        this.loadDashboard();
        break;
      case 'prompts':
        this.loadPrompts();
        break;
      case 'moderation':
        this.loadModerationQueue();
        break;
      case 'access-codes':
        this.loadAccessCodes();
        break;
      case 'revenue':
        this.loadRevenue();
        break;
      default:
        console.log(`Loading ${sectionName}...`);
    }
  },

  /**
   * Load dashboard data
   */
  async loadDashboard() {
    try {
      // Get system stats
      const stats = this.getSystemStats();

      // Update dashboard
      document.getElementById('totalRevenue').textContent = this.formatCurrency(stats.revenue.total);
      document.getElementById('totalUsers').textContent = stats.users.total;
      document.getElementById('totalPrompts').textContent = stats.prompts.total;
      document.getElementById('totalDevelopers').textContent = stats.developers.total;

      // Load activity feed
      this.loadActivityFeed();

      console.log('✓ Dashboard loaded');
    } catch (error) {
      console.error('Dashboard load error:', error);
      this.showNotification('Failed to load dashboard', 'error');
    }
  },

  /**
   * Get system statistics
   */
  getSystemStats() {
    // Get data from localStorage and app state
    const accessLogs = JSON.parse(localStorage.getItem('accessLogs') || '[]');
    const submissions = JSON.parse(localStorage.getItem('promptSubmissions') || '[]');

    return {
      revenue: {
        total: this.calculateTotalRevenue(),
        kofi: 0,
        marketplace: 0,
        premium: 0
      },
      users: {
        total: accessLogs.length,
        active: accessLogs.filter(log => {
          const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
          return new Date(log.timestamp) > dayAgo;
        }).length
      },
      prompts: {
        total: PromptPlayground.prompts ? PromptPlayground.prompts.length : 20,
        pending: submissions.filter(s => s.status === 'pending').length,
        approved: submissions.filter(s => s.status === 'approved').length
      },
      developers: {
        total: 1,
        pending: 0,
        active: 1
      }
    };
  },

  /**
   * Calculate total revenue
   */
  calculateTotalRevenue() {
    const accessLogs = JSON.parse(localStorage.getItem('accessLogs') || '[]');
    const purchases = JSON.parse(localStorage.getItem('purchases') || '[]');

    let total = 0;

    // Ko-fi library access ($0.99 each)
    total += accessLogs.length * 0.99;

    // Individual prompt purchases
    purchases.forEach(purchase => {
      total += purchase.price || 0;
    });

    return total;
  },

  /**
   * Load activity feed
   */
  loadActivityFeed() {
    const activities = this.getRecentActivities();
    const feed = document.getElementById('activityFeed');

    if (activities.length === 0) {
      feed.innerHTML = '<p class="text-center text-secondary" style="padding: 2rem;">No recent activity</p>';
      return;
    }

    feed.innerHTML = activities.map(activity => `
      <div class="activity-item">
        <div class="activity-icon ${activity.type}">
          ${activity.icon}
        </div>
        <div class="activity-content">
          <strong>${activity.message}</strong>
          <div class="activity-time">${activity.time}</div>
        </div>
      </div>
    `).join('');
  },

  /**
   * Get recent activities
   */
  getRecentActivities() {
    const activityLog = JSON.parse(localStorage.getItem('activityLog') || '[]');

    // Sort by timestamp (newest first)
    return activityLog
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10)
      .map(log => ({
        ...log,
        time: this.getRelativeTime(log.timestamp)
      }));
  },

  /**
   * Log activity
   */
  logActivity(message, type = 'info', icon = 'ℹ') {
    const activityLog = JSON.parse(localStorage.getItem('activityLog') || '[]');

    activityLog.push({
      message,
      type,
      icon,
      timestamp: new Date().toISOString()
    });

    // Keep only last 100 activities
    if (activityLog.length > 100) {
      activityLog.shift();
    }

    localStorage.setItem('activityLog', JSON.stringify(activityLog));
  },

  /**
   * Generate access code
   */
  generateAccessCode() {
    const code = this.createRandomCode();
    const success = this.createCode(code);

    if (success) {
      this.showNotification(`✓ Generated code: ${code}`, 'success');
      this.loadAccessCodes();
    }
  },

  /**
   * Create access code
   */
  createCode(customCode = null) {
    const code = customCode || document.getElementById('newCode')?.value || this.createRandomCode();
    const upperCode = code.trim().toUpperCase();

    // Get existing codes
    const codes = this.getAccessCodes();

    // Check if already exists
    if (codes.includes(upperCode)) {
      this.showNotification('Code already exists!', 'warning');
      return false;
    }

    // Add new code
    codes.push(upperCode);
    localStorage.setItem('adminAccessCodes', JSON.stringify(codes));

    // Update auth.js validCodes
    if (typeof AuthSystem !== 'undefined') {
      AuthSystem.validCodes.push(upperCode);
    }

    this.logActivity(`Access code created: ${upperCode}`, 'success', '🔑');
    this.showNotification(`✓ Code created: ${upperCode}`, 'success');

    // Clear input
    const input = document.getElementById('newCode');
    if (input) input.value = '';

    return true;
  },

  /**
   * Get all access codes
   */
  getAccessCodes() {
    const codes = JSON.parse(localStorage.getItem('adminAccessCodes') || '[]');
    // Merge with default codes
    const defaultCodes = ['PROMPT2024', 'EARLYBIRD', 'FOUNDER99'];
    return [...new Set([...defaultCodes, ...codes])];
  },

  /**
   * Load access codes
   */
  loadAccessCodes() {
    const codes = this.getAccessCodes();
    const container = document.getElementById('codesList');

    if (!container) return;

    container.innerHTML = codes.map(code => `
      <div class="code-display">
        <code>${code}</code>
        <div>
          <span class="badge badge-active">Active</span>
          <button class="btn btn-sm btn-outline" onclick="AdminPanel.copyCode('${code}')">Copy</button>
          <button class="btn btn-sm btn-outline" onclick="AdminPanel.revokeCode('${code}')">Revoke</button>
        </div>
      </div>
    `).join('');
  },

  /**
   * Copy code to clipboard
   */
  copyCode(code) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        this.showNotification(`✓ Copied: ${code}`, 'success');
      });
    } else {
      this.showNotification('Clipboard not supported', 'error');
    }
  },

  /**
   * Revoke access code
   */
  revokeCode(code) {
    if (!confirm(`Revoke access code "${code}"?\n\nUsers with this code will no longer be able to access the library.`)) {
      return;
    }

    let codes = this.getAccessCodes();
    codes = codes.filter(c => c !== code);
    localStorage.setItem('adminAccessCodes', JSON.stringify(codes));

    this.logActivity(`Access code revoked: ${code}`, 'warning', '⚠️');
    this.showNotification(`✓ Code revoked: ${code}`, 'success');
    this.loadAccessCodes();
  },

  /**
   * Create random access code
   */
  createRandomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars
    let code = '';
    for (let i = 0; i < 12; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  },

  /**
   * Load prompts
   */
  async loadPrompts() {
    if (!PromptPlayground.prompts || PromptPlayground.prompts.length === 0) {
      await PromptPlayground.init();
    }

    const tbody = document.getElementById('promptsTable');
    if (!tbody) return;

    tbody.innerHTML = PromptPlayground.prompts.map(prompt => `
      <tr>
        <td><strong>${prompt.title}</strong></td>
        <td>${prompt.category}</td>
        <td>${this.formatCurrency(prompt.price)}</td>
        <td>${prompt.downloads || 0}</td>
        <td>⭐ ${prompt.rating || 0}</td>
        <td><span class="badge badge-approved">Live</span></td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-sm btn-outline" onclick="AdminPanel.editPrompt('${prompt.id}')">Edit</button>
            <button class="btn btn-sm btn-outline" onclick="AdminPanel.toggleFeatured('${prompt.id}')">
              ${prompt.featured ? '⭐ Featured' : 'Feature'}
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  /**
   * Load moderation queue
   */
  loadModerationQueue() {
    const submissions = JSON.parse(localStorage.getItem('promptSubmissions') || '[]');
    const pending = submissions.filter(s => s.status === 'pending');

    const container = document.getElementById('moderationQueue');
    const countBadge = document.getElementById('pendingCount');

    if (!container) return;

    if (countBadge) {
      countBadge.textContent = pending.length;
    }

    if (pending.length === 0) {
      container.innerHTML = `
        <p class="text-center text-secondary" style="padding: 2rem;">
          ✓ No pending submissions. All clean!
        </p>
      `;
      return;
    }

    container.innerHTML = `
      <table class="table-admin">
        <thead>
          <tr>
            <th>Title</th>
            <th>Developer</th>
            <th>Category</th>
            <th>Score</th>
            <th>Submitted</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${pending.map(sub => `
            <tr>
              <td><strong>${sub.title}</strong></td>
              <td>${sub.developer}</td>
              <td>${sub.category}</td>
              <td>
                <span class="badge ${sub.score >= 70 ? 'badge-approved' : 'badge-warning'}">
                  ${sub.score}/100
                </span>
              </td>
              <td>${this.getRelativeTime(sub.timestamp)}</td>
              <td>
                <div class="action-buttons">
                  <button class="btn btn-sm btn-primary" onclick="AdminPanel.approveSubmission('${sub.id}')">
                    ✓ Approve
                  </button>
                  <button class="btn btn-sm btn-outline" onclick="AdminPanel.reviewSubmission('${sub.id}')">
                    Review
                  </button>
                  <button class="btn btn-sm btn-outline" onclick="AdminPanel.rejectSubmission('${sub.id}')">
                    ✗ Reject
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  },

  /**
   * Approve submission
   */
  approveSubmission(submissionId) {
    const submissions = JSON.parse(localStorage.getItem('promptSubmissions') || '[]');
    const submission = submissions.find(s => s.id === submissionId);

    if (!submission) return;

    submission.status = 'approved';
    submission.approvedAt = new Date().toISOString();
    localStorage.setItem('promptSubmissions', JSON.stringify(submissions));

    this.logActivity(`Prompt approved: ${submission.title}`, 'success', '✓');
    this.showNotification(`✓ Approved: ${submission.title}`, 'success');
    this.loadModerationQueue();
  },

  /**
   * Reject submission
   */
  rejectSubmission(submissionId) {
    const reason = prompt('Rejection reason (will be sent to developer):');
    if (!reason) return;

    const submissions = JSON.parse(localStorage.getItem('promptSubmissions') || '[]');
    const submission = submissions.find(s => s.id === submissionId);

    if (!submission) return;

    submission.status = 'rejected';
    submission.rejectionReason = reason;
    submission.rejectedAt = new Date().toISOString();
    localStorage.setItem('promptSubmissions', JSON.stringify(submissions));

    this.logActivity(`Prompt rejected: ${submission.title}`, 'warning', '✗');
    this.showNotification(`✓ Rejected: ${submission.title}`, 'success');
    this.loadModerationQueue();
  },

  /**
   * Load revenue data
   */
  loadRevenue() {
    // This would integrate with Ko-fi/Gumroad APIs
    console.log('Loading revenue data...');
  },

  /**
   * Auto-refresh data
   */
  startAutoRefresh() {
    this.state.autoRefreshTimer = setInterval(() => {
      if (this.state.isAuthenticated) {
        this.loadSectionData(this.state.currentSection);
      }
    }, this.config.autoRefreshInterval);
  },

  /**
   * Start session timer
   */
  startSessionTimer() {
    this.state.sessionTimer = setTimeout(() => {
      alert('Session expired. Please log in again.');
      this.logout();
    }, this.config.sessionTimeout);
  },

  /**
   * Refresh data manually
   */
  refreshData() {
    this.loadSectionData(this.state.currentSection);
    this.showNotification('✓ Data refreshed', 'success');
  },

  /**
   * Save settings
   */
  saveSettings() {
    this.showNotification('✓ Settings saved', 'success');
    this.logActivity('Settings updated', 'info', '⚙️');
  },

  /**
   * Clear cache
   */
  clearCache() {
    if (!confirm('Clear all cached data? This will not delete user data or prompts.')) {
      return;
    }

    // Clear only cache items
    localStorage.removeItem('promptsCache');
    localStorage.removeItem('statsCache');

    this.showNotification('✓ Cache cleared', 'success');
    this.logActivity('Cache cleared', 'info', '🗑️');
  },

  /**
   * Factory reset
   */
  factoryReset() {
    const confirmation = prompt('Type "RESET ALL DATA" to confirm factory reset:');

    if (confirmation === 'RESET ALL DATA') {
      localStorage.clear();
      this.showNotification('✓ System reset complete', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      this.showNotification('Reset cancelled', 'info');
    }
  },

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    if (typeof Utils !== 'undefined' && Utils.notify) {
      Utils.notify(message, type);
    } else {
      alert(message);
    }
  },

  /**
   * Format currency
   */
  formatCurrency(amount) {
    if (typeof Utils !== 'undefined' && Utils.formatCurrency) {
      return Utils.formatCurrency(amount);
    }
    return `$${amount.toFixed(2)}`;
  },

  /**
   * Get relative time
   */
  getRelativeTime(timestamp) {
    if (typeof Utils !== 'undefined' && Utils.timeAgo) {
      return Utils.timeAgo(timestamp);
    }

    const diff = Date.now() - new Date(timestamp);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    return `${days} days ago`;
  },

  /**
   * Edit prompt
   */
  editPrompt(promptId) {
    alert(`Edit prompt: ${promptId}\n\nThis would open an edit modal.`);
  },

  /**
   * Toggle featured status
   */
  toggleFeatured(promptId) {
    alert(`Toggle featured: ${promptId}\n\nThis would update the prompt's featured status.`);
  },

  /**
   * Review submission
   */
  reviewSubmission(submissionId) {
    alert(`Review submission: ${submissionId}\n\nThis would open a detailed review modal.`);
  },

  /**
   * Approve all safe submissions
   */
  approveAll() {
    if (!confirm('Approve all submissions scoring 70+?')) {
      return;
    }

    const submissions = JSON.parse(localStorage.getItem('promptSubmissions') || '[]');
    let approvedCount = 0;

    submissions.forEach(sub => {
      if (sub.status === 'pending' && sub.score >= 70) {
        sub.status = 'approved';
        sub.approvedAt = new Date().toISOString();
        approvedCount++;
      }
    });

    localStorage.setItem('promptSubmissions', JSON.stringify(submissions));

    this.showNotification(`✓ Approved ${approvedCount} submissions`, 'success');
    this.loadModerationQueue();
  },

  /**
   * Refresh moderation queue
   */
  refreshQueue() {
    this.loadModerationQueue();
    this.showNotification('✓ Queue refreshed', 'success');
  },

  /**
   * Export revenue report
   */
  exportRevenue() {
    const stats = this.getSystemStats();
    const report = `
PROMPT PLAYGROUNDS - REVENUE REPORT
Generated: ${new Date().toISOString()}

Total Revenue: ${this.formatCurrency(stats.revenue.total)}
- Ko-fi (Library): ${this.formatCurrency(stats.revenue.kofi)}
- Marketplace: ${this.formatCurrency(stats.revenue.marketplace)}
- Premium: ${this.formatCurrency(stats.revenue.premium)}

Total Users: ${stats.users.total}
Total Prompts: ${stats.prompts.total}
    `;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    this.showNotification('✓ Report exported', 'success');
  }
};

// Auto-initialize on page load
if (typeof window !== 'undefined') {
  window.AdminPanel = AdminPanel;

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AdminPanel.init());
  } else {
    AdminPanel.init();
  }
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdminPanel;
}
