/**
 * KO-FI WEBHOOK HANDLER
 * Receives payment notifications from Ko-fi and provisions access codes
 *
 * Ko-fi Webhook Documentation: https://ko-fi.com/manage/webhooks
 *
 * Setup:
 * 1. Go to Ko-fi > Settings > API
 * 2. Add webhook URL: https://promptplaygroundz.com/api/webhooks/kofi
 * 3. Copy the Verification Token and set as KOFI_VERIFICATION_TOKEN env var
 */

// Access codes pool - replace with database in production
const ACCESS_CODES = {
  library: [
    'KOFI-LIB-001', 'KOFI-LIB-002', 'KOFI-LIB-003', 'KOFI-LIB-004', 'KOFI-LIB-005',
    'KOFI-LIB-006', 'KOFI-LIB-007', 'KOFI-LIB-008', 'KOFI-LIB-009', 'KOFI-LIB-010'
  ],
  cheatcodez: [
    'KOFI-CC-001', 'KOFI-CC-002', 'KOFI-CC-003', 'KOFI-CC-004', 'KOFI-CC-005'
  ]
};

// Track used codes (in production, use a database)
const usedCodes = new Set();

/**
 * Generate a unique access code
 */
function getAvailableCode(type) {
  const pool = ACCESS_CODES[type] || ACCESS_CODES.library;

  for (const code of pool) {
    if (!usedCodes.has(code)) {
      usedCodes.add(code);
      return code;
    }
  }

  // If pool exhausted, generate a random code
  const randomCode = `${type.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  usedCodes.add(randomCode);
  return randomCode;
}

/**
 * Determine product type from Ko-fi data
 */
function getProductType(data) {
  const amount = parseFloat(data.amount) || 0;
  const message = (data.message || '').toLowerCase();

  // Check message for product hints
  if (message.includes('cheat') || message.includes('codez')) {
    return 'cheatcodez';
  }

  // Check amount ranges
  if (amount >= 1.99) {
    return 'cheatcodez';
  }

  return 'library';
}

/**
 * Send email with access code (uses SendGrid/AWS SES)
 */
async function sendAccessCodeEmail(email, code, productType, buyerName) {
  const emailEndpoint = process.env.EMAIL_API_ENDPOINT || '/api/send-email';

  const productName = productType === 'cheatcodez' ? 'Cheat Codez Credits' : 'Library Access';

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 2rem;">
      <h1 style="color: #00ff41;">🎉 Thank You for Your Purchase!</h1>

      <p>Hey ${buyerName || 'there'},</p>

      <p>Your <strong>${productName}</strong> is ready!</p>

      <div style="background: #1a1a1a; border: 2px solid #00ff41; padding: 1.5rem; margin: 1.5rem 0; border-radius: 8px; text-align: center;">
        <p style="margin: 0; color: #888;">Your Access Code:</p>
        <h2 style="color: #00ff41; font-family: monospace; font-size: 2rem; margin: 0.5rem 0;">${code}</h2>
      </div>

      <h3 style="color: #00ff41;">How to Use:</h3>
      <ol style="color: #ccc; line-height: 1.8;">
        <li>Go to <a href="https://promptplaygroundz.com/hub.html" style="color: #00ff41;">promptplaygroundz.com/hub.html</a></li>
        <li>Enter your access code when prompted</li>
        <li>Start using your prompts!</li>
      </ol>

      <p style="color: #888; font-size: 0.9rem; margin-top: 2rem;">
        Questions? Reply to this email or visit our site.<br>
        — PROMPT PLAYGROUNDZ Team
      </p>
    </div>
  `;

  try {
    // Try to call internal email API
    const response = await fetch(emailEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: `🎉 Your PROMPT PLAYGROUNDZ Access Code: ${code}`,
        htmlBody: htmlBody,
        textBody: `Your ${productName} access code is: ${code}\n\nGo to https://promptplaygroundz.com/hub.html to use it.`
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Email send failed:', error);
    return false;
  }
}

/**
 * Log purchase for analytics
 */
function logPurchase(data, code, productType) {
  console.log('=== KO-FI PURCHASE ===');
  console.log('Time:', new Date().toISOString());
  console.log('Buyer:', data.from_name);
  console.log('Email:', data.email);
  console.log('Amount:', data.amount, data.currency);
  console.log('Product:', productType);
  console.log('Code Issued:', code);
  console.log('Message:', data.message || 'None');
  console.log('======================');
}

/**
 * Main webhook handler
 */
async function handler(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Only accept POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse Ko-fi webhook payload
    // Ko-fi sends data as form-encoded with a 'data' field containing JSON
    let kofiData;

    if (event.body) {
      const params = new URLSearchParams(event.body);
      const dataJson = params.get('data');

      if (dataJson) {
        kofiData = JSON.parse(dataJson);
      } else {
        // Try parsing as raw JSON
        kofiData = JSON.parse(event.body);
      }
    }

    if (!kofiData) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid payload' })
      };
    }

    // Verify webhook token (optional but recommended)
    const verificationToken = process.env.KOFI_VERIFICATION_TOKEN;
    if (verificationToken && kofiData.verification_token !== verificationToken) {
      console.error('Invalid verification token');
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid verification token' })
      };
    }

    // Only process completed purchases (not subscriptions or donations without amount)
    const validTypes = ['Donation', 'Subscription', 'Shop Order'];
    if (!validTypes.includes(kofiData.type)) {
      console.log('Ignoring non-purchase event:', kofiData.type);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ status: 'ignored', reason: 'Not a purchase' })
      };
    }

    // Determine product type and get access code
    const productType = getProductType(kofiData);
    const accessCode = getAvailableCode(productType);

    // Log the purchase
    logPurchase(kofiData, accessCode, productType);

    // Send email with access code
    const emailSent = await sendAccessCodeEmail(
      kofiData.email,
      accessCode,
      productType,
      kofiData.from_name
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'success',
        message: 'Purchase processed',
        code_issued: true,
        email_sent: emailSent,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Webhook error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
}

// Export for Netlify Functions
module.exports = { handler };
module.exports.handler = handler;
