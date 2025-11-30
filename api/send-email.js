/**
 * SERVERLESS EMAIL FUNCTION
 *
 * Sends emails via SendGrid or AWS SES
 * Deploy to: Vercel, Netlify, AWS Lambda, or any serverless platform
 *
 * Environment Variables Required:
 * - EMAIL_PROVIDER: 'sendgrid' or 'aws_ses'
 * - SENDGRID_API_KEY (if using SendGrid)
 * - AWS_ACCESS_KEY_ID (if using AWS SES)
 * - AWS_SECRET_ACCESS_KEY (if using AWS SES)
 * - AWS_REGION (if using AWS SES, e.g., 'us-east-1')
 * - EMAIL_FROM: Sender email address (must be verified)
 * - EMAIL_TO: Recipient email address
 */

// Import based on provider (install via: npm install @sendgrid/mail aws-sdk)
let sendgridMail, AWS;

try {
  sendgridMail = require('@sendgrid/mail');
} catch (e) {
  // SendGrid not installed
}

try {
  AWS = require('aws-sdk');
} catch (e) {
  // AWS SDK not installed
}

/**
 * Send email via SendGrid
 */
async function sendViaSendGrid(to, subject, htmlBody, textBody) {
  if (!sendgridMail) {
    throw new Error('SendGrid module not installed. Run: npm install @sendgrid/mail');
  }

  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    throw new Error('SENDGRID_API_KEY environment variable not set');
  }

  sendgridMail.setApiKey(apiKey);

  const msg = {
    to: to,
    from: process.env.EMAIL_FROM,
    subject: subject,
    text: textBody,
    html: htmlBody
  };

  try {
    await sendgridMail.send(msg);
    return { success: true, provider: 'sendgrid' };
  } catch (error) {
    console.error('SendGrid error:', error);
    throw new Error(`SendGrid error: ${error.message}`);
  }
}

/**
 * Send email via AWS SES
 */
async function sendViaAWSSES(to, subject, htmlBody, textBody) {
  if (!AWS) {
    throw new Error('AWS SDK not installed. Run: npm install aws-sdk');
  }

  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || 'us-east-1';

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('AWS credentials not set in environment variables');
  }

  AWS.config.update({
    accessKeyId,
    secretAccessKey,
    region
  });

  const ses = new AWS.SES({ apiVersion: '2010-12-01' });

  const params = {
    Source: process.env.EMAIL_FROM,
    Destination: {
      ToAddresses: [to]
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: 'UTF-8'
      },
      Body: {
        Text: {
          Data: textBody,
          Charset: 'UTF-8'
        },
        Html: {
          Data: htmlBody,
          Charset: 'UTF-8'
        }
      }
    }
  };

  try {
    await ses.sendEmail(params).promise();
    return { success: true, provider: 'aws_ses' };
  } catch (error) {
    console.error('AWS SES error:', error);
    throw new Error(`AWS SES error: ${error.message}`);
  }
}

/**
 * Main handler function (compatible with Vercel, Netlify, AWS Lambda)
 */
async function handler(event, context) {
  // Handle different serverless platforms
  let body;

  // Vercel/Netlify format
  if (event.body) {
    body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
  }
  // AWS Lambda format
  else if (event.httpMethod === 'POST') {
    body = JSON.parse(event.body);
  }
  // Direct invocation
  else {
    body = event;
  }

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Validate request
  if (!body || !body.to || !body.subject || !body.htmlBody) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Missing required fields: to, subject, htmlBody'
      })
    };
  }

  // Security: Validate recipient (only send to authorized email)
  const authorizedRecipient = process.env.EMAIL_TO || 'thecorporationcorp@thecorporationcorp.com';
  if (body.to !== authorizedRecipient) {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Unauthorized recipient'
      })
    };
  }

  // Rate limiting check (simple in-memory, use Redis in production)
  // For serverless, consider using a distributed rate limiter

  try {
    const provider = process.env.EMAIL_PROVIDER || 'sendgrid';
    let result;

    if (provider === 'sendgrid') {
      result = await sendViaSendGrid(
        body.to,
        body.subject,
        body.htmlBody,
        body.textBody || body.htmlBody.replace(/<[^>]*>/g, '')
      );
    } else if (provider === 'aws_ses') {
      result = await sendViaAWSSES(
        body.to,
        body.subject,
        body.htmlBody,
        body.textBody || body.htmlBody.replace(/<[^>]*>/g, '')
      );
    } else {
      throw new Error(`Unknown email provider: ${provider}`);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        provider: result.provider,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Email send error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
}

// Export for different platforms
module.exports = handler;
module.exports.handler = handler;

// For local testing
if (require.main === module) {
  const testEvent = {
    httpMethod: 'POST',
    body: JSON.stringify({
      to: process.env.EMAIL_TO || 'thecorporationcorp@thecorporationcorp.com',
      subject: 'Test Email from PROMPT PLAYGROUNDZ',
      htmlBody: '<h1>Test Email</h1><p>This is a test email from the email integration system.</p>',
      textBody: 'Test Email\n\nThis is a test email from the email integration system.'
    })
  };

  handler(testEvent, {})
    .then(response => {
      console.log('Response:', response);
      const body = JSON.parse(response.body);
      if (body.success) {
        console.log('✅ Email sent successfully!');
      } else {
        console.error('❌ Email failed:', body.error);
      }
      process.exit(body.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}
