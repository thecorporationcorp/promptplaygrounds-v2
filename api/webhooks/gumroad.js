/**
 * GUMROAD WEBHOOK HANDLER
 * Receives payment notifications from Gumroad and provisions access codes
 *
 * Gumroad Webhook Documentation: https://gumroad.com/ping
 *
 * Setup:
 * 1. Go to Gumroad > Settings > Advanced > Ping
 * 2. Add webhook URL: https://promptplaygroundz.com/api/webhooks/gumroad
 * 3. Enable "Ping on sale"
 */

// Access codes pool - replace with database in production
const ACCESS_CODES = {
  library: [
    'GUM-LIB-001', 'GUM-LIB-002', 'GUM-LIB-003', 'GUM-LIB-004', 'GUM-LIB-005',
    'GUM-LIB-006', 'GUM-LIB-007', 'GUM-LIB-008', 'GUM-LIB-009', 'GUM-LIB-010'
  ],
  cheatcodez: [
    'GUM-CC-001', 'GUM-CC-002', 'GUM-CC-003', 'GUM-CC-004', 'GUM-CC-005'
  ],
  projectfilez: [
    'GUM-PF-001', 'GUM-PF-002', 'GUM-PF-003', 'GUM-PF-004', 'GUM-PF-005'
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
 * Determine product type from Gumroad data
 */
function getProductType(data) {
  const productName = (data.product_name || '').toLowerCase();
  const productPermalink = (data.product_permalink || '').toLowerCase();
  const price = parseFloat(data.price) / 100 || 0; // Gumroad sends price in cents

  // Check product name/permalink for type hints
  if (productName.includes('project') || productPermalink.includes('project')) {
    return 'projectfilez';
  }
  if (productName.includes('cheat') || productPermalink.includes('cheat')) {
    return 'cheatcodez';
  }
  if (productName.includes('library') || productPermalink.includes('library')) {
    return 'library';
  }

  // Check price ranges
  if (price >= 10) {
    return 'projectfilez';
  }
  if (price >= 1.99) {
    return 'cheatcodez';
  }

  return 'library';
}

/**
 * Send email with access code
 */
async function sendAccessCodeEmail(email, code, productType, buyerName) {
  const emailEndpoint = process.env.EMAIL_API_ENDPOINT || '/api/send-email';

  const productNames = {
    library: 'Library Access',
    cheatcodez: 'Cheat Codez Credits',
    projectfilez: 'Project Filez Access'
  };

  const productName = productNames[productType] || 'Library Access';

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
  console.log('=== GUMROAD PURCHASE ===');
  console.log('Time:', new Date().toISOString());
  console.log('Buyer:', data.full_name);
  console.log('Email:', data.email);
  console.log('Product:', data.product_name);
  console.log('Price:', '$' + (parseFloat(data.price) / 100).toFixed(2));
  console.log('Product Type:', productType);
  console.log('Code Issued:', code);
  console.log('Sale ID:', data.sale_id);
  console.log('========================');
}

/**
 * Verify Gumroad webhook signature (optional but recommended)
 */
function verifySignature(payload, signature) {
  // Gumroad doesn't provide signature verification by default
  // If you need this, implement custom verification
  return true;
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
    // Parse Gumroad webhook payload
    // Gumroad sends data as form-encoded
    let gumroadData = {};

    if (event.body) {
      const params = new URLSearchParams(event.body);

      // Convert URLSearchParams to object
      for (const [key, value] of params) {
        gumroadData[key] = value;
      }
    }

    if (!gumroadData.email || !gumroadData.product_name) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid payload - missing required fields' })
      };
    }

    // Check for refunds (don't issue codes for refunds)
    if (gumroadData.refunded === 'true') {
      console.log('Refund detected, skipping code issuance');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ status: 'ignored', reason: 'Refund' })
      };
    }

    // Determine product type and get access code
    const productType = getProductType(gumroadData);
    const accessCode = getAvailableCode(productType);

    // Log the purchase
    logPurchase(gumroadData, accessCode, productType);

    // Send email with access code
    const emailSent = await sendAccessCodeEmail(
      gumroadData.email,
      accessCode,
      productType,
      gumroadData.full_name
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
