# PROMPT PLAYGROUNDZs - Deployment Guide

## 🎯 Quick Start Checklist

- [x] Frontend code complete
- [x] Security audit passed (95%)
- [x] XSS vulnerabilities patched
- [ ] Email service configured
- [ ] Webhook endpoints deployed
- [ ] Product URLs configured
- [ ] End-to-end testing complete

---

## 📧 Email Service Setup (30 minutes)

### Option 1: SendGrid (Recommended)

**Why SendGrid?**
- Free tier: 100 emails/day
- Reliable delivery
- Simple API

**Setup Steps:**

1. **Create SendGrid Account**
   ```
   https://signup.sendgrid.com/
   ```

2. **Get API Key**
   - Settings → API Keys → Create API Key
   - Name: "PROMPT PLAYGROUNDZs"
   - Permissions: Full Access (or Mail Send only)
   - Copy the API key (save it securely!)

3. **Verify Sender Email**
   - Settings → Sender Authentication
   - Single Sender Verification
   - Use your business email (e.g., hello@yourdomain.com)

4. **Add to Environment Variables**
   ```bash
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
   SENDGRID_FROM_EMAIL=hello@yourdomain.com
   SENDGRID_FROM_NAME=PROMPT PLAYGROUNDZs
   ```

5. **Update webhook-handler.js**
   - Replace line 321-340 with actual SendGrid API call
   - See code snippet below

**SendGrid Integration Code:**

```javascript
// In webhook-handler.js, replace simulateEmailSend() with:

async sendEmail(emailData) {
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: emailData.to }],
          subject: emailData.subject
        }],
        from: {
          email: process.env.SENDGRID_FROM_EMAIL,
          name: process.env.SENDGRID_FROM_NAME
        },
        content: [{
          type: 'text/html',
          value: emailData.html
        }]
      })
    });

    if (response.ok) {
      console.log('✅ Email sent successfully');
      return true;
    } else {
      const error = await response.text();
      console.error('❌ SendGrid error:', error);
      return false;
    }
  } catch (error) {
    console.error('❌ Email send failed:', error);
    return false;
  }
}
```

### Option 2: EmailJS (Easiest, Client-Side)

**Why EmailJS?**
- No server required
- Free tier: 200 emails/month
- Works from browser

**Setup Steps:**

1. **Create EmailJS Account**
   ```
   https://www.emailjs.com/
   ```

2. **Add Email Service**
   - Dashboard → Email Services → Add Service
   - Choose Gmail/Outlook/etc.
   - Connect your account

3. **Create Email Template**
   - Dashboard → Email Templates → Create Template
   - Template ID: `welcome_email`
   - Use variables: `{{access_code}}`, `{{user_name}}`, etc.

4. **Get Credentials**
   - Copy Public Key, Service ID, Template ID

