# EMAIL INTEGRATION SETUP GUIDE

Complete guide to setting up production email notifications for Prompt Playgroundz.

## Overview

The email system sends:
- 🚨 **Critical Alerts**: System errors, failures, security issues
- 📊 **Daily Reports**: Health metrics, usage stats, performance data
- ✅ **Test Emails**: Verify integration is working

**Recipient**: thecorporationcorp@thecorporationcorp.com

---

## Architecture

```
┌─────────────────────┐
│  Browser (Frontend) │
│                     │
│ • system-monitor.js │
│ • email-integration │
└──────────┬──────────┘
           │
           │ HTTPS POST
           │ /api/send-email
           ▼
┌─────────────────────┐
│  Serverless Backend │
│                     │
│ • api/send-email.js │
│ • Rate limiting     │
│ • Validation        │
└──────────┬──────────┘
           │
           ├──────────────┐
           │              │
           ▼              ▼
    ┌──────────┐   ┌──────────┐
    │ SendGrid │   │ AWS SES  │
    └──────────┘   └──────────┘
```

---

## Option 1: SendGrid (Recommended)

### Why SendGrid?
- ✅ Easy setup (5 minutes)
- ✅ Free tier: 100 emails/day
- ✅ Great deliverability
- ✅ Simple API

### Step 1: Create SendGrid Account

1. Go to https://signup.sendgrid.com/
2. Sign up for free account
3. Verify your email address

### Step 2: Get API Key

