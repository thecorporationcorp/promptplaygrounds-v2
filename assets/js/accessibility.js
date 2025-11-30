/**
 * ACCESSIBILITY ENHANCEMENTS
 *
 * Improves WCAG 2.1 Level AA compliance:
 * - Skip to content links
 * - ARIA labels and roles
 * - Live regions for dynamic updates
 * - Keyboard navigation
 * - Focus management
 * - Screen reader announcements
 */

const AccessibilityEnhancements = {
  /**
   * Initialize all accessibility features
   */
  init() {
    console.log('🎯 Initializing accessibility enhancements...');

    // Add skip links
    this.addSkipLinks();

    // Enhance ARIA labels
    this.enhanceARIALabels();

    // Add live regions
    this.addLiveRegions();

    // Enhance keyboard navigation
    this.enhanceKeyboardNavigation();

    // Add focus management
    this.enhanceFocusManagement();

    // Enhance form accessibility
    this.enhanceFormsAccessibility();

    console.log('✅ Accessibility enhancements applied');
  },

  /**
   * Add skip to content link
   */
  addSkipLinks() {
    // Check if skip link already exists
    if (document.getElementById('skip-to-content')) {
      return;
    }

    // Create skip link
    const skipLink = document.createElement('a');
    skipLink.id = 'skip-to-content';
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to main content';
    skipLink.setAttribute('accesskey', '1'); // Alt+Shift+1 on most browsers

    // Style skip link (visible on focus)
    const style = document.createElement('style');
    style.textContent = `
      .skip-link {
        position: absolute;
        top: -100px;
        left: 0;
        background: var(--primary-color, #00ff41);
        color: var(--bg-primary, #000);
        padding: 1rem 2rem;
        text-decoration: none;
        font-weight: bold;
        z-index: 10000;
        border-radius: 0 0 0.5rem 0;
        transition: top 0.3s;
      }

      .skip-link:focus {
        top: 0;
        outline: 3px solid var(--primary-color, #00ff41);
        outline-offset: 2px;
      }
    `;
    document.head.appendChild(style);

    // Insert skip link as first element in body
    document.body.insertBefore(skipLink, document.body.firstChild);

    // Ensure main content has ID
    let mainContent = document.getElementById('main-content');
    if (!mainContent) {
      mainContent = document.querySelector('main') || document.querySelector('.container');
      if (mainContent) {
        mainContent.id = 'main-content';
        mainContent.setAttribute('tabindex', '-1'); // Allow programmatic focus
      }
    }

    // Handle skip link click
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (mainContent) {
        mainContent.focus();
        mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    console.log('✅ Skip link added');
  },

  /**
   * Enhance ARIA labels across the site
   */
  enhanceARIALabels() {
    // Navigation
    const nav = document.querySelector('nav');
    if (nav && !nav.getAttribute('role')) {
      nav.setAttribute('role', 'navigation');
      nav.setAttribute('aria-label', 'Main navigation');
    }

    // Search forms
    document.querySelectorAll('input[type="search"]').forEach(input => {
      if (!input.getAttribute('aria-label')) {
        input.setAttribute('aria-label', 'Search prompts');
      }
    });

    // Buttons without text (icon buttons)
    document.querySelectorAll('button:not([aria-label])').forEach(button => {
      if (!button.textContent.trim() || button.textContent.length < 2) {
        const title = button.getAttribute('title');
        if (title) {
          button.setAttribute('aria-label', title);
        }
      }
    });

    // Links that open in new window
    document.querySelectorAll('a[target="_blank"]').forEach(link => {
      const currentLabel = link.getAttribute('aria-label') || link.textContent;
      link.setAttribute('aria-label', `${currentLabel} (opens in new window)`);
    });

    // Cards/Products
    document.querySelectorAll('.prompt-card, .product-card').forEach((card, index) => {
      if (!card.getAttribute('role')) {
        card.setAttribute('role', 'article');
      }
      const heading = card.querySelector('h3, h4');
      if (heading && !card.getAttribute('aria-labelledby')) {
        if (!heading.id) {
          heading.id = `card-heading-${index}`;
        }
        card.setAttribute('aria-labelledby', heading.id);
      }
    });

    // Alert messages
    document.querySelectorAll('.alert-green, .alert-red, .alert-yellow').forEach(alert => {
      if (!alert.getAttribute('role')) {
        if (alert.classList.contains('alert-red')) {
          alert.setAttribute('role', 'alert');
        } else {
          alert.setAttribute('role', 'status');
        }
        alert.setAttribute('aria-live', 'polite');
      }
    });

    console.log('✅ ARIA labels enhanced');
  },

  /**
   * Add ARIA live regions for dynamic content
   */
  addLiveRegions() {
    // Check if live region already exists
    if (document.getElementById('aria-live-region')) {
      return;
    }

    // Create live region for announcements
    const liveRegion = document.createElement('div');
    liveRegion.id = 'aria-live-region';
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';

    // Add screen reader only styles
    const style = document.createElement('style');
    style.textContent = `
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(liveRegion);

    // Make announce function globally available
    window.announceToScreenReader = (message, priority = 'polite') => {
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.textContent = message;

      // Clear after 3 seconds
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 3000);
    };

    // Monitor dynamic content changes
    this.monitorDynamicContent();

    console.log('✅ Live regions added');
  },

  /**
   * Monitor dynamic content and announce to screen readers
   */
  monitorDynamicContent() {
    // Monitor prompt loading
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          // Announce new prompts loaded
          if (node.classList && node.classList.contains('prompt-card')) {
            window.announceToScreenReader?.('New prompt loaded');
          }

          // Announce errors
          if (node.classList && (node.classList.contains('alert-red') || node.classList.contains('error'))) {
            const message = node.textContent.trim();
            window.announceToScreenReader?.(message, 'assertive');
          }

          // Announce success messages
          if (node.classList && node.classList.contains('alert-green')) {
            const message = node.textContent.trim();
            window.announceToScreenReader?.(message);
          }
        });
      });
    });

    // Observe document body
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  },

  /**
   * Enhance keyboard navigation
   */
  enhanceKeyboardNavigation() {
    // Add keyboard navigation to cards
    document.querySelectorAll('.prompt-card, .product-card').forEach(card => {
      if (!card.hasAttribute('tabindex')) {
        card.setAttribute('tabindex', '0');
      }

      // Enter key to click
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const link = card.querySelector('a');
          if (link) {
            link.click();
          }
        }
      });
    });

    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Close any open modals
        document.querySelectorAll('[role="dialog"], .modal').forEach(modal => {
          if (modal.style.display !== 'none' && !modal.hidden) {
            modal.style.display = 'none';
            modal.hidden = true;

            // Return focus to trigger
            const triggerId = modal.getAttribute('data-trigger-id');
            if (triggerId) {
              const trigger = document.getElementById(triggerId);
              if (trigger) {
                trigger.focus();
              }
            }

            window.announceToScreenReader?.('Dialog closed');
          }
        });
      }
    });

    // Add keyboard shortcuts help
    this.addKeyboardShortcutsHelp();

    console.log('✅ Keyboard navigation enhanced');
  },

  /**
   * Add keyboard shortcuts help (optional)
   */
  addKeyboardShortcutsHelp() {
    // Show help when user presses ? or Shift+/
    document.addEventListener('keydown', (e) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        const activeElement = document.activeElement;
        const isInputFocused = activeElement && (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.isContentEditable
        );

        if (!isInputFocused) {
          e.preventDefault();
          this.showKeyboardShortcuts();
        }
      }
    });
  },

  /**
   * Show keyboard shortcuts modal
   */
  showKeyboardShortcuts() {
    const shortcuts = [
      { key: 'Alt+Shift+1 (or Cmd+Shift+1)', desc: 'Skip to main content' },
      { key: 'Tab', desc: 'Navigate forward through elements' },
      { key: 'Shift+Tab', desc: 'Navigate backward through elements' },
      { key: 'Enter/Space', desc: 'Activate links and buttons' },
      { key: 'Escape', desc: 'Close dialogs and modals' },
      { key: '?', desc: 'Show this help' }
    ];

    const modal = document.createElement('div');
    modal.className = 'keyboard-shortcuts-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'shortcuts-title');
    modal.setAttribute('aria-modal', 'true');

    modal.innerHTML = `
      <div class="shortcuts-content">
        <h2 id="shortcuts-title">Keyboard Shortcuts</h2>
        <table>
          <thead>
            <tr>
              <th>Key</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${shortcuts.map(s => `
              <tr>
                <td><kbd>${s.key}</kbd></td>
                <td>${s.desc}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <button id="close-shortcuts" class="btn-primary">Close (Esc)</button>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .keyboard-shortcuts-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      }

      .shortcuts-content {
        background: var(--bg-secondary, #1a1a1a);
        padding: 2rem;
        border-radius: 0.5rem;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
      }

      .shortcuts-content h2 {
        color: var(--primary-color, #00ff41);
        margin-bottom: 1.5rem;
      }

      .shortcuts-content table {
        width: 100%;
        margin-bottom: 1.5rem;
      }

      .shortcuts-content th,
      .shortcuts-content td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .shortcuts-content kbd {
        background: rgba(255, 255, 255, 0.1);
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-family: monospace;
        font-size: 0.9em;
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(modal);

    // Focus close button
    const closeBtn = document.getElementById('close-shortcuts');
    closeBtn.focus();

    // Close on button click or Escape
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });

    window.announceToScreenReader?.('Keyboard shortcuts dialog opened');
  },

  /**
   * Enhance focus management
   */
  enhanceFocusManagement() {
    // Add visible focus indicators
    const style = document.createElement('style');
    style.textContent = `
      /* Enhanced focus styles */
      *:focus {
        outline: 2px solid var(--primary-color, #00ff41);
        outline-offset: 2px;
      }

      /* Remove outline for mouse users (keep for keyboard) */
      *:focus:not(:focus-visible) {
        outline: none;
      }

      *:focus-visible {
        outline: 2px solid var(--primary-color, #00ff41);
        outline-offset: 2px;
      }

      /* Button focus */
      button:focus,
      .btn:focus {
        box-shadow: 0 0 0 3px rgba(0, 255, 65, 0.3);
      }

      /* Input focus */
      input:focus,
      textarea:focus,
      select:focus {
        border-color: var(--primary-color, #00ff41);
        box-shadow: 0 0 0 3px rgba(0, 255, 65, 0.2);
      }
    `;
    document.head.appendChild(style);

    // Trap focus in modals
    this.trapFocusInModals();

    console.log('✅ Focus management enhanced');
  },

  /**
   * Trap focus within modal dialogs
   */
  trapFocusInModals() {
    document.addEventListener('focus', (e) => {
      const openModal = document.querySelector('[role="dialog"]:not([hidden])');

      if (openModal) {
        // Get all focusable elements in modal
        const focusableElements = openModal.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // If focus is outside modal, bring it back
        if (!openModal.contains(e.target)) {
          firstElement.focus();
        }
      }
    }, true);
  },

  /**
   * Enhance form accessibility
   */
  enhanceFormsAccessibility() {
    // Associate labels with inputs
    document.querySelectorAll('input, textarea, select').forEach(input => {
      // If no label, add aria-label from placeholder or nearby text
      if (!input.id || !document.querySelector(`label[for="${input.id}"]`)) {
        if (!input.getAttribute('aria-label')) {
          const placeholder = input.getAttribute('placeholder');
          const title = input.getAttribute('title');

          if (placeholder) {
            input.setAttribute('aria-label', placeholder);
          } else if (title) {
            input.setAttribute('aria-label', title);
          }
        }
      }

      // Add required indicator
      if (input.hasAttribute('required') && !input.getAttribute('aria-required')) {
        input.setAttribute('aria-required', 'true');
      }
    });

    // Add error announcements
    document.querySelectorAll('form').forEach(form => {
      form.addEventListener('submit', (e) => {
        // Check for validation errors
        const invalidInputs = form.querySelectorAll(':invalid');
        if (invalidInputs.length > 0) {
          window.announceToScreenReader?.(
            `Form has ${invalidInputs.length} error${invalidInputs.length > 1 ? 's' : ''}. Please fix and try again.`,
            'assertive'
          );
        }
      });
    });

    // Add aria-describedby for error messages
    document.querySelectorAll('.error-message, .help-text').forEach(msg => {
      const inputId = msg.getAttribute('data-for');
      if (inputId) {
        const input = document.getElementById(inputId);
        if (input) {
          if (!msg.id) {
            msg.id = `${inputId}-error`;
          }
          input.setAttribute('aria-describedby', msg.id);
        }
      }
    });

    console.log('✅ Forms accessibility enhanced');
  }
};

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
  window.AccessibilityEnhancements = AccessibilityEnhancements;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      AccessibilityEnhancements.init();
    });
  } else {
    AccessibilityEnhancements.init();
  }
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AccessibilityEnhancements;
}