5. **Add EmailJS SDK to HTML**
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
   <script>
     emailjs.init('YOUR_PUBLIC_KEY');
   </script>
   ```

6. **Update webhook-handler.js**
   ```javascript
   async sendEmail(emailData) {
     return emailjs.send(
       'YOUR_SERVICE_ID',
       'welcome_email',
       {
         to_email: emailData.to,
         access_code: purchaseRecord.accessCode,
         user_name: purchaseRecord.name
       }
     );
   }
   ```

---

## 🔗 Webhook Endpoints Setup (60 minutes)

### Deployment Option 1: Vercel Serverless Functions

**Setup Steps:**

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Create API Directory**
   ```bash
   mkdir -p api
   ```

3. **Create Ko-fi Webhook Handler**

   **File: `api/webhooks/kofi.js`**
   ```javascript
   const crypto = require('crypto');

   export default async function handler(req, res) {
     // Only accept POST requests
     if (req.method !== 'POST') {
       return res.status(405).json({ error: 'Method not allowed' });
     }

     try {
       // Parse Ko-fi webhook data
       const data = JSON.parse(req.body.data);

       // Validate webhook (optional but recommended)
       // Ko-fi sends: verification_token
       if (data.verification_token !== process.env.KOFI_VERIFICATION_TOKEN) {
         return res.status(401).json({ error: 'Invalid token' });
       }

       // Extract order data
       const orderData = {
         orderId: data.kofi_transaction_id,
         email: data.email,
         name: data.from_name,
         amount: parseFloat(data.amount),
         currency: data.currency,
         timestamp: data.timestamp
       };

       // Generate access code
       const accessCode = generateAccessCode();

       // Send welcome email (using SendGrid or EmailJS)
       await sendWelcomeEmail(orderData.email, orderData.name, accessCode);

       // Store purchase record (optional - use database)
       // await db.purchases.create({ ...orderData, accessCode });

       return res.status(200).json({
         success: true,
         message: 'Access code sent!'
       });

     } catch (error) {
       console.error('Webhook error:', error);
       return res.status(500).json({ error: error.message });
     }
   }

   function generateAccessCode() {
     const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
     let code = '';
     for (let i = 0; i < 12; i++) {
       code += chars[Math.floor(Math.random() * chars.length)];
     }
     return code.match(/.{1,4}/g).join('-'); // Format: XXXX-XXXX-XXXX
   }

   async function sendWelcomeEmail(email, name, accessCode) {
     // Your SendGrid/EmailJS code here
     // See email setup section above
   }
   ```

4. **Create Gumroad Webhook Handler**

   **File: `api/webhooks/gumroad.js`**
   ```javascript
   export default async function handler(req, res) {
     if (req.method !== 'POST') {
       return res.status(405).json({ error: 'Method not allowed' });
     }

     try {
       // Gumroad sends application/x-www-form-urlencoded
       const {
         sale_id,
         email,
         full_name,
         price,
         product_id,
         product_name
       } = req.body;

       // Determine product type
       const productType = product_id.includes('project') ? 'project_file' : 'gpt';

       // For Project Files: Send download link
       // For Custom GPTs: Send GPT access link

       const accessLink = productType === 'gpt'
         ? process.env[`GPT_LINK_${product_id}`]
         : process.env[`PROJECT_FILE_URL_${product_id}`];

       // Send email with appropriate link
       await sendProductEmail(email, full_name, productType, accessLink);

       return res.status(200).json({ success: true });

     } catch (error) {
       console.error('Gumroad webhook error:', error);
       return res.status(500).json({ error: error.message });
     }
   }
   ```

5. **Create Environment Variables File**

   **File: `.env`**
   ```bash
   # SendGrid
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
   SENDGRID_FROM_EMAIL=hello@yourdomain.com
   SENDGRID_FROM_NAME=PROMPT PLAYGROUNDZs

   # Ko-fi
   KOFI_VERIFICATION_TOKEN=your_kofi_verification_token

   # Custom GPT Links (replace with actual)
   GPT_LINK_seo_writer=https://chat.openai.com/g/g-xxxxx
   GPT_LINK_code_review=https://chat.openai.com/g/g-xxxxx
   GPT_LINK_social_media=https://chat.openai.com/g/g-xxxxx
   GPT_LINK_email_marketing=https://chat.openai.com/g/g-xxxxx

   # Project File URLs (replace with actual)
   PROJECT_FILE_URL_startup=https://yourdomain.com/downloads/startup-project.zip
   PROJECT_FILE_URL_book=https://yourdomain.com/downloads/book-project.zip
   ```

6. **Deploy to Vercel**
   ```bash
   vercel
   # Follow prompts
   # Set environment variables in Vercel dashboard
   ```

7. **Get Webhook URLs**
   ```
   https://your-project.vercel.app/api/webhooks/kofi
   https://your-project.vercel.app/api/webhooks/gumroad
   ```

8. **Configure Ko-fi**
   - Ko-fi Dashboard → Settings → Webhooks
   - Add webhook URL: `https://your-project.vercel.app/api/webhooks/kofi`

9. **Configure Gumroad**
   - Gumroad Dashboard → Settings → Advanced → Webhooks
   - Add webhook URL: `https://your-project.vercel.app/api/webhooks/gumroad`

### Deployment Option 2: Netlify Functions

Similar to Vercel but create files in `netlify/functions/` directory instead of `api/`.

---

## 🛍️ Product Configuration (30 minutes)

### 1. Ko-fi Setup (Library Access - $0.99)

1. **Create Ko-fi Account**
   ```
   https://ko-fi.com/manage/webhooks
   ```

2. **Enable Webhooks**
   - Settings → Webhooks
   - Add your webhook URL
   - Save verification token to `.env`

3. **Set Price**
   - Dashboard → Donations
   - Set suggested amount: $0.99
   - Add description: "Lifetime access to 20+ AI prompts"

### 2. Gumroad Setup (Project Files + Custom GPTs)

1. **Create Gumroad Account**
   ```
   https://gumroad.com/
   ```

2. **Create Products**

   **For Custom GPTs** (4 products):
   - Name: "SEO Content Writer GPT"
   - Price: $14.99
   - Description: "Instant access to pre-configured GPT"
   - File: Upload a text file with the GPT link (customers get link after purchase)

   **For Project Files** (6 products):
   - Name: "Startup Launch Project"
   - Price: $29.99
   - Description: "Complete ChatGPT workspace setup"
   - File: Upload the actual .zip project file

3. **Enable Webhooks**
   - Settings → Advanced → Webhooks
   - Add URL: `https://your-project.vercel.app/api/webhooks/gumroad`

4. **Get Product IDs**
   - Each product has an ID (e.g., `abc123`)
   - Copy these to update `project-filez.html`

### 3. Update project-filez.html URLs

Replace all `YOUR_PRODUCT_ID` placeholders:

