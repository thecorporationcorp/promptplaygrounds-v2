/**
 * WEBHOOK AUTOMATION SYSTEM
 * Automatic access code delivery for Ko-fi and Gumroad purchases
 * Zero manual work - completely automated
 */

const WebhookHandler = {
  // Configuration
  config: {
    kofiWebhookUrl: '/api/webhooks/kofi',
    gumroadWebhookUrl: '/api/webhooks/gumroad',
    emailService: 'sendgrid', // or 'mailgun', 'postmark'
    autoCodeGeneration: true,
    autoEmailDelivery: true
  },

  /**
   * MAIN WEBHOOK PROCESSOR
   * Handles incoming webhooks from Ko-fi and Gumroad
   */
  async processWebhook(source, payload) {
    console.log(`📨 Processing ${source} webhook...`);

    try {
      let orderData;

      // Parse webhook based on source
      if (source === 'kofi') {
        orderData = this.parseKofiWebhook(payload);
      } else if (source === 'gumroad') {
        orderData = this.parseGumroadWebhook(payload);
      } else {
        throw new Error('Unknown webhook source');
      }

      // Process the order
      await this.processOrder(orderData);

      return { success: true, orderId: orderData.orderId };
    } catch (error) {
      console.error('Webhook processing error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Parse Ko-fi webhook payload
   */
  parseKofiWebhook(payload) {
    // Ko-fi webhook structure
    // https://help.ko-fi.com/hc/en-us/articles/360001060832-Webhooks

    // VALIDATE payload structure before processing
    if (typeof SecurityUtils !== 'undefined') {
      SecurityUtils.validateKofiWebhook(payload);
    }

    return {
      orderId: payload.kofi_transaction_id,
      email: payload.email,
      name: payload.from_name,
      amount: parseFloat(payload.amount),
      currency: payload.currency,
      message: payload.message,
      timestamp: payload.timestamp,
      productType: 'library_access', // 99¢ library access
      source: 'kofi'
    };
  },

  /**
   * Parse Gumroad webhook payload
   */
  parseGumroadWebhook(payload) {
    // Gumroad webhook structure
    // https://help.gumroad.com/article/268-gumroad-ping

    // VALIDATE payload structure before processing
    if (typeof SecurityUtils !== 'undefined') {
      SecurityUtils.validateGumroadWebhook(payload);
    }

    return {
      orderId: payload.sale_id,
      email: payload.email,
      name: payload.full_name,
      amount: parseFloat(payload.price) / 100, // cents to dollars
      currency: payload.currency,
      productId: payload.product_id,
      productName: payload.product_name,
      timestamp: payload.sale_timestamp,
      productType: 'premium_file', // Project Filez
      source: 'gumroad'
    };
  },

  /**
   * PROCESS ORDER - Main automation flow
   * 1. Generate access code
   * 2. Store purchase record
   * 3. Send email with code
   * 4. Log activity
   */
  async processOrder(orderData) {
    console.log('💳 Processing order:', orderData);

    // 1. Generate unique access code
    const accessCode = this.generateUniqueAccessCode();

    // 2. Store purchase record
    const purchaseRecord = {
      id: `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderId: orderData.orderId,
      email: orderData.email,
      name: orderData.name,
      amount: orderData.amount,
      currency: orderData.currency,
      productType: orderData.productType,
      accessCode: accessCode,
      status: 'completed',
      timestamp: new Date().toISOString(),
      source: orderData.source,
      emailSent: false
    };

    this.savePurchaseRecord(purchaseRecord);

    // 3. Activate access code
    this.activateAccessCode(accessCode, purchaseRecord);

    // 4. Send welcome email with access code
    await this.sendWelcomeEmail(purchaseRecord);

    // 5. Log to admin activity feed
    this.logActivity({
      type: 'purchase',
      message: `New purchase from ${orderData.name} - ${orderData.productType}`,
      icon: '💰',
      metadata: purchaseRecord
    });

    // 6. Update revenue stats
    this.updateRevenueStats(purchaseRecord);

    console.log('✅ Order processed successfully:', purchaseRecord.id);

    return purchaseRecord;
  },

  /**
   * Generate unique access code
   */
  generateUniqueAccessCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      code = '';
      // Format: XXXX-XXXX-XXXX
      for (let i = 0; i < 12; i++) {
        if (i > 0 && i % 4 === 0) code += '-';
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      attempts++;
    } while (this.codeExists(code) && attempts < maxAttempts);

    return code;
  },

  /**
   * Check if code already exists
   */
  codeExists(code) {
    const purchases = JSON.parse(localStorage.getItem('purchases') || '[]');
    return purchases.some(p => p.accessCode === code);
  },

  /**
   * Save purchase record to storage
   */
  savePurchaseRecord(record) {
    const purchases = JSON.parse(localStorage.getItem('purchases') || '[]');
    purchases.push(record);
    localStorage.setItem('purchases', JSON.stringify(purchases));

    console.log('💾 Purchase record saved:', record.id);
  },

  /**
   * Activate access code in auth system
   */
  activateAccessCode(code, purchaseRecord) {
    // Add to valid codes list
    const codes = JSON.parse(localStorage.getItem('adminAccessCodes') || '[]');

    if (!codes.includes(code)) {
      codes.push(code);
      localStorage.setItem('adminAccessCodes', JSON.stringify(codes));

      // Also update AuthSystem if available
      if (typeof AuthSystem !== 'undefined' && !AuthSystem.validCodes.includes(code)) {
        AuthSystem.validCodes.push(code);
      }

      console.log('🔑 Access code activated:', code);
    }
  },

  /**
   * SEND WELCOME EMAIL
   * Automatic email delivery with access code
   */
  async sendWelcomeEmail(purchaseRecord) {
    const emailData = {
      to: purchaseRecord.email,
      subject: '🎉 Welcome to PROMPT PLAYGROUNDZs - Your Access Code',
      html: this.generateWelcomeEmail(purchaseRecord)
    };

    // In production, this would call your email service API
    // For now, we simulate and log
    console.log('📧 Sending welcome email to:', purchaseRecord.email);

    // Simulate email service (replace with actual API call)
    const emailSent = await this.simulateEmailSend(emailData);

    if (emailSent) {
      // Update purchase record
      purchaseRecord.emailSent = true;
      purchaseRecord.emailSentAt = new Date().toISOString();

      const purchases = JSON.parse(localStorage.getItem('purchases') || '[]');
      const index = purchases.findIndex(p => p.id === purchaseRecord.id);
      if (index !== -1) {
        purchases[index] = purchaseRecord;
        localStorage.setItem('purchases', JSON.stringify(purchases));
      }

      console.log('✅ Welcome email sent successfully');
    }

    return emailSent;
  },

  /**
   * Generate beautiful welcome email HTML
   */
  generateWelcomeEmail(purchaseRecord) {
    // Escape all user-provided data to prevent XSS
    const safeName = SecurityUtils.escapeHtml(purchaseRecord.name || 'there');
    const safeAccessCode = SecurityUtils.escapeHtml(purchaseRecord.accessCode);
    const safeOrderId = SecurityUtils.escapeHtml(purchaseRecord.orderId);
    const accessUrl = `${window.location.origin}/hub.html`;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; }
    .access-code { background: #f3f4f6; border: 2px dashed #6366f1; padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px; }
    .code { font-size: 32px; font-weight: 700; color: #6366f1; letter-spacing: 0.1em; font-family: 'Courier New', monospace; }
    .button { display: inline-block; background: #6366f1; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .steps { background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .step { padding: 10px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 32px;">🎉 Welcome to PROMPT PLAYGROUNDZs!</h1>
      <p style="margin: 10px 0 0; opacity: 0.9;">Your AI prompt library is ready</p>
    </div>

    <div class="content">
      <p>Hi ${safeName}! 👋</p>

      <p>Thank you for joining PROMPT PLAYGROUNDZs! Your purchase has been confirmed and you now have instant access to our entire library of professional AI prompts.</p>

      <div class="access-code">
        <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280;">YOUR ACCESS CODE</p>
        <div class="code">${safeAccessCode}</div>
        <p style="margin: 10px 0 0; font-size: 12px; color: #6b7280;">Save this code - you'll need it to access the library</p>
      </div>

      <div style="text-align: center;">
        <a href="${accessUrl}" class="button">🚀 Access Your Library Now</a>
      </div>

      <div class="steps">
        <h3 style="margin-top: 0;">Quick Start Guide:</h3>
        <div class="step">1️⃣ Click the button above or visit: <a href="${accessUrl}">${accessUrl}</a></div>
        <div class="step">2️⃣ Enter your access code: <strong>${safeAccessCode}</strong></div>
        <div class="step">3️⃣ Browse 20+ professional prompts</div>
        <div class="step">4️⃣ Use our one-click setup to install all bookmarklets (takes 2 minutes!)</div>
      </div>

      <h3>What's Included:</h3>
      <ul>
        <li>✅ 20+ professional AI prompts across 11 categories</li>
        <li>✅ One-click bookmarklet installation</li>
        <li>✅ Works with ChatGPT, Claude, Gemini, and more</li>
        <li>✅ Lifetime access to all current and future prompts</li>
        <li>✅ Free updates forever</li>
      </ul>

      <p><strong>Need help?</strong> Reply to this email or check our <a href="${window.location.origin}/how-it-works.html">how-it-works guide</a>.</p>

      <p style="margin-top: 30px;">Happy prompting! 🚀<br><strong>The PROMPT PLAYGROUNDZs Team</strong></p>
    </div>

    <div class="footer">
      <p>Order ID: ${safeOrderId}<br>
      Purchase Date: ${new Date(purchaseRecord.timestamp).toLocaleDateString()}</p>
      <p style="font-size: 12px; color: #9ca3af;">If you have any questions, just reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `;
  },

  /**
   * Simulate email sending (replace with actual email service)
   */
  async simulateEmailSend(emailData) {
    // In production, call your email service:
    // - SendGrid: https://sendgrid.com/docs/api-reference/
    // - Mailgun: https://documentation.mailgun.com/en/latest/api-sending.html
    // - Postmark: https://postmarkapp.com/developer/api/email-api

    // For now, store in localStorage for admin to see
    const emailQueue = JSON.parse(localStorage.getItem('emailQueue') || '[]');
    emailQueue.push({
      ...emailData,
      sentAt: new Date().toISOString(),
      status: 'simulated' // Change to 'sent' in production
    });
    localStorage.setItem('emailQueue', JSON.stringify(emailQueue));

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return true;
  },

  /**
   * Log activity to admin feed
   */
  logActivity(activity) {
    const activityLog = JSON.parse(localStorage.getItem('activityLog') || '[]');

    activityLog.push({
      ...activity,
      timestamp: new Date().toISOString()
    });

    // Keep only last 100 activities
    if (activityLog.length > 100) {
      activityLog.shift();
    }

    localStorage.setItem('activityLog', JSON.stringify(activityLog));
  },

  /**
   * Update revenue statistics
   */
  updateRevenueStats(purchaseRecord) {
    const stats = JSON.parse(localStorage.getItem('revenueStats') || '{}');

    if (!stats.total) stats.total = 0;
    if (!stats.kofi) stats.kofi = 0;
    if (!stats.gumroad) stats.gumroad = 0;
    if (!stats.count) stats.count = 0;

    stats.total += purchaseRecord.amount;
    stats.count += 1;

    if (purchaseRecord.source === 'kofi') {
      stats.kofi += purchaseRecord.amount;
    } else if (purchaseRecord.source === 'gumroad') {
      stats.gumroad += purchaseRecord.amount;
    }

    stats.lastUpdate = new Date().toISOString();

    localStorage.setItem('revenueStats', JSON.stringify(stats));
  },

  /**
   * MANUAL ORDER PROCESSING
   * For admin to manually add purchases (if webhook fails or manual sale)
   */
  manualOrder(orderData) {
    console.log('📝 Processing manual order...');

    const purchaseRecord = {
      id: `manual_${Date.now()}`,
      orderId: orderData.orderId || `manual_${Date.now()}`,
      email: orderData.email,
      name: orderData.name,
      amount: orderData.amount,
      currency: orderData.currency || 'USD',
      productType: orderData.productType || 'library_access',
      accessCode: this.generateUniqueAccessCode(),
      status: 'completed',
      timestamp: new Date().toISOString(),
      source: 'manual',
      emailSent: false
    };

    this.savePurchaseRecord(purchaseRecord);
    this.activateAccessCode(purchaseRecord.accessCode, purchaseRecord);

    if (orderData.sendEmail !== false) {
      this.sendWelcomeEmail(purchaseRecord);
    }

    this.logActivity({
      type: 'manual_order',
      message: `Manual order processed: ${orderData.email}`,
      icon: '✍️',
      metadata: purchaseRecord
    });

    this.updateRevenueStats(purchaseRecord);

    return purchaseRecord;
  },

  /**
   * Get all purchases
   */
  getAllPurchases() {
    return JSON.parse(localStorage.getItem('purchases') || '[]');
  },

  /**
   * Get purchase by email
   */
  getPurchaseByEmail(email) {
    const purchases = this.getAllPurchases();
    return purchases.filter(p => p.email.toLowerCase() === email.toLowerCase());
  },

  /**
   * Resend welcome email
   */
  async resendWelcomeEmail(purchaseId) {
    const purchases = this.getAllPurchases();
    const purchase = purchases.find(p => p.id === purchaseId);

    if (!purchase) {
      throw new Error('Purchase not found');
    }

    await this.sendWelcomeEmail(purchase);

    this.logActivity({
      type: 'email_resend',
      message: `Welcome email resent to ${purchase.email}`,
      icon: '📧'
    });

    return true;
  },

  /**
   * Get email queue (for debugging)
   */
  getEmailQueue() {
    return JSON.parse(localStorage.getItem('emailQueue') || '[]');
  },

  /**
   * Clear email queue
   */
  clearEmailQueue() {
    localStorage.setItem('emailQueue', JSON.stringify([]));
  }
};

// Make globally available
if (typeof window !== 'undefined') {
  window.WebhookHandler = WebhookHandler;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WebhookHandler;
}
