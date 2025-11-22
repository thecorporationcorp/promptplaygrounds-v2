/**
 * CHEAT CODEZ - AI-POWERED PROMPT GENERATOR
 * Proprietary prompt optimization engine
 */

const CheatCodez = {
  // Configuration
  config: {
    freeCredits: 3,
    pricePerGeneration: 1.99,
    maxInputLength: 3000,
    apiEndpoint: '/api/generate-prompt', // Will be replaced with actual OpenAI endpoint
    gumroadLink: 'https://gumroad.com/l/cheatcodez' // Update with actual Gumroad product link
  },

  // State
  state: {
    creditsRemaining: 3,
    currentOutputStyle: 'optimized',
    generationHistory: [],
    lastGenerated: null
  },

  /**
   * Initialize Cheat Codez
   */
  init() {
    this.loadState();
    this.updateCreditsDisplay();
    console.log('⚡ Cheat Codez initialized');
  },

  /**
   * Load state from localStorage
   */
  loadState() {
    const saved = localStorage.getItem('cheatCodezState');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.state.creditsRemaining = data.creditsRemaining ?? this.config.freeCredits;
        this.state.generationHistory = data.generationHistory || [];
      } catch (e) {
        console.error('Failed to load state:', e);
      }
    }
  },

  /**
   * Save state to localStorage
   */
  saveState() {
    try {
      localStorage.setItem('cheatCodezState', JSON.stringify({
        creditsRemaining: this.state.creditsRemaining,
        generationHistory: this.state.generationHistory.slice(-20), // Keep last 20
        lastUpdated: new Date().toISOString()
      }));
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  },

  /**
   * Update credits display
   */
  updateCreditsDisplay() {
    const countEl = document.getElementById('creditsCount');
    const messageEl = document.getElementById('creditsMessage');

    if (this.state.creditsRemaining > 0) {
      countEl.textContent = this.state.creditsRemaining;
      messageEl.textContent = `Try it free! Then $${this.config.pricePerGeneration} per generation`;
      document.getElementById('paymentPrompt').style.display = 'none';
    } else {
      countEl.textContent = '0';
      messageEl.textContent = 'Free credits used - $1.99 per generation';
    }
  },

  /**
   * Select output style
   */
  selectOutputStyle(style) {
    this.state.currentOutputStyle = style;

    // Update UI
    document.querySelectorAll('.output-option').forEach(option => {
      if (option.dataset.style === style) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });

    console.log(`Output style selected: ${style}`);
  },

  /**
   * Generate Cheat Code (main function)
   */
  async generateCheatCode() {
    const input = document.getElementById('userInput').value.trim();

    // Validation
    if (!input) {
      alert('⚠️ Please enter what you need help with');
      return;
    }

    if (input.length < 10) {
      alert('⚠️ Please provide more details (at least 10 characters)');
      return;
    }

    // Check credits
    if (this.state.creditsRemaining <= 0) {
      document.getElementById('paymentPrompt').style.display = 'block';
      document.getElementById('paymentPrompt').scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // Show loading state
    this.setLoadingState(true);

    try {
      // Generate prompt based on output style
      const generatedPrompt = await this.callAI(input, this.state.currentOutputStyle);

      // Success!
      this.state.creditsRemaining--;
      this.state.lastGenerated = generatedPrompt;
      this.state.generationHistory.push({
        input,
        output: generatedPrompt,
        style: this.state.currentOutputStyle,
        timestamp: new Date().toISOString()
      });

      this.saveState();
      this.updateCreditsDisplay();
      this.displayResult(generatedPrompt);

      // Track analytics (placeholder)
      this.trackGeneration(input, this.state.currentOutputStyle);

    } catch (error) {
      console.error('Generation failed:', error);
      alert('⚠️ Generation failed. Please try again. If the problem persists, contact support.');
    } finally {
      this.setLoadingState(false);
    }
  },

  /**
   * Call AI API (OpenAI integration)
   * NOTE: In production, this should call your backend API
   * which securely calls OpenAI with your API key
   */
  async callAI(userInput, outputStyle) {
    // Try backend API first (secure), fallback to demo mode
    const backendEndpoint = this.getBackendEndpoint();

    try {
      // Call secure backend API
      const response = await fetch(backendEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userInput,
          outputStyle
        })
      });

      // Check for rate limiting
      if (response.status === 429) {
        const data = await response.json();
        const retryAfter = data.retryAfter || 60;
        throw new Error(`Rate limit exceeded. Please try again in ${retryAfter} seconds.`);
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.result) {
        throw new Error('Invalid response from API');
      }

      return data.result;

    } catch (error) {
      console.error('Backend API error:', error);
      // Fallback to demo mode if backend is not available
      console.warn('Falling back to demo mode');
      return this.generateDemoPrompt(userInput, outputStyle);
    }
  },

  /**
   * Get backend API endpoint
   */
  getBackendEndpoint() {
    // Auto-detect based on current domain
    const currentDomain = window.location.origin;
    return `${currentDomain}/api/cheat-codez`;
  },

  /**
   * Get API key from localStorage (set by admin)
   * DEPRECATED: Use backend API instead
   * In production, API calls should go through your backend
   */
  getAPIKey() {
    return localStorage.getItem('cheatCodezAPIKey');
  },

  /**
   * Get system prompt based on output style
   */
  getSystemPrompt(style) {
    const prompts = {
      optimized: `You are an expert prompt engineer. The user will describe what they want to accomplish with AI. Your job is to transform their request into a single, perfectly optimized prompt that will give them the best results.

Rules:
- Output ONLY the optimized prompt, nothing else
- Make it clear, specific, and actionable
- Include relevant context and constraints
- Use proven prompt engineering techniques
- Keep it under 500 words
- Don't explain what you're doing, just output the prompt`,

      template: `You are an expert prompt engineer. The user will describe what they want to accomplish with AI. Your job is to create a reusable TEMPLATE prompt with customizable variables.

Rules:
- Create a prompt template with [VARIABLES] in brackets
- Make variables clear and self-explanatory
- Include examples of what to fill in for each variable
- Structure: prompt text + variable guide
- Keep it flexible and reusable
- Output format:
  [TEMPLATE PROMPT HERE]

  Variables to customize:
  - [VARIABLE1]: explanation
  - [VARIABLE2]: explanation`,

      workflow: `You are an expert prompt engineer. The user will describe what they want to accomplish with AI. Your job is to break their complex task into a MULTI-STEP WORKFLOW with individual prompts.

Rules:
- Break the task into 3-5 steps
- Each step should have its own optimized prompt
- Number each step clearly
- Explain what each step accomplishes
- Make steps sequential and logical
- Output format:
  STEP 1: [Description]
  Prompt: [optimized prompt]

  STEP 2: [Description]
  Prompt: [optimized prompt]

  ...etc`
    };

    return prompts[style] || prompts.optimized;
  },

  /**
   * Generate demo prompt (fallback when no API key)
   */
  generateDemoPrompt(userInput, outputStyle) {
    // Simulate API delay
    return new Promise((resolve) => {
      setTimeout(() => {
        let result = '';

        if (outputStyle === 'optimized') {
          result = `You are an expert assistant specializing in "${userInput}". Analyze the user's request thoroughly and provide detailed, actionable guidance that addresses their specific needs. Consider best practices, common pitfalls, and proven strategies in this domain. Structure your response clearly with specific steps, examples, and recommendations. Focus on delivering practical value that the user can implement immediately.`;
        }
        else if (outputStyle === 'template') {
          result = `You are an expert [DOMAIN] specialist. Help the user with [TASK] by:

1. Understanding their specific context: [CONTEXT]
2. Analyzing their requirements: [REQUIREMENTS]
3. Providing tailored recommendations: [RECOMMENDATIONS]

Consider [CONSTRAINTS] and focus on [DESIRED_OUTCOME].

Variables to customize:
- [DOMAIN]: The subject area (e.g., "email marketing", "data analysis")
- [TASK]: What they're trying to accomplish
- [CONTEXT]: Their specific situation
- [REQUIREMENTS]: Must-haves and constraints
- [RECOMMENDATIONS]: Key suggestions
- [CONSTRAINTS]: Limitations to work within
- [DESIRED_OUTCOME]: End goal

Example: If helping with email marketing, [DOMAIN]="email marketing", [TASK]="increase open rates"`;
        }
        else if (outputStyle === 'workflow') {
          result = `WORKFLOW FOR: ${userInput}

STEP 1: Understanding & Analysis
Prompt: "Analyze the following requirements and provide a detailed breakdown of what needs to be accomplished. Identify key objectives, constraints, and success criteria."

STEP 2: Strategy Development
Prompt: "Based on the analysis, develop a comprehensive strategy. Include specific tactics, recommended approaches, and rationale for each recommendation."

STEP 3: Implementation Planning
Prompt: "Create a detailed action plan with concrete steps. Prioritize tasks, identify dependencies, and provide timeline estimates."

STEP 4: Execution & Optimization
Prompt: "Execute the plan step by step. For each completed step, analyze results and suggest optimizations for the remaining steps."

STEP 5: Review & Refinement
Prompt: "Review the overall results against initial objectives. Identify what worked well, what could be improved, and recommend next steps for continuous improvement."`;
        }

        resolve(result);
      }, 2000); // 2 second delay to simulate API call
    });
  },

  /**
   * Set loading state
   */
  setLoadingState(loading) {
    const btn = document.getElementById('generateBtn');
    const btnText = document.getElementById('btnText');
    const btnLoading = document.getElementById('btnLoading');

    if (loading) {
      btn.disabled = true;
      btnText.style.display = 'none';
      btnLoading.style.display = 'inline-block';
    } else {
      btn.disabled = false;
      btnText.style.display = 'inline-block';
      btnLoading.style.display = 'none';
    }
  },

  /**
   * Display result
   */
  displayResult(prompt) {
    const resultBox = document.getElementById('resultBox');
    const generatedPrompt = document.getElementById('generatedPrompt');

    generatedPrompt.textContent = prompt;
    resultBox.classList.add('show');
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  /**
   * Copy to clipboard
   */
  copyToClipboard() {
    const prompt = document.getElementById('generatedPrompt').textContent;

    navigator.clipboard.writeText(prompt).then(() => {
      // Show success feedback
      const btn = event.target;
      const originalText = btn.textContent;
      btn.textContent = '✓ COPIED!';
      btn.style.background = '#00ff00';
      btn.style.color = '#000000';

      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        btn.style.color = '';
      }, 2000);

      console.log('Prompt copied to clipboard');
    }).catch(err => {
      console.error('Copy failed:', err);
      // Fallback: select text
      const range = document.createRange();
      range.selectNode(document.getElementById('generatedPrompt'));
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
      alert('Prompt selected - press Ctrl+C (or Cmd+C) to copy');
    });
  },

  /**
   * Save as bookmarklet
   */
  saveAsBookmarklet() {
    const prompt = document.getElementById('generatedPrompt').textContent;

    // Generate bookmarklet code
    const bookmarkletCode = `javascript:(function(){const prompt='${prompt.replace(/'/g, "\\'")}';const textarea=document.querySelector('textarea')||document.querySelector('[contenteditable="true"]');if(textarea){if(textarea.tagName==='TEXTAREA'){textarea.value=prompt;textarea.dispatchEvent(new Event('input',{bubbles:true}))}else{textarea.textContent=prompt;textarea.dispatchEvent(new Event('input',{bubbles:true}))}}else{alert('No input found. Make sure you\\'re on ChatGPT or Claude.')}})();`;

    // Create download link
    const title = prompt.substring(0, 50).replace(/[^a-zA-Z0-9 ]/g, '') || 'Custom Prompt';
    const html = `
<!DOCTYPE html>
<html>
<head><title>Bookmarklet Installer</title></head>
<body style="font-family: monospace; padding: 2rem; background: #000; color: #0f0;">
  <h1>📌 Your Custom Cheat Code Bookmarklet</h1>
  <p>Drag the link below to your bookmarks bar:</p>
  <p><a href="${bookmarkletCode}" style="display: inline-block; padding: 1rem 2rem; background: #0f0; color: #000; text-decoration: none; font-weight: bold; margin: 2rem 0;">⚡ ${title}</a></p>
  <p style="color: #0c0;">Usage: Click this bookmark when on ChatGPT or Claude to auto-load your custom prompt!</p>
</body>
</html>`;

    // Open in new window
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
  },

  /**
   * Share cheat code
   */
  shareCheatCode() {
    const prompt = document.getElementById('generatedPrompt').textContent;
    const text = `Check out this AI prompt I generated with Cheat Codez!\n\n${prompt.substring(0, 200)}...\n\nGenerate your own at promptplaygroundz.com`;

    if (navigator.share) {
      navigator.share({
        title: 'My Cheat Code',
        text: text
      }).catch(err => console.log('Share cancelled'));
    } else {
      // Fallback: copy share text
      navigator.clipboard.writeText(text).then(() => {
        alert('✓ Share text copied to clipboard!');
      });
    }
  },

  /**
   * Generate another
   */
  generateAnother() {
    document.getElementById('userInput').value = '';
    document.getElementById('charCount').textContent = '0';
    document.getElementById('resultBox').classList.remove('show');
    document.getElementById('userInput').focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  /**
   * Track generation (analytics placeholder)
   */
  trackGeneration(input, style) {
    // In production, send to analytics
    console.log('Generation tracked:', {
      style,
      inputLength: input.length,
      creditsRemaining: this.state.creditsRemaining,
      timestamp: new Date().toISOString()
    });

    // Could integrate with Google Analytics:
    // gtag('event', 'generate_cheat_code', {
    //   'output_style': style,
    //   'credits_remaining': this.state.creditsRemaining
    // });
  },

  /**
   * Admin: Add credits (for purchased generations)
   */
  addCredits(amount) {
    this.state.creditsRemaining += amount;
    this.saveState();
    this.updateCreditsDisplay();
    console.log(`Added ${amount} credits. New balance: ${this.state.creditsRemaining}`);
  },

  /**
   * Admin: Reset free credits
   */
  resetFreeCredits() {
    this.state.creditsRemaining = this.config.freeCredits;
    this.saveState();
    this.updateCreditsDisplay();
    console.log('Free credits reset');
  }
};

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => CheatCodez.init());
} else {
  CheatCodez.init();
}

// Make globally available
window.CheatCodez = CheatCodez;

// Admin console helper
console.log(`
⚡ CHEAT CODEZ ADMIN CONSOLE ⚡

Available commands:
- CheatCodez.addCredits(10)      // Add credits
- CheatCodez.resetFreeCredits()  // Reset to 3 free
- CheatCodez.state               // View current state

To set OpenAI API key (for production):
localStorage.setItem('cheatCodezAPIKey', 'sk-...')
`);
