/**
 * CHEAT CODEZ SERVERLESS API
 *
 * Secure backend for AI prompt generation
 * - Protects OpenAI API key from client exposure
 * - Implements rate limiting
 * - Validates requests
 * - Tracks usage
 *
 * Deploy to: Vercel, Netlify, AWS Lambda, or any serverless platform
 *
 * Environment Variables Required:
 * - OPENAI_API_KEY: Your OpenAI API key
 * - OPENAI_MODEL: Model to use (default: gpt-4o-mini)
 * - RATE_LIMIT_MAX: Max requests per window (default: 10)
 * - RATE_LIMIT_WINDOW: Time window in ms (default: 900000 = 15 minutes)
 */

// Simple in-memory rate limiting (use Redis in production for distributed systems)
const rateLimitStore = new Map();

/**
 * Rate limiting check
 */
function checkRateLimit(identifier, maxRequests = 10, windowMs = 900000) {
  const now = Date.now();
  const key = `rateLimit_${identifier}`;

  // Get existing record
  const record = rateLimitStore.get(key) || { requests: [], firstRequest: now };

  // Remove old requests outside the window
  record.requests = record.requests.filter(timestamp => now - timestamp < windowMs);

  // Check if limit exceeded
  if (record.requests.length >= maxRequests) {
    const oldestRequest = record.requests[0];
    const retryAfter = Math.ceil((windowMs - (now - oldestRequest)) / 1000); // seconds

    return {
      allowed: false,
      remaining: 0,
      retryAfter,
      limit: maxRequests
    };
  }

  // Add new request
  record.requests.push(now);
  rateLimitStore.set(key, record);

  // Cleanup old entries (prevent memory leak)
  if (rateLimitStore.size > 10000) {
    const keysToDelete = [];
    for (const [k, v] of rateLimitStore.entries()) {
      if (now - v.firstRequest > windowMs * 2) {
        keysToDelete.push(k);
      }
    }
    keysToDelete.forEach(k => rateLimitStore.delete(k));
  }

  return {
    allowed: true,
    remaining: maxRequests - record.requests.length,
    limit: maxRequests
  };
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(event) {
  // Try to get IP address from various headers
  const forwarded = event.headers['x-forwarded-for'];
  const realIp = event.headers['x-real-ip'];
  const cfConnectingIp = event.headers['cf-connecting-ip']; // Cloudflare

  const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown';

  return ip;
}

/**
 * Validate request body
 */
function validateRequest(body) {
  const errors = [];

  if (!body) {
    return { valid: false, errors: ['Request body is required'] };
  }

  // Validate userInput
  if (!body.userInput || typeof body.userInput !== 'string') {
    errors.push('userInput is required and must be a string');
  } else if (body.userInput.length < 10) {
    errors.push('userInput must be at least 10 characters');
  } else if (body.userInput.length > 3000) {
    errors.push('userInput must not exceed 3000 characters');
  }

  // Validate outputStyle
  const validStyles = ['optimized', 'template', 'workflow'];
  if (!body.outputStyle || !validStyles.includes(body.outputStyle)) {
    errors.push(`outputStyle must be one of: ${validStyles.join(', ')}`);
  }

  // Optional: Validate credit token (if implementing credit system)
  // if (!body.creditToken) {
  //   errors.push('creditToken is required');
  // }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get system prompt based on output style
 */
function getSystemPrompt(outputStyle) {
  const prompts = {
    optimized: `You are an expert prompt engineer. Analyze the user's request and generate an optimized prompt that will produce the best results from AI models like ChatGPT, Claude, and Gemini.

Your output should:
- Be clear, specific, and actionable
- Include relevant context and constraints
- Use effective prompt engineering techniques
- Be production-ready (no explanations, just the prompt)

Output only the optimized prompt, nothing else.`,

    template: `You are a prompt template creator. Transform the user's request into a reusable prompt template with placeholders.

Your output should:
- Use [PLACEHOLDER] format for variables
- Include clear instructions for each placeholder
- Be adaptable to similar use cases
- Be production-ready with example values

Format:
=== PROMPT TEMPLATE ===
[The template with placeholders]

=== PLACEHOLDERS ===
• [PLACEHOLDER_NAME]: Description and example

Output only the template in this format, nothing else.`,

    workflow: `You are a multi-step prompt workflow designer. Break down the user's request into a series of connected prompts that build on each other.

Your output should:
- Define 2-4 sequential prompts
- Show how each step feeds into the next
- Include expected outputs for each step
- Be production-ready

Format:
=== STEP 1: [Title] ===
Prompt: [The prompt]
Expected Output: [What to expect]

=== STEP 2: [Title] ===
Prompt: [The prompt, referencing Step 1 output]
Expected Output: [What to expect]

Output only the workflow in this format, nothing else.`
  };

  return prompts[outputStyle] || prompts.optimized;
}

/**
 * Call OpenAI API
 */
async function callOpenAI(userInput, outputStyle) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const systemPrompt = getSystemPrompt(outputStyle);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userInput }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from OpenAI');
    }

    return {
      result: data.choices[0].message.content,
      model: data.model,
      usage: data.usage
    };

  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

