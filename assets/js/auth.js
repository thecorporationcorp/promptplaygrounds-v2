/**
 * AUTHENTICATION SYSTEM
 * Simple access code based authentication using localStorage
 */

const AuthSystem = {
  // Valid access codes (in production, this would be server-side)
  // For now, users who pay get sent an access code
  validCodes: [
    'PROMPT2024',
    'EARLYBIRD',
    'FOUNDER99'
  ],

  // Check if user has access
  hasAccess() {
    const accessCode = localStorage.getItem('promptPlaygroundAccess');
    return accessCode && this.validCodes.includes(accessCode);
  },

  // Validate and store access code
  grantAccess(code) {
    const upperCode = code.trim().toUpperCase();

    if (this.validCodes.includes(upperCode)) {
      localStorage.setItem('promptPlaygroundAccess', upperCode);
      localStorage.setItem('promptPlaygroundAccessDate', new Date().toISOString());
      return true;
    }

    return false;
  },

  // Remove access
  revokeAccess() {
    localStorage.removeItem('promptPlaygroundAccess');
    localStorage.removeItem('promptPlaygroundAccessDate');
    localStorage.removeItem('purchasedPrompts');
    localStorage.removeItem('favoritePrompts');
  },

  // Get access date
  getAccessDate() {
    return localStorage.getItem('promptPlaygroundAccessDate');
  },

  // Redirect to landing if no access
  requireAccess() {
    if (!this.hasAccess()) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  },

  // Show access gate modal
  showAccessGate() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
      <div class="modal-content">
        <h2>🔒 Access Required</h2>
        <p>Enter your access code to view the Prompt Library.</p>
        <p class="text-secondary" style="font-size: 0.875rem;">
          Don't have an access code? <a href="index.html#pricing">Get access for 99¢</a>
        </p>

        <form id="accessForm" class="mt-lg">
          <div class="form-group">
            <label class="form-label">Access Code</label>
            <input
              type="text"
              class="form-input"
              id="accessCodeInput"
              placeholder="Enter your code"
              autocomplete="off"
              required
            />
          </div>
          <button type="submit" class="btn btn-primary btn-block">
            Unlock Library
          </button>
        </form>

        <div id="accessError" class="alert alert-warning mt-md" style="display: none;">
          Invalid access code. Please try again.
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Handle form submission
    const form = document.getElementById('accessForm');
    const input = document.getElementById('accessCodeInput');
    const error = document.getElementById('accessError');

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      if (this.grantAccess(input.value)) {
        modal.remove();
        window.location.reload();
      } else {
        error.style.display = 'block';
        input.value = '';
        input.focus();
      }
    });

    input.focus();
  },

  // Developer authentication
  isDeveloper() {
    return localStorage.getItem('developerAccount') === 'active';
  },

  // Register as developer (simplified - in production would be server-side)
  registerDeveloper(email, paymentId) {
    const developer = {
      email,
      paymentId,
      registeredDate: new Date().toISOString(),
      status: 'active',
      submittedPrompts: []
    };

    localStorage.setItem('developerAccount', 'active');
    localStorage.setItem('developerData', JSON.stringify(developer));

    return developer;
  },

  // Get developer data
  getDeveloperData() {
    const data = localStorage.getItem('developerData');
    return data ? JSON.parse(data) : null;
  },

  // Update developer data
  updateDeveloperData(updates) {
    const current = this.getDeveloperData() || {};
    const updated = { ...current, ...updates };
    localStorage.setItem('developerData', JSON.stringify(updated));
    return updated;
  }
};

// Make available globally
window.AuthSystem = AuthSystem;
