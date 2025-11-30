/**
 * SERVICE WORKER REGISTRATION
 * Registers the service worker for PWA functionality
 */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered:', registration.scope);

        // Check for updates every 24 hours
        setInterval(() => {
          registration.update();
        }, 24 * 60 * 60 * 1000);

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              console.log('🔄 New version available');

              // Show update notification
              showUpdateNotification();
            }
          });
        });
      })
      .catch((error) => {
        console.warn('⚠️  Service Worker registration failed:', error);
      });

    // Handle service worker messages
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'CACHE_CLEARED') {
        console.log('✅ Cache cleared by service worker');
      }
    });
  });
}

/**
 * Show update notification
 */
function showUpdateNotification() {
  // Check if we already showed the notification
  if (sessionStorage.getItem('updateNotificationShown')) {
    return;
  }

  const notification = document.createElement('div');
  notification.className = 'update-notification';
  notification.innerHTML = `
    <div class="update-content">
      <span>🔄 A new version is available!</span>
      <button onclick="reloadPage()" class="btn-primary">Update Now</button>
      <button onclick="dismissUpdate()" class="btn-secondary">Later</button>
    </div>
  `;

  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .update-notification {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--bg-secondary, #1a1a1a);
      border: 2px solid var(--primary-color, #00ff41);
      border-radius: 0.5rem;
      padding: 1rem;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      animation: slideIn 0.3s ease-out;
    }

    .update-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .update-notification button {
      padding: 0.5rem 1rem;
      border-radius: 0.25rem;
      border: none;
      cursor: pointer;
      font-weight: bold;
    }

    .update-notification .btn-primary {
      background: var(--primary-color, #00ff41);
      color: var(--bg-primary, #000);
    }

    .update-notification .btn-secondary {
      background: transparent;
      border: 1px solid var(--text-secondary, #888);
      color: var(--text-primary, #fff);
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @media (max-width: 768px) {
      .update-notification {
        bottom: 10px;
        right: 10px;
        left: 10px;
      }

      .update-content {
        flex-direction: column;
        gap: 0.5rem;
      }

      .update-notification button {
        width: 100%;
      }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(notification);

  // Mark as shown
  sessionStorage.setItem('updateNotificationShown', 'true');

  // Screen reader announcement
  if (window.announceToScreenReader) {
    window.announceToScreenReader('A new version of the site is available. You can update now or continue using the current version.');
  }
}

/**
 * Reload page to activate new service worker
 */
function reloadPage() {
  // Tell service worker to skip waiting
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
  }

  // Reload after a short delay
  setTimeout(() => {
    window.location.reload();
  }, 100);
}

/**
 * Dismiss update notification
 */
function dismissUpdate() {
  const notification = document.querySelector('.update-notification');
  if (notification) {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }
}

// Make functions global for onclick handlers
if (typeof window !== 'undefined') {
  window.reloadPage = reloadPage;
  window.dismissUpdate = dismissUpdate;
}

/**
 * Clear service worker cache (admin function)
 */
window.clearServiceWorkerCache = async function() {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
    console.log('🗑️  Cache clear request sent to service worker');
    return true;
  } else {
    console.warn('⚠️  No active service worker found');
    return false;
  }
};

/**
 * Check if app is running as PWA
 */
window.isPWA = function() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
};

// Log PWA status
if (window.isPWA()) {
  console.log('📱 Running as PWA');
}