/**
 * Main handler function
 */
async function handler(event, context) {
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

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Method not allowed. Use POST.'
      })
    };
  }

  try {
    // Parse body
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;

    // Validate request
    const validation = validateRequest(body);
    if (!validation.valid) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          errors: validation.errors
        })
      };
    }

    // Rate limiting
    const clientId = getClientIdentifier(event);
    const maxRequests = parseInt(process.env.RATE_LIMIT_MAX || '10');
    const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW || '900000'); // 15 minutes

    const rateCheck = checkRateLimit(clientId, maxRequests, windowMs);

    if (!rateCheck.allowed) {
      return {
        statusCode: 429,
        headers: {
          ...headers,
          'Retry-After': rateCheck.retryAfter.toString(),
          'X-RateLimit-Limit': rateCheck.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': (Date.now() + (rateCheck.retryAfter * 1000)).toString()
        },
        body: JSON.stringify({
          success: false,
          error: 'Rate limit exceeded',
          retryAfter: rateCheck.retryAfter
        })
      };
    }

    // Call OpenAI
    const result = await callOpenAI(body.userInput, body.outputStyle);

    // Success response
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'X-RateLimit-Limit': rateCheck.limit.toString(),
        'X-RateLimit-Remaining': rateCheck.remaining.toString()
      },
      body: JSON.stringify({
        success: true,
        result: result.result,
        model: result.model,
        usage: result.usage,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Handler error:', error);

    // Determine error type
    let statusCode = 500;
    let errorMessage = 'Internal server error';

    if (error.message.includes('OpenAI')) {
      statusCode = 502; // Bad Gateway
      errorMessage = 'AI service error';
    } else if (error.message.includes('parse')) {
      statusCode = 400;
      errorMessage = 'Invalid JSON';
    }

    return {
      statusCode,
      headers,
      body: JSON.stringify({
        success: false,
        error: errorMessage,
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
    headers: {
      'x-forwarded-for': '127.0.0.1'
    },
    body: JSON.stringify({
      userInput: 'Write a professional email to request a meeting with a potential client to discuss a new software project.',
      outputStyle: 'optimized'
    })
  };

  handler(testEvent, {})
    .then(response => {
      console.log('Status:', response.statusCode);
      console.log('Headers:', response.headers);
      const body = JSON.parse(response.body);
      console.log('Body:', JSON.stringify(body, null, 2));

      if (body.success) {
        console.log('\n✅ API call successful!');
        console.log('\n📝 Generated Prompt:');
        console.log(body.result);
      } else {
        console.error('\n❌ API call failed:', body.error);
      }

      process.exit(body.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}