```javascript
// Find these lines in project-filez.html and update:

'gpt-seo-writer': {
  gumroadUrl: 'https://gumroad.com/l/YOUR_PRODUCT_ID',  // ← Replace with actual
  gptAccessLink: 'https://chat.openai.com/g/YOUR-GPT-ID', // ← Replace with actual
}
```

---

## 🧪 Testing Checklist

### 1. Email Testing
- [ ] Send test email via SendGrid/EmailJS
- [ ] Verify email delivery
- [ ] Check spam folder
- [ ] Verify access code is readable
- [ ] Test email on mobile devices

### 2. Webhook Testing
- [ ] Use Ko-fi test webhook feature
- [ ] Use Gumroad test webhook feature
- [ ] Verify webhook receives data
- [ ] Verify access code generation
- [ ] Verify email is sent automatically
- [ ] Check webhook logs for errors

### 3. Purchase Flow Testing
- [ ] Make test purchase on Ko-fi
- [ ] Make test purchase on Gumroad
- [ ] Verify email arrives within 2 minutes
- [ ] Test access code on hub.html
- [ ] Verify all prompts are accessible
- [ ] Test bookmarklet installation
- [ ] Test bookmarklet on ChatGPT/Claude

### 4. Product Testing (Gumroad)
- [ ] Test Custom GPT link delivery
- [ ] Verify GPT link works (opens in ChatGPT)
- [ ] Test Project File download
- [ ] Verify .zip file contains all files
- [ ] Test import into ChatGPT Projects

---

## 🚀 Go-Live Checklist

### Pre-Launch
- [ ] All placeholder URLs replaced
- [ ] Email service tested and working
- [ ] Webhooks tested and working
- [ ] Purchased test access yourself
- [ ] Tested on mobile device
- [ ] Tested on different browsers
- [ ] SSL certificate installed
- [ ] Domain configured

### Launch Day
- [ ] Update Ko-fi page with marketing copy
- [ ] Update Gumroad product pages
- [ ] Add payment confirmation message
- [ ] Enable Google Analytics (optional)
- [ ] Monitor webhook logs
- [ ] Test first real purchase

### Post-Launch
- [ ] Monitor email delivery rates
- [ ] Check webhook error rates
- [ ] Review customer feedback
- [ ] Fix any reported issues
- [ ] Track conversion rates

---

## 🔧 Troubleshooting

### Email Not Sending
1. Check SendGrid API key is correct
2. Verify sender email is verified
3. Check spam folder
4. Review SendGrid activity logs
5. Check rate limits (100/day on free tier)

### Webhook Not Triggering
1. Verify webhook URL is correct (must be HTTPS)
2. Check Vercel/Netlify function logs
3. Test with webhook testing tools
4. Verify verification tokens match
5. Check for CORS issues

### Access Code Not Working
1. Verify code is 12 characters (XXXX-XXXX-XXXX format)
2. Check localStorage for stored codes
3. Verify AuthSystem.grantAccess() logic
4. Check browser console for errors

### Bookmarklet Not Working
1. Test on different AI platforms
2. Check browser console for errors
3. Verify bookmarklet code is not blocked
4. Try manual copy/paste as fallback

---

## 📊 Monitoring & Analytics

### Essential Metrics to Track

1. **Conversion Rate**
   - Page visits → Purchases
   - Target: 1-3%

2. **Email Delivery Rate**
   - Emails sent → Emails delivered
   - Target: 98%+

3. **Webhook Success Rate**
   - Webhooks received → Successfully processed
   - Target: 99%+

4. **Customer Support Requests**
   - Access code issues
   - Bookmarklet installation help
   - Product delivery problems

### Recommended Tools
- **Plausible Analytics** (privacy-friendly)
- **Vercel Analytics** (built-in)
- **SendGrid Analytics** (email metrics)
- **Gumroad Dashboard** (sales metrics)

---

## 🆘 Support Resources

### Documentation
- SendGrid Docs: https://docs.sendgrid.com/
- Vercel Docs: https://vercel.com/docs
- Ko-fi API: https://help.ko-fi.com/hc/en-us/articles/360001060832
- Gumroad API: https://help.gumroad.com/article/280-gumroad-api

### Need Help?
- Check `AUDIT_REPORT.md` for code quality details
- Check `SECURITY_FIXES.md` for security implementation
- Review `assets/js/webhook-handler.js` for automation logic
- Review `assets/js/admin.js` for admin panel features

---

## 📝 Maintenance Schedule

### Daily
- Check email queue for stuck messages
- Review webhook error logs
- Monitor customer support requests

### Weekly
- Review sales analytics
- Check for new customer feedback
- Update prompt library if needed

### Monthly
- Review security best practices
- Update dependencies
- Backup purchase records
- Review and optimize conversion rates

---

**Next Step:** Set up email service (SendGrid recommended) - takes 30 minutes
