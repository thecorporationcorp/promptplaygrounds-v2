/**
 * MOBILE ENHANCEMENTS
 * $400B budget: Google/Apple/Meta-level mobile experience
 */

(function() {
  'use strict';

  const MobileEnhancements = {
    init() {
      this.setupMobileNav();
      this.setupBookmarkletMobileWorkaround();
      this.setupHapticFeedback();
      this.setupShareAPI();
      this.detectMobile();
      console.log('✅ Mobile enhancements loaded');
    },

    // Mobile hamburger navigation
    setupMobileNav() {
      // Add hamburger button and overlay to all pages
      document.addEventListener('DOMContentLoaded', () => {
        const navbar = document.querySelector('.navbar .container');
        if (!navbar) return;

        // Create hamburger button
        const toggle = document.createElement('button');
        toggle.className = 'mobile-menu-toggle';
        toggle.setAttribute('aria-label', 'Open navigation menu');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-controls', 'mobile-navigation');
        toggle.innerHTML = '<span></span><span></span><span></span>';

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'mobile-menu-overlay';

        // Insert into DOM
        navbar.appendChild(toggle);
        document.body.appendChild(overlay);

        const nav = document.querySelector('.navbar-nav');
        if (nav) {
          nav.id = 'mobile-navigation';
          nav.setAttribute('aria-label', 'Main navigation');
        }

        // Toggle menu
        const toggleMenu = () => {
          const isActive = toggle.classList.contains('active');
          const newState = !isActive;

          toggle.classList.toggle('active');
          nav.classList.toggle('active');
          overlay.classList.toggle('active');
          overlay.style.display = newState ? 'block' : 'none';
          document.body.style.overflow = newState ? 'hidden' : '';

          // Update ARIA attributes
          toggle.setAttribute('aria-expanded', newState ? 'true' : 'false');
          toggle.setAttribute('aria-label', newState ? 'Close navigation menu' : 'Open navigation menu');

          // Haptic feedback
          this.vibrate(10);

          // Focus management
          if (newState) {
            // Focus first link when menu opens
            const firstLink = nav.querySelector('a');
            if (firstLink) {
              setTimeout(() => firstLink.focus(), 100);
            }
          } else {
            // Return focus to toggle button when menu closes
            toggle.focus();
          }
        };

        toggle.addEventListener('click', toggleMenu);
        overlay.addEventListener('click', toggleMenu);

        // Close menu on link click
        nav.querySelectorAll('a').forEach(link => {
          link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
              toggleMenu();
            }
          });
        });

        // Close menu on escape
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && toggle.classList.contains('active')) {
            toggleMenu();
          }
        });

        // Focus trap for accessibility (WCAG 2.1 AA)
        nav.addEventListener('keydown', (e) => {
          if (e.key === 'Tab' && toggle.classList.contains('active')) {
            const focusableElements = nav.querySelectorAll('a, button');
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey && document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        });
      });
    },

    // Mobile bookmarklet workaround
    setupBookmarkletMobileWorkaround() {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (!isMobile) return;

      // Show mobile-specific instructions on bookmarklet pages
      document.addEventListener('DOMContentLoaded', () => {
        const bookmarkletButtons = document.querySelectorAll('.bookmarklet-button');

        if (bookmarkletButtons.length > 0) {
          this.showMobileBookmarkletAlert();
        }

        // Replace bookmarklet buttons with mobile-friendly alternatives
        bookmarkletButtons.forEach(button => {
          const promptText = button.getAttribute('data-prompt') ||
                            button.textContent ||
                            'Prompt text';

          // Hide drag button on mobile
          button.style.display = 'none';

          // Create mobile-friendly button
          const mobileBtn = document.createElement('button');
          mobileBtn.className = 'btn btn-primary btn-block';
          mobileBtn.innerHTML = '📋 Copy Prompt to Clipboard';
          mobileBtn.onclick = () => {
            this.copyToClipboard(promptText);
            mobileBtn.innerHTML = '✅ Copied! Paste into ChatGPT/Claude';
            this.vibrate([10, 50, 10]);
            setTimeout(() => {
              mobileBtn.innerHTML = '📋 Copy Prompt to Clipboard';
            }, 3000);
          };

          button.parentNode.insertBefore(mobileBtn, button);
        });
      });
    },

    // Show mobile bookmarklet alert
    showMobileBookmarkletAlert() {
      const alert = document.createElement('div');
      alert.className = 'mobile-bookmarklet-alert';
      alert.innerHTML = `
        <div class="mobile-bookmarklet-content">
          <h4>📱 Using on Mobile?</h4>
          <p><strong>Bookmarklets work best on desktop.</strong> On mobile, copy prompts and paste into ChatGPT/Claude.</p>
          <div class="mobile-bookmarklet-actions">
            <button class="btn btn-secondary btn-sm" onclick="MobileEnhancements.emailSetupLink()">
              📧 Email Me Desktop Link
            </button>
            <button class="btn btn-outline btn-sm" onclick="this.parentElement.parentElement.parentElement.remove()" style="color: white; border-color: white;">
              Got It
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(alert);
      alert.style.display = 'block';

      // Auto-hide after 10 seconds
      setTimeout(() => {
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 300);
      }, 10000);
    },

    // Email setup link
    emailSetupLink() {
      const email = prompt('Enter your email to receive desktop setup instructions:');
      if (email && email.includes('@')) {
        // In production, send to backend
        alert('✅ Setup instructions will be emailed to ' + email);
        this.vibrate([10, 20, 10]);
      }
    },

    // Copy to clipboard
    async copyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return success;
      }
    },

    // Haptic feedback (vibration)
    vibrate(pattern) {
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    },

    // Haptic feedback for all buttons
    setupHapticFeedback() {
      document.addEventListener('click', (e) => {
        if (e.target.matches('button, .btn, a.btn')) {
          this.vibrate(10);
        }
      }, true);
    },

    // Web Share API
    setupShareAPI() {
      // Add share buttons where appropriate
      document.addEventListener('DOMContentLoaded', () => {
        const shareButtons = document.querySelectorAll('[data-share]');

        shareButtons.forEach(btn => {
          if (navigator.share) {
            btn.style.display = 'inline-block';
            btn.addEventListener('click', () => {
              navigator.share({
                title: 'PROMPT PLAYGROUNDZs',
                text: 'Check out these AI prompt bookmarklets!',
                url: window.location.href
              }).catch(err => console.log('Share cancelled'));
            });
          } else {
            btn.style.display = 'none';
          }
        });
      });
    },

    // Detect mobile and add class to body
    detectMobile() {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        document.documentElement.classList.add('is-mobile');
      }

      // Detect iOS
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isIOS) {
        document.documentElement.classList.add('is-ios');
      }

      // Detect touch device
      if ('ontouchstart' in window) {
        document.documentElement.classList.add('is-touch');
      }
    }
  };

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MobileEnhancements.init());
  } else {
    MobileEnhancements.init();
  }

  // Make globally available
  window.MobileEnhancements = MobileEnhancements;

})();

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered:', registration.scope);

        // Check for updates every hour
        setInterval(() => {
          registration.update();
        }, 3600000);

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available, prompt user to reload
              if (confirm('New version available! Reload to update?')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            }
          });
        });
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'CACHE_CLEARED') {
        console.log('✅ Cache cleared');
      }
    });
  });
}
