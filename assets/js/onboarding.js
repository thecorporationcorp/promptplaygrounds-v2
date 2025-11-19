/**
 * FRICTIONLESS ONBOARDING SYSTEM
 * Baby-simple user experience with interactive tutorials
 * Zero friction, maximum hand-holding
 */

const Onboarding = {
  // Configuration
  config: {
    steps: [
      { id: 'welcome', required: true },
      { id: 'access_code', required: true },
      { id: 'bookmark_bar', required: true },
      { id: 'first_install', required: true },
      { id: 'first_use', required: true },
      { id: 'complete', required: false }
    ],
    autoAdvance: true,
    showProgress: true,
    saveProgress: true
  },

  // State
  state: {
    currentStep: 0,
    completed: [],
    skipped: [],
    startedAt: null,
    completedAt: null
  },

  /**
   * Initialize onboarding
   */
  init() {
    // Load saved progress
    this.loadProgress();

    // Check if user needs onboarding
    if (this.needsOnboarding()) {
      this.start();
    }
  },

  /**
   * Check if user needs onboarding
   */
  needsOnboarding() {
    const onboardingComplete = localStorage.getItem('onboardingComplete');
    const hasAccess = AuthSystem && AuthSystem.hasAccess();

    // Show onboarding if:
    // 1. Never completed before
    // 2. Has access but hasn't completed setup
    return !onboardingComplete || (hasAccess && !this.hasBookmarksInstalled());
  },

  /**
   * Check if user has installed bookmarklets
   */
  hasBookmarksInstalled() {
    const setupComplete = localStorage.getItem('bookmarksSetupComplete');
    return setupComplete === 'true';
  },

  /**
   * Start onboarding
   */
  start() {
    this.state.startedAt = new Date().toISOString();
    this.state.currentStep = 0;

    this.showStep(this.config.steps[0].id);
    this.saveProgress();
  },

  /**
   * Show specific onboarding step
   */
  showStep(stepId) {
    const step = this.config.steps.find(s => s.id === stepId);
    if (!step) return;

    // Hide all existing tours
    this.hideAllTours();

    // Show the requested step
    switch(stepId) {
      case 'welcome':
        this.showWelcomeTour();
        break;
      case 'access_code':
        this.showAccessCodeTour();
        break;
      case 'bookmark_bar':
        this.showBookmarkBarTour();
        break;
      case 'first_install':
        this.showFirstInstallTour();
        break;
      case 'first_use':
        this.showFirstUseTour();
        break;
      case 'complete':
        this.showCompleteTour();
        break;
    }

    this.saveProgress();
  },

  /**
   * STEP 1: Welcome Tour
   */
  showWelcomeTour() {
    this.createTour({
      id: 'welcomeTour',
      title: '👋 Welcome to Prompt Playgrounds!',
      content: `
        <div style="text-align: center;">
          <div style="font-size: 4rem; margin-bottom: 1rem;">🎉</div>
          <h2 style="margin: 0 0 1rem;">You're About to Get Superpowers!</h2>
          <p style="font-size: 1.125rem; margin-bottom: 2rem; line-height: 1.6;">
            Install our AI prompts as one-click bookmarks.<br>
            No copying, no pasting - just <strong>instant prompt loading</strong>.
          </p>

          <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(236, 72, 153, 0.1)); padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem;">
            <h3 style="margin: 0 0 0.5rem;">✨ What You Get:</h3>
            <ul style="text-align: left; margin: 0.5rem 0; padding-left: 1.5rem;">
              <li>📌 20+ professional AI prompts</li>
              <li>⚡ One-click installation (takes 2 minutes)</li>
              <li>🚀 Works on ChatGPT, Claude, Gemini, and more</li>
              <li>🆓 Free updates forever</li>
            </ul>
          </div>

          <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 2rem;">
            <button onclick="Onboarding.nextStep()" class="btn btn-primary btn-lg">
              Let's Get Started! 🚀
            </button>
            <button onclick="Onboarding.skip()" class="btn btn-outline">
              Skip Tour
            </button>
          </div>

          <p style="margin-top: 1.5rem; font-size: 0.875rem; color: #9ca3af;">
            This will take about 2 minutes • Step 1 of 5
          </p>
        </div>
      `,
      position: 'center',
      dismissible: true
    });
  },

  /**
   * STEP 2: Access Code Tour
   */
  showAccessCodeTour() {
    // Check if already has access
    if (AuthSystem && AuthSystem.hasAccess()) {
      this.completeStep('access_code');
      this.nextStep();
      return;
    }

    this.createTour({
      id: 'accessCodeTour',
      title: '🔑 Enter Your Access Code',
      content: `
        <div style="text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🔐</div>
          <h2 style="margin: 0 0 0.5rem;">Almost There!</h2>
          <p style="margin-bottom: 2rem; line-height: 1.6;">
            Enter the access code from your welcome email.<br>
            <span style="font-size: 0.875rem; color: #9ca3af;">(Check your inbox - it should have arrived within 2 minutes)</span>
          </p>

          <div style="max-width: 400px; margin: 0 auto 1.5rem;">
            <label style="display: block; text-align: left; margin-bottom: 0.5rem; font-weight: 600;">
              Access Code:
            </label>
            <input
              type="text"
              id="onboardingAccessCode"
              class="form-input"
              placeholder="XXXX-XXXX-XXXX"
              style="font-size: 1.25rem; text-align: center; letter-spacing: 0.1em; font-family: monospace;"
              onkeyup="Onboarding.formatAccessCode(this)"
            />
            <div id="accessCodeError" style="color: #ef4444; margin-top: 0.5rem; font-size: 0.875rem; display: none;"></div>
          </div>

          <button onclick="Onboarding.validateAccessCode()" class="btn btn-primary btn-lg">
            Unlock Library 🚀
          </button>

          <div style="background: rgba(59, 130, 246, 0.1); border-left: 3px solid #3b82f6; padding: 1rem; border-radius: 0 8px 8px 0; margin-top: 2rem; text-align: left;">
            <p style="margin: 0; font-size: 0.875rem;">
              <strong>💌 Don't have a code yet?</strong><br>
              Purchase access for just $0.99 on our <a href="index.html" style="color: #60a5fa;">homepage</a>.
              You'll receive your code via email instantly!
            </p>
          </div>
        </div>
      `,
      position: 'center',
      dismissible: false
    });

    // Auto-focus the input
    setTimeout(() => {
      const input = document.getElementById('onboardingAccessCode');
      if (input) input.focus();
    }, 100);
  },

  /**
   * Format access code input
   */
  formatAccessCode(input) {
    let value = input.value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    let formatted = '';

    for (let i = 0; i < value.length && i < 12; i++) {
      if (i > 0 && i % 4 === 0) formatted += '-';
      formatted += value[i];
    }

    input.value = formatted;
  },

  /**
   * Validate access code
   */
  validateAccessCode() {
    const input = document.getElementById('onboardingAccessCode');
    const errorDiv = document.getElementById('accessCodeError');
    const code = input.value.replace(/-/g, '');

    if (!code) {
      errorDiv.textContent = 'Please enter your access code';
      errorDiv.style.display = 'block';
      return;
    }

    // Validate code format before processing
    if (typeof SecurityUtils !== 'undefined' && !SecurityUtils.validateAccessCode(code)) {
      errorDiv.textContent = '❌ Invalid code format. Should be XXXX-XXXX-XXXX';
      errorDiv.style.display = 'block';
      input.style.borderColor = '#ef4444';

      setTimeout(() => {
        input.style.borderColor = '';
      }, 2000);
      return;
    }

    if (AuthSystem && AuthSystem.grantAccess(code)) {
      errorDiv.style.display = 'none';
      this.showSuccessAnimation(() => {
        this.completeStep('access_code');
        this.nextStep();
      });
    } else {
      errorDiv.textContent = '❌ Invalid code. Please check your email and try again.';
      errorDiv.style.display = 'block';
      input.style.borderColor = '#ef4444';

      setTimeout(() => {
        input.style.borderColor = '';
      }, 2000);
    }
  },

  /**
   * STEP 3: Bookmark Bar Tour
   */
  showBookmarkBarTour() {
    const isBookmarkBarVisible = this.detectBookmarkBar();

    this.createTour({
      id: 'bookmarkBarTour',
      title: '📊 Show Your Bookmarks Bar',
      content: `
        <div style="text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">📊</div>
          <h2 style="margin: 0 0 0.5rem;">${isBookmarkBarVisible ? 'Perfect! Your Bookmark Bar is Visible' : 'Let\'s Show Your Bookmark Bar'}</h2>
          <p style="margin-bottom: 2rem; line-height: 1.6;">
            ${isBookmarkBarVisible
              ? 'We can see your bookmark bar. You\'re all set for the next step!'
              : 'This is where your AI prompts will live - just one click away!'
            }
          </p>

          ${!isBookmarkBarVisible ? `
            <div style="background: #1e293b; border-radius: 12px; padding: 2rem; margin-bottom: 2rem;">
              <h3 style="margin: 0 0 1rem;">Press This Keyboard Shortcut:</h3>

              <div style="display: flex; gap: 1rem; justify-content: center; margin-bottom: 1.5rem;">
                <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 1.5rem; border-radius: 8px; flex: 1; max-width: 200px;">
                  <div style="font-size: 0.875rem; margin-bottom: 0.5rem; opacity: 0.9;">Windows/Linux:</div>
                  <div style="font-size: 1.5rem; font-weight: 700; font-family: monospace;">Ctrl + Shift + B</div>
                </div>
                <div style="background: linear-gradient(135deg, #764ba2, #667eea); padding: 1.5rem; border-radius: 8px; flex: 1; max-width: 200px;">
                  <div style="font-size: 0.875rem; margin-bottom: 0.5rem; opacity: 0.9;">Mac:</div>
                  <div style="font-size: 1.5rem; font-weight: 700; font-family: monospace;">⌘ + Shift + B</div>
                </div>
              </div>

              <p style="margin: 0; font-size: 0.875rem; color: #cbd5e1;">
                This toggles your bookmark bar on/off. You should see a bar appear below your address bar.
              </p>
            </div>
          ` : ''}

          <div style="display: flex; gap: 1rem; justify-content: center;">
            <button onclick="Onboarding.completeStep('bookmark_bar'); Onboarding.nextStep();" class="btn btn-primary btn-lg">
              ${isBookmarkBarVisible ? 'Next Step →' : 'I Can See It Now!'}
            </button>
            ${!isBookmarkBarVisible ? `
              <button onclick="Onboarding.showBookmarkBarHelp()" class="btn btn-outline">
                Need Help?
              </button>
            ` : ''}
          </div>

          <p style="margin-top: 1.5rem; font-size: 0.875rem; color: #9ca3af;">
            Step 3 of 5
          </p>
        </div>
      `,
      position: 'center',
      dismissible: true
    });
  },

  /**
   * Detect if bookmark bar is visible (heuristic)
   */
  detectBookmarkBar() {
    // This is a heuristic - we can't actually detect the bookmark bar
    // But we can check if they've done this before
    return localStorage.getItem('bookmarkBarShown') === 'true';
  },

  /**
   * Show bookmark bar help
   */
  showBookmarkBarHelp() {
    alert('Need help showing your bookmark bar?\n\n1. Look at the top of your browser window\n2. Find your address bar (where you type URLs)\n3. Press Ctrl+Shift+B (or ⌘+Shift+B on Mac)\n4. You should see a bar appear right below your address bar\n\nStill stuck? Click "Skip Tour" and we\'ll help you later!');
  },

  /**
   * STEP 4: First Install Tour
   */
  showFirstInstallTour() {
    this.createTour({
      id: 'firstInstallTour',
      title: '⚡ One-Click Installation',
      content: `
        <div style="text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">⚡</div>
          <h2 style="margin: 0 0 0.5rem;">Time to Install Your Prompts!</h2>
          <p style="margin-bottom: 2rem; line-height: 1.6;">
            We have <strong>two easy ways</strong> to install your bookmarklets.<br>
            Choose whichever you prefer:
          </p>

          <div style="display: grid; gap: 1rem; margin-bottom: 2rem;">
            <!-- Option 1: One-Click Import -->
            <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(236, 72, 153, 0.1)); border: 2px solid #6366f1; border-radius: 12px; padding: 1.5rem; text-align: left;">
              <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                <span style="font-size: 2rem;">⚡</span>
                <h3 style="margin: 0;">Option 1: One-Click Import (Recommended)</h3>
              </div>
              <p style="margin: 0 0 1rem; color: #9ca3af;">
                Download a file and import all 20+ bookmarklets at once. Takes ~2 minutes.
              </p>
              <button onclick="Onboarding.goToSetupPage()" class="btn btn-primary">
                Use One-Click Import →
              </button>
            </div>

            <!-- Option 2: Manual Drag & Drop -->
            <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid #374151; border-radius: 12px; padding: 1.5rem; text-align: left;">
              <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                <span style="font-size: 2rem;">🎯</span>
                <h3 style="margin: 0;">Option 2: Browse & Add As Needed</h3>
              </div>
              <p style="margin: 0 0 1rem; color: #9ca3af;">
                Browse prompts and drag them to your bookmark bar one by one.
              </p>
              <button onclick="Onboarding.goToHub()" class="btn btn-outline">
                Browse Library →
              </button>
            </div>
          </div>

          <div style="background: rgba(59, 130, 246, 0.1); border-left: 3px solid #3b82f6; padding: 1rem; border-radius: 0 8px 8px 0; text-align: left;">
            <p style="margin: 0; font-size: 0.875rem;">
              <strong>💡 Pro Tip:</strong> We recommend the one-click import! It's faster and organizes everything into folders automatically.
            </p>
          </div>

          <p style="margin-top: 1.5rem; font-size: 0.875rem; color: #9ca3af;">
            Step 4 of 5
          </p>
        </div>
      `,
      position: 'center',
      dismissible: true
    });
  },

  /**
   * Go to setup page
   */
  goToSetupPage() {
    localStorage.setItem('bookmarkBarShown', 'true');
    this.completeStep('first_install');
    window.location.href = 'setup-bookmarks.html';
  },

  /**
   * Go to hub
   */
  goToHub() {
    localStorage.setItem('bookmarkBarShown', 'true');
    this.completeStep('first_install');
    this.skip(); // Skip rest of tour
    window.location.href = 'hub.html';
  },

  /**
   * STEP 5: First Use Tour
   */
  showFirstUseTour() {
    this.createTour({
      id: 'firstUseTour',
      title: '🚀 How to Use Your Bookmarklets',
      content: `
        <div style="text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🚀</div>
          <h2 style="margin: 0 0 0.5rem;">You're Almost a Pro!</h2>
          <p style="margin-bottom: 2rem; line-height: 1.6;">
            Here's how to use your new AI prompt bookmarklets:
          </p>

          <div style="text-align: left; max-width: 500px; margin: 0 auto 2rem;">
            <div style="background: #1e293b; border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem;">
              <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                <div style="background: #6366f1; width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700;">1</div>
                <h3 style="margin: 0;">Open Your AI Chat</h3>
              </div>
              <p style="margin: 0.5rem 0 0 3rem; color: #9ca3af;">
                Go to ChatGPT, Claude, Gemini, or any AI chat platform
              </p>
            </div>

            <div style="background: #1e293b; border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem;">
              <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                <div style="background: #6366f1; width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700;">2</div>
                <h3 style="margin: 0;">Click Any Bookmarklet</h3>
              </div>
              <p style="margin: 0.5rem 0 0 3rem; color: #9ca3af;">
                Find a prompt in your bookmarks bar and click it once
              </p>
            </div>

            <div style="background: #1e293b; border-radius: 8px; padding: 1.5rem;">
              <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                <div style="background: #10b981; width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700;">✓</div>
                <h3 style="margin: 0;">Prompt Auto-Loads!</h3>
              </div>
              <p style="margin: 0.5rem 0 0 3rem; color: #9ca3af;">
                The prompt appears instantly in the chat box. Just hit send!
              </p>
            </div>
          </div>

          <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.2)); border: 2px dashed #10b981; padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem;">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">⚡</div>
            <p style="margin: 0; font-size: 1.125rem; font-weight: 600;">
              That's it! No copying, no pasting - just one click!
            </p>
          </div>

          <button onclick="Onboarding.completeOnboarding()" class="btn btn-primary btn-lg">
            I'm Ready! Let's Go! 🎉
          </button>

          <p style="margin-top: 1.5rem; font-size: 0.875rem; color: #9ca3af;">
            Step 5 of 5 • Almost done!
          </p>
        </div>
      `,
      position: 'center',
      dismissible: true
    });
  },

  /**
   * STEP 6: Complete Tour
   */
  showCompleteTour() {
    this.createTour({
      id: 'completeTour',
      title: '🎉 You\'re All Set!',
      content: `
        <div style="text-align: center;">
          <div style="font-size: 5rem; margin-bottom: 1rem;">🎊</div>
          <h1 style="margin: 0 0 0.5rem; font-size: 2.5rem;">Congratulations!</h1>
          <p style="margin-bottom: 2rem; font-size: 1.125rem; line-height: 1.6;">
            You're now a <strong>Prompt Playgrounds Pro</strong>!<br>
            Your AI prompts are ready to use.
          </p>

          <div style="background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 12px; padding: 2rem; margin-bottom: 2rem; color: white;">
            <h2 style="margin: 0 0 1rem;">🚀 What's Next?</h2>
            <div style="display: grid; gap: 1rem; text-align: left;">
              <div style="background: rgba(255, 255, 255, 0.1); padding: 1rem; border-radius: 8px;">
                <strong>1. Try Your First Prompt</strong><br>
                <span style="opacity: 0.9;">Open ChatGPT and click any bookmarklet!</span>
              </div>
              <div style="background: rgba(255, 255, 255, 0.1); padding: 1rem; border-radius: 8px;">
                <strong>2. Explore Premium</strong><br>
                <span style="opacity: 0.9;">Check out Project Filez for advanced prompt systems</span>
              </div>
              <div style="background: rgba(255, 255, 255, 0.1); padding: 1rem; border-radius: 8px;">
                <strong>3. Share with Friends</strong><br>
                <span style="opacity: 0.9;">Know someone who'd love this? Send them our way!</span>
              </div>
            </div>
          </div>

          <div style="display: flex; gap: 1rem; justify-content: center; margin-bottom: 1.5rem;">
            <button onclick="window.location.href='hub.html'" class="btn btn-primary btn-lg">
              Browse Library →
            </button>
            <button onclick="window.location.href='project-filez.html'" class="btn btn-outline">
              View Premium Filez
            </button>
          </div>

          <p style="margin: 0; font-size: 0.875rem; color: #9ca3af;">
            Need help? Check our <a href="how-it-works.html" style="color: #60a5fa;">documentation</a> anytime!
          </p>
        </div>
      `,
      position: 'center',
      dismissible: true
    });
  },

  /**
   * Create tour overlay
   * SECURITY NOTE: options.content is injected via innerHTML.
   * Currently all content is static, but if dynamic/user-generated content
   * is added in the future, it MUST be sanitized with SecurityUtils.escapeHtml()
   */
  createTour(options) {
    // Remove existing tour
    const existing = document.getElementById(options.id);
    if (existing) existing.remove();

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = options.id;
    overlay.className = 'onboarding-tour';

    const dismissHandler = options.dismissible
      ? 'onclick="if(event.target === this) Onboarding.skip()"'
      : '';

    // SECURITY: All content is currently static HTML from code
    // If user input is ever added to content, sanitize it first!
    overlay.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.9); z-index: 999999; display: flex; align-items: center; justify-content: center; padding: 1rem; animation: fadeIn 0.3s;" ${dismissHandler}>
        <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: white; border-radius: 20px; max-width: 700px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); animation: slideUp 0.4s;">
          <div style="padding: 2.5rem;">
            ${options.content}
          </div>
        </div>
      </div>

      <style>
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      </style>
    `;

    document.body.appendChild(overlay);
  },

  /**
   * Hide all tours
   */
  hideAllTours() {
    document.querySelectorAll('.onboarding-tour').forEach(tour => tour.remove());
  },

  /**
   * Next step
   */
  nextStep() {
    this.state.currentStep++;

    if (this.state.currentStep >= this.config.steps.length) {
      this.completeOnboarding();
      return;
    }

    const nextStep = this.config.steps[this.state.currentStep];
    this.showStep(nextStep.id);
  },

  /**
   * Complete step
   */
  completeStep(stepId) {
    if (!this.state.completed.includes(stepId)) {
      this.state.completed.push(stepId);
      this.saveProgress();
    }
  },

  /**
   * Skip onboarding
   */
  skip() {
    if (confirm('Skip the tour? You can always restart it from the Help menu.')) {
      this.hideAllTours();
      localStorage.setItem('onboardingSkipped', 'true');
    }
  },

  /**
   * Complete onboarding
   */
  completeOnboarding() {
    this.state.completedAt = new Date().toISOString();
    this.state.currentStep = this.config.steps.length;

    localStorage.setItem('onboardingComplete', 'true');
    this.saveProgress();

    // Show confetti or celebration
    this.showSuccessAnimation(() => {
      this.showStep('complete');
    });
  },

  /**
   * Show success animation
   */
  showSuccessAnimation(callback) {
    const animation = document.createElement('div');
    animation.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999999; pointer-events: none; display: flex; align-items: center; justify-content: center;">
        <div style="font-size: 10rem; animation: successPop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);">
          ✅
        </div>
      </div>
      <style>
        @keyframes successPop {
          0% { transform: scale(0) rotate(-180deg); opacity: 0; }
          50% { transform: scale(1.2) rotate(10deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
      </style>
    `;

    document.body.appendChild(animation);

    setTimeout(() => {
      animation.remove();
      if (callback) callback();
    }, 600);
  },

  /**
   * Save progress to localStorage
   */
  saveProgress() {
    if (!this.config.saveProgress) return;

    localStorage.setItem('onboardingState', JSON.stringify(this.state));
  },

  /**
   * Load progress from localStorage
   */
  loadProgress() {
    const saved = localStorage.getItem('onboardingState');
    if (saved) {
      try {
        this.state = { ...this.state, ...JSON.parse(saved) };
      } catch (err) {
        console.error('Failed to load onboarding progress:', err);
      }
    }
  },

  /**
   * Reset onboarding
   */
  reset() {
    this.state = {
      currentStep: 0,
      completed: [],
      skipped: [],
      startedAt: null,
      completedAt: null
    };

    localStorage.removeItem('onboardingState');
    localStorage.removeItem('onboardingComplete');
    localStorage.removeItem('onboardingSkipped');
    localStorage.removeItem('bookmarkBarShown');
    localStorage.removeItem('bookmarksSetupComplete');
  },

  /**
   * Restart onboarding
   */
  restart() {
    this.reset();
    this.start();
  }
};

// Make globally available
if (typeof window !== 'undefined') {
  window.Onboarding = Onboarding;

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Only auto-init on hub page
      if (window.location.pathname.includes('hub.html')) {
        Onboarding.init();
      }
    });
  } else {
    if (window.location.pathname.includes('hub.html')) {
      Onboarding.init();
    }
  }
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Onboarding;
}