1. Go to https://app.sendgrid.com/settings/api_keys
2. Click "Create API Key"
3. Name: "Prompt Playgroundz Production"
4. Permissions: "Full Access" (or "Mail Send" minimum)
5. Click "Create & View"
6. **COPY THE API KEY** (you won't see it again!)

### Step 3: Verify Sender Email

1. Go to https://app.sendgrid.com/settings/sender_auth/senders
2. Click "Create New Sender"
3. Fill in your details:
   - From Email: noreply@promptplaygroundz.com (or your domain)
   - Reply To: thecorporationcorp@thecorporationcorp.com
   - Name: Prompt Playgroundz
4. Verify email address

### Step 4: Install Dependencies

```bash
cd api
npm install @sendgrid/mail
```

### Step 5: Configure Environment Variables

**For Vercel:**
```bash
vercel env add SENDGRID_API_KEY
# Paste your API key when prompted

vercel env add EMAIL_PROVIDER
# Enter: sendgrid

vercel env add EMAIL_FROM
# Enter: noreply@promptplaygroundz.com

vercel env add EMAIL_TO
# Enter: thecorporationcorp@thecorporationcorp.com
```

**For Netlify:**
```bash
netlify env:set SENDGRID_API_KEY "YOUR_API_KEY"
netlify env:set EMAIL_PROVIDER "sendgrid"
netlify env:set EMAIL_FROM "noreply@promptplaygroundz.com"
netlify env:set EMAIL_TO "thecorporationcorp@thecorporationcorp.com"
```

**For Local Testing (.env file):**
```bash
# Create .env file
cat > api/.env << EOF
SENDGRID_API_KEY=SG.your_api_key_here
EMAIL_PROVIDER=sendgrid
EMAIL_FROM=noreply@promptplaygroundz.com
EMAIL_TO=thecorporationcorp@thecorporationcorp.com
EOF

# IMPORTANT: Add to .gitignore!
echo "api/.env" >> .gitignore
```

### Step 6: Deploy

```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod
```

### Step 7: Test

```bash
# From browser console (after deployment):
EmailIntegration.testEmail()

# Or from command line:
cd api
node send-email.js
```

---

## Option 2: AWS SES

### Why AWS SES?
- ✅ Very cheap ($0.10 per 1,000 emails)
- ✅ High sending limits
- ✅ AWS ecosystem integration

### Step 1: Create AWS Account

1. Go to https://aws.amazon.com/
2. Sign up or log in to AWS Console

### Step 2: Verify Email Address

1. Go to AWS SES Console: https://console.aws.amazon.com/ses/
2. Choose your region (e.g., us-east-1)
3. Click "Verified identities"
4. Click "Create identity"
5. Choose "Email address"
6. Enter: noreply@promptplaygroundz.com
7. Check inbox and click verification link

**Note**: New accounts start in "sandbox mode" - you can only send to verified addresses. To send to any address, request production access.

### Step 3: Create IAM User

1. Go to IAM Console: https://console.aws.amazon.com/iam/
2. Click "Users" → "Add users"
3. Username: "promptplaygroundz-email"
4. Access type: "Programmatic access"
5. Attach policy: "AmazonSESFullAccess"
6. Create user
7. **SAVE ACCESS KEY ID AND SECRET KEY**

### Step 4: Install Dependencies

```bash
cd api
npm install aws-sdk
```

### Step 5: Configure Environment Variables

**For Vercel:**
```bash
vercel env add AWS_ACCESS_KEY_ID
# Enter your access key ID

vercel env add AWS_SECRET_ACCESS_KEY
# Enter your secret access key

vercel env add AWS_REGION
# Enter: us-east-1 (or your region)

vercel env add EMAIL_PROVIDER
# Enter: aws_ses

vercel env add EMAIL_FROM
# Enter: noreply@promptplaygroundz.com

vercel env add EMAIL_TO
# Enter: thecorporationcorp@thecorporationcorp.com
```

**For Netlify:**
```bash
netlify env:set AWS_ACCESS_KEY_ID "YOUR_KEY"
netlify env:set AWS_SECRET_ACCESS_KEY "YOUR_SECRET"
netlify env:set AWS_REGION "us-east-1"
netlify env:set EMAIL_PROVIDER "aws_ses"
netlify env:set EMAIL_FROM "noreply@promptplaygroundz.com"
netlify env:set EMAIL_TO "thecorporationcorp@thecorporationcorp.com"
```

### Step 6: Deploy and Test

Same as SendGrid steps 6-7.

---

## Deployment Platforms

### Vercel (Recommended)

**Why Vercel?**
- ✅ Zero-config serverless functions
- ✅ Automatic HTTPS
- ✅ Fast global CDN
- ✅ Free tier generous

**Deploy:**
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables (see above)
vercel env add SENDGRID_API_KEY
# ... etc

# Deploy to production
vercel --prod
```

**File structure:**
```
promptplaygrounds-v2/
├── api/
│   └── send-email.js  ← Auto-deployed as serverless function
├── assets/
├── index.html
└── package.json
```

### Netlify

**Deploy:**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize
netlify init

# Deploy
netlify deploy --prod
```

**Configuration (netlify.toml):**
```toml
[build]
  functions = "api"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

### AWS Lambda

**Using Serverless Framework:**

```bash
# Install Serverless
npm install -g serverless

# Create serverless.yml:
cat > serverless.yml << EOF
service: promptplaygroundz-email

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    SENDGRID_API_KEY: \${env:SENDGRID_API_KEY}
    EMAIL_PROVIDER: sendgrid
    EMAIL_FROM: noreply@promptplaygroundz.com
    EMAIL_TO: thecorporationcorp@thecorporationcorp.com

functions:
  sendEmail:
    handler: api/send-email.handler
    events:
      - http:
          path: api/send-email
          method: post
          cors: true
EOF

# Deploy
serverless deploy
```

---

## Testing

### 1. Local Testing

```bash
# Set environment variables
export SENDGRID_API_KEY="your_key"
export EMAIL_PROVIDER="sendgrid"
export EMAIL_FROM="noreply@promptplaygroundz.com"
export EMAIL_TO="thecorporationcorp@thecorporationcorp.com"

# Install dependencies
cd api
npm install

# Run test
node send-email.js
```

### 2. Browser Testing

Open your deployed site and run in console:

```javascript
// Test email integration
EmailIntegration.testEmail()

// Check status
EmailIntegration.getStatus()

// Manual email
EmailIntegration.queueEmail({
  subject: 'Test from Browser',
  htmlBody: '<h1>Test</h1><p>This is a test.</p>',
  type: 'test'
})
```

### 3. Trigger System Alert

```javascript
// In browser console:
// Trigger an error to test alert system
throw new Error('Test alert - ignore this')

// Check if alert was queued
SystemMonitor.state.activeAlerts
```

---

## Monitoring

### Email Queue Status

Check email queue from browser console:

```javascript
// Queue status
console.log(EmailIntegration.getStatus())
// Output:
// {
//   queueSize: 0,
//   sending: false,
//   lastSent: "2025-01-15T10:30:00.000Z",
//   totalSent: 42,
//   totalFailed: 1
// }

// View failed emails
let failed = localStorage.getItem('emailIntegration_failed')
console.log(JSON.parse(failed))
```

### Retry Failed Emails

```javascript
// Retry all failed emails
EmailIntegration.retryFailed()
```

### Clear Queue (Emergency)

```javascript
// Only use if needed!
EmailIntegration.clearQueue()
```

---

## Troubleshooting

### "Email API endpoint not configured"

**Solution**: Email integration needs the API endpoint. Either:

1. Deploy your API first, then update frontend
2. Or manually set endpoint:

```javascript
EmailIntegration.setEndpoint('https://your-domain.com/api/send-email')
```

### "Unauthorized recipient"

**Cause**: Email security check - only sends to configured recipient.

**Solution**: Verify `EMAIL_TO` environment variable matches recipient.

### "SendGrid API key invalid"

**Solutions**:
1. Regenerate API key in SendGrid dashboard
2. Ensure you copied the full key (starts with `SG.`)
3. Check environment variables are set correctly
4. Redeploy after updating environment variables

### "AWS SES Sandbox Mode"

**Cause**: New AWS accounts can only send to verified addresses.

**Solution**:
1. Request production access: https://console.aws.amazon.com/ses/
2. Go to "Account Dashboard" → "Request production access"
3. Fill out form (usually approved within 24 hours)

### Emails Going to Spam

**Solutions**:
1. **SendGrid**: Add domain authentication (SPF/DKIM)
   - Go to: https://app.sendgrid.com/settings/sender_auth
   - Follow domain authentication wizard
2. **AWS SES**: Configure SPF and DKIM records
3. Use professional "From" email (noreply@yourdomain.com)
4. Include unsubscribe link (not required for internal alerts)

### Rate Limiting

Current settings allow:
- 5 emails per minute (frontend rate limit)
- No backend rate limit (add if needed)

**To adjust** (assets/js/email-integration.js):
```javascript
config: {
  retryAttempts: 3,    // Increase if emails fail
  retryDelay: 2000,    // Delay between retries (ms)
  timeout: 10000       // Request timeout (ms)
}
```

---

## Cost Estimation

### SendGrid (Free Tier)
- **Free**: 100 emails/day forever
- **Essentials**: $19.95/month for 50,000 emails
- **Pro**: $89.95/month for 1.5M emails

**Your Usage**:
- Daily report: 1 email/day
- Alerts: ~5 emails/month (estimated)
- **Total**: ~35 emails/month → **FREE TIER**

### AWS SES
- **Pricing**: $0.10 per 1,000 emails
- **Your Usage**: 35 emails/month = **$0.004/month** (~$0.05/year)
- Basically free!

---

## Security Best Practices

### ✅ DO:
- Store API keys in environment variables
- Use HTTPS for all API calls
- Validate recipient email (already implemented)
- Rate limit email sending (already implemented)
- Keep SendGrid/AWS credentials secret

### ❌ DON'T:
- Commit API keys to Git
- Expose API keys in client-side code
- Allow sending to arbitrary email addresses
- Store API keys in localStorage

### Security Checklist:
- [ ] API keys in environment variables
- [ ] `.env` files in `.gitignore`
- [ ] HTTPS enabled on production domain
- [ ] Recipient validation enabled
- [ ] Rate limiting active
- [ ] Error messages don't expose secrets

---

## Production Checklist

Before going live:

- [ ] Email provider configured (SendGrid or AWS SES)
- [ ] Environment variables set
- [ ] Sender email verified
- [ ] Test email sent successfully
- [ ] Daily report scheduled (09:00)
- [ ] Error alerts working
- [ ] Queue persistence tested
- [ ] Monitoring dashboard accessible
- [ ] Backup/fallback plan documented

---

## Support

**SendGrid Support**: https://support.sendgrid.com/
**AWS SES Documentation**: https://docs.aws.amazon.com/ses/
**Vercel Support**: https://vercel.com/support
**Netlify Support**: https://www.netlify.com/support/

**Emergency Email Access**:
- Failed emails stored in: `localStorage.getItem('emailIntegration_failed')`
- Queue stored in: `localStorage.getItem('emailIntegration_queue')`
- Can manually copy and send via email client

---

## Next Steps

1. ✅ Choose email provider (SendGrid recommended)
2. ✅ Create account and verify sender
3. ✅ Get API credentials
4. ✅ Deploy serverless function
5. ✅ Set environment variables
6. ✅ Test integration
7. ✅ Monitor for 24 hours
8. ✅ Celebrate! 🎉

---

**Questions?** Check the troubleshooting section or review the code comments in:
- `api/send-email.js` - Serverless function
- `assets/js/email-integration.js` - Client-side queue
- `assets/js/system-monitor.js` - Alert system
