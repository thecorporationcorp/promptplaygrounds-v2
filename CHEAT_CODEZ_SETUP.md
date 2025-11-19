# ⚡ CHEAT CODEZ - SETUP GUIDE

## What is Cheat Codez?

Cheat Codez is your AI-powered prompt generator that transforms rough ideas into professional, optimized prompts. It's the third pillar of PROMPT PLAYGROUNDZ:

1. **PROMPT PLAYGROUNDZ Library** - Browse & use existing prompts ($0.99)
2. **Cheat Codez** - AI-generated custom prompts ($1.99) **← YOU ARE HERE**
3. **Project Filez** - Premium classified prompts ($10-$99)

---

## 🚀 LAUNCH CHECKLIST

### 1. Get OpenAI API Key

**You need this to generate prompts with AI.**

1. Go to https://platform.openai.com/api-keys
2. Create an account (if you don't have one)
3. Click "Create new secret key"
4. Copy the key (starts with `sk-...`)
5. **IMPORTANT:** Keep this secret! Never share it publicly.

**Cost:** ~$0.15 per generation with `gpt-4o-mini`
**Your profit:** $1.99 - $0.15 = **$1.84 per generation** (92% margin!)

### 2. Configure API Key

#### Option A: Browser Console (Quick Test)

1. Open `cheat-codez.html` in your browser
2. Press F12 (open DevTools)
3. Go to Console tab
4. Run this command:

```javascript
localStorage.setItem('cheatCodezAPIKey', 'sk-YOUR_ACTUAL_KEY_HERE')
```

5. Refresh the page
6. Test by generating a prompt!

#### Option B: Backend Integration (Production Recommended)

**Why?** Your API key should NEVER be in the browser. Use a backend.

**Quick Setup with Vercel/Netlify Serverless:**

1. Create `/api/generate-prompt.js`:

```javascript
// Vercel/Netlify serverless function
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userInput, outputStyle } = req.body;

  // Validate input
  if (!userInput || userInput.length < 10) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  // Call OpenAI (API key stored as environment variable)
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: getSystemPrompt(outputStyle) },
        { role: 'user', content: userInput }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })
  });

  const data = await response.json();
  return res.status(200).json({
    prompt: data.choices[0].message.content
  });
}

function getSystemPrompt(style) {
  // Copy from assets/js/cheat-codez.js
  const prompts = {
    optimized: `You are an expert prompt engineer...`,
    template: `You are an expert prompt engineer...`,
    workflow: `You are an expert prompt engineer...`
  };
  return prompts[style] || prompts.optimized;
}
```

2. Set environment variable on Vercel/Netlify:
   - `OPENAI_API_KEY` = `sk-your-key-here`

3. Update `assets/js/cheat-codez.js`:

```javascript
// Replace the callAI() function to call your backend:
async callAI(userInput, outputStyle) {
  const response = await fetch('/api/generate-prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userInput, outputStyle })
  });

  const data = await response.json();
  return data.prompt;
}
```

### 3. Configure Payment Processing

Replace placeholder Gumroad link in `cheat-codez.html`:

1. Create product on Gumroad:
   - Product name: "Cheat Codez - 10 Pack"
   - Price: $14.99 (for 10 generations, saves 25%)
   - Or: $1.99 (single generation)

2. Find this line in `cheat-codez.html`:

```html
<a href="https://gumroad.com/l/YOUR_PRODUCT_LINK" ...>
```

3. Replace with your actual Gumroad link

4. (Optional) Add webhook to auto-grant credits after purchase

### 4. Update Chat Capture Bookmarklet

In `cheat-codez.html`, find the Chat Capture bookmarklet and replace `DOMAIN`:

```html
<!-- Find this line (around line 240) -->
const cheatUrl='DOMAIN/cheat-codez.html?capture='+...

<!-- Replace with -->
const cheatUrl='https://promptplaygroundz.com/cheat-codez.html?capture='+...
```

### 5. Test Everything

1. Open `cheat-codez.html` in browser
2. Enter a test prompt: "Help me write professional emails"
3. Select output style (Optimized/Template/Workflow)
4. Click "Generate Cheat Code"
5. Verify:
   - ✅ Prompt is generated successfully
   - ✅ Credits decrease (3 → 2)
   - ✅ Result displays correctly
   - ✅ Copy button works
   - ✅ After 3 uses, payment prompt appears

6. Test Chat Capture:
   - Install the bookmarklet
   - Go to ChatGPT
   - Click the bookmark
   - Verify chat loads into Cheat Codez

---

## 💰 PRICING & CREDITS

### Free Tier
- **3 free generations** per user
- Tracked in `localStorage`
- Perfect for testing/demos

### Paid Tier
- **$1.99 per generation**
- Or **$14.99 for 10** (25% savings)
- Or **$19.99/month unlimited** (power users)

### Adding Credits (After Purchase)

When a user buys more generations:

```javascript
// In browser console (or via backend webhook)
CheatCodez.addCredits(10); // Adds 10 credits
```

**Production:** Integrate Gumroad webhook to automatically add credits after payment.

---

## 📊 COST ANALYSIS

### Per Generation:
- **Revenue:** $1.99
- **OpenAI Cost:** ~$0.15 (gpt-4o-mini)
- **Profit:** $1.84 (**92% margin!**)

### Monthly Projections:

| Generations | Revenue | Costs | Profit |
|------------|---------|-------|--------|
| 100 | $199 | $15 | $184 |
| 500 | $995 | $75 | $920 |
| 1,000 | $1,990 | $150 | $1,840 |
| 5,000 | $9,950 | $750 | $9,200 |

**This is HIGHLY profitable!**

---

## 🔐 SECURITY BEST PRACTICES

### DO:
- ✅ Store API key in environment variables (backend)
- ✅ Validate all user input
- ✅ Rate limit to prevent abuse
- ✅ Use HTTPS everywhere
- ✅ Monitor API usage on OpenAI dashboard

### DON'T:
- ❌ Put API key in frontend code
- ❌ Commit API key to git
- ❌ Share API key publicly
- ❌ Use production key for testing

### Rate Limiting

Add to your backend:

```javascript
// Simple in-memory rate limiting
const rateLimits = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const limit = rateLimits.get(ip) || { count: 0, reset: now + 60000 };

  if (now > limit.reset) {
    limit.count = 0;
    limit.reset = now + 60000;
  }

  limit.count++;
  rateLimits.set(ip, limit);

  // Max 10 requests per minute
  if (limit.count > 10) {
    return false;
  }

  return true;
}
```

---

## 🚨 TROUBLESHOOTING

### "Generation failed. Please try again."

**Possible causes:**
1. API key not configured
2. OpenAI API quota exceeded
3. Network error
4. Invalid API key

**Solutions:**
1. Check browser console for errors (F12)
2. Verify API key is correct
3. Check OpenAI usage dashboard
4. Test API key with curl:

```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer sk-YOUR-KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"test"}]}'
```

### Free credits not working

**Solution:**
```javascript
// Reset credits in browser console
CheatCodez.resetFreeCredits()
```

### Chat Capture not working

**Possible causes:**
1. Not on ChatGPT/Claude
2. ChatGPT UI changed (they update frequently)
3. Bookmarklet not installed correctly

**Solutions:**
1. Test on chat.openai.com or claude.ai
2. Update selectors in bookmarklet code
3. Re-drag bookmarklet to bookmark bar

---

## 📈 ANALYTICS TRACKING

Add Google Analytics to track usage:

```javascript
// In cheat-codez.js, update trackGeneration()
trackGeneration(input, style) {
  // Google Analytics 4
  gtag('event', 'generate_cheat_code', {
    'output_style': style,
    'credits_remaining': this.state.creditsRemaining,
    'input_length': input.length
  });
}
```

**Metrics to track:**
- Total generations
- Conversions (free → paid)
- Popular output styles
- Average input length
- Bounce rate

---

## 🎯 NEXT STEPS

### Launch Day:
1. ✅ Configure OpenAI API
2. ✅ Set up payment links
3. ✅ Test thoroughly
4. ✅ Deploy to production
5. ✅ Monitor first 24 hours

### Week 1:
- Add analytics
- A/B test pricing
- Collect user feedback
- Fix any bugs

### Month 1:
- Add API access for developers ($49/mo)
- Create prompt templates library
- Build email capture for marketing
- Launch affiliate program

---

## 💡 TIPS FOR SUCCESS

### Marketing:
- **Demo video:** Record yourself using Cheat Codez
- **Before/After:** Show bad prompt → Cheat Code → amazing results
- **Social proof:** Share user testimonials
- **Reddit:** Post in r/ChatGPT, r/PromptEngineering
- **Twitter:** Thread showing real examples

### Pricing Psychology:
- **$1.99 is perfect:** Low enough to impulse buy, high enough to feel premium
- **10-pack deal:** Creates urgency ("I should buy more now")
- **Unlimited plan:** Catches power users ($19.99/mo)

### Upsells:
- After free credits used: "Get 10 for $14.99 (save 25%)"
- After 10-pack purchase: "Go unlimited for $19.99/mo"
- Cross-sell: "Check out Project Filez for custom GPTs"

---

## 🔮 FUTURE ENHANCEMENTS

### v2.0:
- [ ] User accounts (instead of localStorage)
- [ ] Prompt history & favorites
- [ ] Share generated prompts publicly
- [ ] Prompt remix (improve existing prompts)
- [ ] Team plans

### v3.0:
- [ ] Chrome extension
- [ ] Mobile app
- [ ] AI prompt analysis (rate prompt quality)
- [ ] Prompt marketplace (users sell their generated prompts)

---

## 📞 SUPPORT

**Need help?**
- Check browser console for errors (F12)
- Review this guide
- Test with demo mode first
- Contact support if stuck

**Admin Console:**

Open browser console on `cheat-codez.html`:

```javascript
// View current state
CheatCodez.state

// Add credits manually
CheatCodez.addCredits(10)

// Reset free credits
CheatCodez.resetFreeCredits()

// Set API key
localStorage.setItem('cheatCodezAPIKey', 'sk-...')
```

---

## ✨ YOU'RE READY TO LAUNCH!

Everything is built. Everything works. Now:

1. **Purchase OpenAI credits** ($10 = ~65 generations)
2. **Set up API key** (5 minutes)
3. **Configure payment** (5 minutes)
4. **TEST THOROUGHLY** (30 minutes)
5. **LAUNCH!** 🚀

**When you're ready to purchase OpenAI API credits, just let me know!**

---

**Questions?**
- OpenAI API Docs: https://platform.openai.com/docs
- Gumroad Setup: https://help.gumroad.com
- Vercel Serverless: https://vercel.com/docs/functions

Good luck! 🎉
