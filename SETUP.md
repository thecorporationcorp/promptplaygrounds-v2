# PROMPT PLAYGROUNDS - SETUP GUIDE

## 🚀 QUICK START

This guide will help you deploy PROMPT PLAYGROUNDZs from scratch.

## 📋 PREREQUISITES

- GitHub account
- Domain name (optional for testing, required for production)
- Payment processor accounts:
  - Ko-fi account
  - Gumroad account
  - Etsy shop (optional)
- Text editor (VS Code recommended)

## 🔧 INSTALLATION

### 1. Clone or Download Repository

```bash
git clone https://github.com/YOUR_USERNAME/promptplaygrounds.git
cd promptplaygrounds
```

### 2. Update Configuration

Open `index.html` and update:

```html
<!-- Line ~200: Update Ko-fi link -->
<a href="https://ko-fi.com/YOUR_KOFI_USERNAME" target="_blank" class="btn btn-secondary btn-lg btn-block">
  Get Access Now - 99¢
</a>
```

### 3. Configure Access Codes

Open `assets/js/auth.js` and update access codes:

```javascript
// Line ~11: Add your access codes
validCodes: [
  'YOUR_CODE_1',
  'YOUR_CODE_2',
  'YOUR_CODE_3'
],
```

**How to generate codes:**
- Use random string generators
- Make them memorable but unique
- Example: `PROMPT2024`, `EARLYBIRD`, `BETA99`

### 4. Set Up Gumroad Products

For each Project Filez item:

1. Go to https://gumroad.com/products
2. Create new product
3. Set price ($9.99 - $29)
4. Upload deliverable (PDF + bookmarklets)
5. Copy product link

Update `project-filez.html`:

```javascript
// Line ~350+: Update Gumroad links
gumroadLink: 'https://gumroad.com/l/YOUR_PRODUCT_ID'
```

### 5. Add Your Prompts

Edit `assets/data/prompts.json`:

```json
{
  "id": "unique-id",
  "title": "Your Prompt Title",
  "category": "Category",
  "price": 4.99,
  "developer": "Your Name",
  "rating": 4.5,
  "downloads": 0,
  "description": "What it does",
  "prompt": "The actual prompt text...",
  "tags": ["tag1", "tag2"],
  "featured": false
}
```

## 🌐 DEPLOYMENT OPTIONS

### Option 1: GitHub Pages (FREE, Recommended for Start)

1. Push code to GitHub
2. Go to repo Settings → Pages
3. Source: Deploy from branch `main`
4. Your site: `https://YOUR_USERNAME.github.io/promptplaygrounds/`

**Pros:**
- Free hosting
- Automatic HTTPS
- Easy updates (just push to GitHub)
- Fast global CDN

**Cons:**
- Can't use custom root domain (only subdomain)
- Limited to static sites

### Option 2: Vercel (FREE, Best for Custom Domain)

1. Create account at https://vercel.com
2. Import your GitHub repo
3. Deploy (automatic)
4. Connect custom domain in settings

**Pros:**
- Free custom domain
- Serverless functions (if needed later)
- Automatic deployments
- Great performance

**Cons:**
- Learning curve for advanced features

### Option 3: Netlify (FREE Alternative to Vercel)

1. Create account at https://netlify.com
2. Drag and drop your folder OR connect GitHub
3. Deploy
4. Connect custom domain

**Pros:**
- Easiest drag-and-drop deployment
- Free custom domain
- Form handling built-in

**Cons:**
- Fewer advanced features than Vercel

### Option 4: Traditional Web Hosting

Upload to any web host via FTP:
- BlueHost, HostGator, SiteGround, etc.
- Just upload all files to `public_html` or `www` folder

## 🏷️ CUSTOM DOMAIN SETUP

### 1. Buy Domain
- Namecheap, Google Domains, Cloudflare, etc.
- Recommended: `promptplaygrounds.com`

### 2. Point to Hosting

**For GitHub Pages:**
- Add `CNAME` file with your domain
- In domain DNS: `CNAME → YOUR_USERNAME.github.io`

**For Vercel/Netlify:**
- Follow their custom domain wizard
- Usually: `CNAME → cname.vercel-dns.com` (or Netlify equivalent)

### 3. Enable HTTPS
- GitHub Pages: Automatic after 24h
- Vercel/Netlify: Automatic immediately

## 💳 PAYMENT PROCESSOR SETUP

### Ko-fi (Library Access - 99¢)

1. Create Ko-fi account: https://ko-fi.com
2. Set up "Support" or "Shop" feature
3. Create a product: "PROMPT PLAYGROUNDZ Access - 99¢"
4. Get your Ko-fi link
5. Update in `index.html`

**How to deliver access codes:**
- Manually via Ko-fi messages (for now)
- Future: Automate with Ko-fi API or Zapier

### Gumroad (Project Filez - $9.99-$29)

1. Create Gumroad account: https://gumroad.com
2. Set up products for each Project File
3. Upload PDF guides + bookmarklet files
4. Set pricing
5. Copy product links
6. Update in `project-filez.html`

**Delivery:**
- Automatic via Gumroad
- Buyer gets instant download link

### Etsy (Optional Alternative)

1. Create Etsy shop
2. List as "Digital Downloads"
3. Upload same products as Gumroad
4. Good for reaching different audience

### Stripe (Future: Direct Payments)

For when you want to process payments directly:

1. Create Stripe account: https://stripe.com
2. Get API keys
3. Implement Stripe Checkout
4. Handle webhooks for fulfillment

**Not implemented yet** - start with Ko-fi/Gumroad for simplicity.

## 📧 EMAIL SETUP

### For Support Emails

**Option 1: Use Domain Email**
- Set up with your hosting provider
- Example: `support@promptplaygrounds.com`

**Option 2: Gmail with Custom Domain**
- Google Workspace ($6/month)
- Professional email with your domain

### For Marketing Emails

**Recommended Tools:**
- ConvertKit (best for creators)
- Mailchimp (free plan available)
- SendGrid (developer-friendly)

## 🔒 SECURITY

### Access Code Protection

Currently using localStorage - **not production-secure**.

**Future improvements:**
1. Backend API to verify codes
2. Database to track valid codes
3. Rate limiting on code attempts

**For now:**
- Change access codes monthly
- Don't share them publicly
- Monitor for abuse

### Content Moderation

The moderation system in `assets/js/moderation.js` is client-side only.

**For production:**
1. Run moderation server-side
2. Store submissions in database
3. Admin dashboard for review
4. Automated + manual review process

## 📊 ANALYTICS

### Google Analytics

1. Create GA4 property: https://analytics.google.com
2. Get tracking ID
3. Add to all HTML files:

```html
<!-- Add before </head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Hotjar (Optional - Heatmaps)

1. Create account: https://hotjar.com
2. Add tracking code
3. See where users click, scroll

## 🎨 CUSTOMIZATION

### Branding

**Colors** - Edit `assets/css/style.css`:

```css
:root {
  --primary: #6366f1;     /* Main brand color */
  --secondary: #ec4899;   /* Accent color */
  /* Change to your brand colors */
}
```

**Logo:**
- Replace emoji in navbar with custom logo
- Add `<img src="logo.png">` in navbar-brand

**Fonts:**
- Update `--font-sans` in CSS
- Or add Google Fonts

### Add More Prompts

Just edit `assets/data/prompts.json` - no coding required!

### Add More Categories

1. Edit `prompts.json` - add to `categories` array
2. Edit `hub.html` - add filter button
3. Done!

## 🧪 TESTING

Before going live:

- [ ] Test all payment links (Ko-fi, Gumroad)
- [ ] Test access code entry
- [ ] Test bookmarklet generation
- [ ] Test on ChatGPT and Claude
- [ ] Test on mobile devices
- [ ] Test all navigation links
- [ ] Check spelling/grammar
- [ ] Verify contact information

## 🚀 GOING LIVE

### Pre-Launch Checklist

- [ ] Domain configured and working
- [ ] HTTPS enabled
- [ ] Payment processors active
- [ ] Access codes generated
- [ ] At least 20 prompts loaded
- [ ] All links tested
- [ ] Analytics installed
- [ ] Social media accounts created
- [ ] Ko-fi page set up
- [ ] Gumroad products created

### Launch Day

1. Announce on social media
2. Post to Reddit (r/ChatGPT, etc.)
3. Email any existing contacts
4. Submit to Product Hunt
5. Engage with every comment

### Post-Launch

- Monitor analytics daily
- Respond to support requests within 24h
- Add new prompts weekly
- Engage on social media
- Collect testimonials
- Iterate based on feedback

## 🆘 TROUBLESHOOTING

### Bookmarklets not working
- Check JavaScript syntax
- Test in different browsers
- Verify AI chat site isn't blocking

### Payments not working
- Verify payment links are correct
- Check Ko-fi/Gumroad settings
- Test in incognito mode

### Access codes not working
- Check `auth.js` validCodes array
- Clear browser cache
- Try different code

### Site not loading
- Check deployment status
- Verify domain DNS settings
- Wait 24-48h for DNS propagation

## 📞 SUPPORT

Need help?

- Check documentation again
- Search for error messages
- Ask in relevant communities
- Hire a developer on Fiverr/Upwork

## 🔄 UPDATES & MAINTENANCE

### Adding New Prompts
1. Edit `prompts.json`
2. Commit and push
3. Automatic deployment

### Updating Prices
1. Edit in `prompts.json` OR `project-filez.html`
2. Update on Ko-fi/Gumroad
3. Keep in sync

### Generating New Access Codes
1. Create code (random string)
2. Add to `auth.js`
3. Give to paying customers
4. Track manually (or build system)

## 📈 GROWTH & SCALING

When you're ready to scale:

1. **Backend Database**
   - Store prompts in database (not JSON)
   - Track user purchases
   - Analytics & insights

2. **Authentication**
   - Real user accounts
   - Password reset
   - OAuth login

3. **Payment Processing**
   - Direct Stripe integration
   - Subscription options
   - Automated fulfillment

4. **Creator Dashboard**
   - Upload prompts directly
   - Track earnings
   - Automated payouts

5. **API**
   - Let developers integrate
   - Chrome extension API
   - Mobile app API

## 🎯 NEXT STEPS

1. **Test everything locally**
2. **Deploy to GitHub Pages** (easiest start)
3. **Set up Ko-fi** and test payment
4. **Create 5-10 test prompts**
5. **Share with friends** for feedback
6. **Iterate and improve**
7. **Go live** when ready!

---

**Remember:** Done is better than perfect. Launch and iterate!
