/**
 * PROMPT PLAYGROUND - MAIN APPLICATION
 * Core functionality for the marketplace
 */

const PromptPlayground = {
  prompts: [],
  categories: [],
  featured: [],
  currentFilter: 'all',
  searchQuery: '',

  /**
   * Initialize the application
   */
  async init() {
    try {
      await this.loadPrompts();
      this.initEventListeners();
      console.log('✓ Prompt Playground initialized');
    } catch (error) {
      console.error('Failed to initialize:', error);
    }
  },

  /**
   * Load prompts from JSON database
   */
  async loadPrompts() {
    try {
      const response = await fetch('assets/data/prompts.json');
      const data = await response.json();

      this.prompts = data.prompts || [];
      this.categories = data.categories || [];
      this.featured = data.featured || [];

      console.log(`Loaded ${this.prompts.length} prompts`);
      return data;
    } catch (error) {
      console.error('Failed to load prompts:', error);
      return { prompts: [], categories: [], featured: [] };
    }
  },

  /**
   * Get filtered prompts
   */
  getFilteredPrompts() {
    let filtered = this.prompts;

    // Category filter
    if (this.currentFilter !== 'all') {
      filtered = filtered.filter(p => p.category === this.currentFilter);
    }

    // Search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.tags.some(t => t.toLowerCase().includes(query))
      );
    }

    return filtered;
  },

  /**
   * Render prompts grid
   */
  renderPrompts(containerId = 'promptsGrid') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const prompts = this.getFilteredPrompts();

    if (prompts.length === 0) {
      container.innerHTML = `
        <div class="text-center" style="grid-column: 1/-1; padding: 3rem;">
          <h3>No prompts found</h3>
          <p class="text-secondary">Try adjusting your filters or search query</p>
        </div>
      `;
      return;
    }

    container.innerHTML = prompts.map(prompt => this.createPromptCard(prompt)).join('');
  },

  /**
   * Create a prompt card HTML
   * SECURITY: All user data is escaped to prevent XSS
   */
  createPromptCard(prompt) {
    const isPurchased = this.isPurchased(prompt.id);
    const isFavorite = this.isFavorite(prompt.id);

    // Escape all prompt data to prevent XSS
    const safeId = SecurityUtils.escapeHtml(prompt.id);
    const safeTitle = SecurityUtils.escapeHtml(prompt.title);
    const safeCategory = SecurityUtils.escapeHtml(prompt.category);
    const safeDescription = SecurityUtils.escapeHtml(prompt.description);
    const safeDeveloper = SecurityUtils.escapeHtml(prompt.developer);
    const safePrice = parseFloat(prompt.price).toFixed(2);
    const safeRating = parseFloat(prompt.rating).toFixed(1);
    const safeDownloads = parseInt(prompt.downloads || 0).toLocaleString();

    return `
      <div class="prompt-card" data-prompt-id="${safeId}">
        <div class="prompt-card-header">
          <div>
            <h3 class="prompt-card-title">${safeTitle}</h3>
            <span class="badge badge-secondary">${safeCategory}</span>
          </div>
          <div class="prompt-card-price">$${safePrice}</div>
        </div>

        <div class="prompt-card-meta">
          <span class="rating">★ ${safeRating}</span>
          <span>${safeDownloads} downloads</span>
        </div>

        <p class="prompt-card-description">${safeDescription}</p>

        <div class="prompt-card-tags">
          ${prompt.tags.map(tag => `<span class="badge badge-secondary">${SecurityUtils.escapeHtml(tag)}</span>`).join('')}
        </div>

        <div class="prompt-card-footer">
          <span class="text-secondary" style="font-size: 0.875rem;">by ${safeDeveloper}</span>
          ${isPurchased ?
            '<span class="badge badge-success">✓ Purchased</span>' :
            `<button class="btn btn-primary btn-sm" data-action="purchase" data-prompt-id="${safeId}">Get Bookmarklet</button>`
          }
        </div>
      </div>
    `;
  },

  /**
   * View prompt details
   * SECURITY: All prompt data is escaped to prevent XSS
   */
  viewPrompt(promptId) {
    const prompt = this.prompts.find(p => p.id === promptId);
    if (!prompt) return;

    // Escape all data
    const safeId = SecurityUtils.escapeHtml(prompt.id);
    const safeTitle = SecurityUtils.escapeHtml(prompt.title);
    const safeCategory = SecurityUtils.escapeHtml(prompt.category);
    const safeDescription = SecurityUtils.escapeHtml(prompt.description);
    const safeDeveloper = SecurityUtils.escapeHtml(prompt.developer);
    const safePromptPreview = SecurityUtils.escapeHtml(prompt.prompt.substring(0, 200));
    const safePrice = parseFloat(prompt.price).toFixed(2);
    const safeRating = parseFloat(prompt.rating).toFixed(1);
    const safeDownloads = parseInt(prompt.downloads || 0).toLocaleString();

    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
      <div class="modal-content">
        <button class="modal-close" data-action="close-modal">×</button>

        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1.5rem;">
          <div>
            <h2 style="margin-bottom: 0.5rem;">${safeTitle}</h2>
            <span class="badge badge-secondary">${safeCategory}</span>
          </div>
          <div style="text-align: right;">
            <div class="prompt-card-price">$${safePrice}</div>
            <div class="rating">★ ${safeRating} (${safeDownloads} downloads)</div>
          </div>
        </div>

        <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">
          ${safeDescription}
        </p>

        <div class="bookmarklet-demo" style="margin-bottom: 1.5rem;">
          <strong>Prompt Preview:</strong><br/>
          ${safePromptPreview}${prompt.prompt.length > 200 ? '...' : ''}
        </div>

        <div style="margin-bottom: 1.5rem;">
          <strong>Tags:</strong>
          <div class="prompt-card-tags" style="margin-top: 0.5rem;">
            ${prompt.tags.map(tag => `<span class="badge badge-secondary">${SecurityUtils.escapeHtml(tag)}</span>`).join('')}
          </div>
        </div>

        <div style="border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
          ${this.isPurchased(prompt.id) ?
            this.renderPurchasedPrompt(prompt) :
            `
              <button class="btn btn-primary btn-lg btn-block" data-action="modal-purchase" data-prompt-id="${safeId}">
                Get Bookmarklet - $${safePrice}
              </button>
              <p class="text-center text-secondary" style="margin-top: 1rem; font-size: 0.875rem;">
                One-time payment • Instant access • Works forever
              </p>
            `
          }
        </div>

        <div style="margin-top: 1.5rem; font-size: 0.875rem; color: var(--text-tertiary);">
          Created by <strong>${safeDeveloper}</strong>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close on background click or close button
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.closest('[data-action="close-modal"]')) {
        modal.remove();
      }
    });
  },

  /**
   * Render purchased prompt with bookmarklet
   * SECURITY: Uses data attributes instead of inline onclick
   */
  renderPurchasedPrompt(prompt) {
    const bookmarkletLink = BookmarkletEngine.createBookmarkletLink(prompt);
    const safeId = SecurityUtils.escapeHtml(prompt.id);

    return `
      <div class="alert alert-success">
        <strong>✓ You own this prompt!</strong>
      </div>

      <div style="text-align: center; margin: 2rem 0;">
        ${bookmarkletLink.outerHTML}
      </div>

      ${BookmarkletEngine.getInstructions()}

      <button
        class="btn btn-outline btn-block mt-lg"
        data-action="copy-bookmarklet"
        data-prompt-id="${safeId}"
      >
        📋 Copy Bookmarklet Code
      </button>
    `;
  },

  /**
   * Purchase a prompt
   */
  purchasePrompt(promptId) {
    const prompt = this.prompts.find(p => p.id === promptId);
    if (!prompt) return;

    // In a real app, this would integrate with PayPal/Stripe
    // For now, simulate purchase
    const confirmed = confirm(
      `Purchase "${prompt.title}" for $${prompt.price}?\n\n` +
      `This is a demo - in production, this would process payment via PayPal.`
    );

    if (confirmed) {
      // Mark as purchased
      this.addPurchase(promptId);

      // Show success
      alert(`✓ Purchase successful!\n\nYou can now install the "${prompt.title}" bookmarklet.`);

      // Refresh view
      this.viewPrompt(promptId);
    }
  },

  /**
   * Copy bookmarklet to clipboard
   */
  async copyBookmarklet(promptId) {
    const prompt = this.prompts.find(p => p.id === promptId);
    if (!prompt) return;

    const code = BookmarkletEngine.generate(prompt.prompt, prompt.title);
    const success = await BookmarkletEngine.copyToClipboard(code);

    if (success) {
      alert('✓ Bookmarklet code copied to clipboard!');
    } else {
      alert('Failed to copy. Please try dragging the bookmarklet button instead.');
    }
  },

  /**
   * Check if prompt is purchased
   */
  isPurchased(promptId) {
    const purchased = JSON.parse(localStorage.getItem('purchasedPrompts') || '[]');
    return purchased.includes(promptId);
  },

  /**
   * Add purchase
   */
  addPurchase(promptId) {
    const purchased = JSON.parse(localStorage.getItem('purchasedPrompts') || '[]');
    if (!purchased.includes(promptId)) {
      purchased.push(promptId);
      localStorage.setItem('purchasedPrompts', JSON.stringify(purchased));
    }
  },

  /**
   * Check if prompt is favorited
   */
  isFavorite(promptId) {
    const favorites = JSON.parse(localStorage.getItem('favoritePrompts') || '[]');
    return favorites.includes(promptId);
  },

  /**
   * Toggle favorite
   */
  toggleFavorite(promptId) {
    const favorites = JSON.parse(localStorage.getItem('favoritePrompts') || '[]');
    const index = favorites.indexOf(promptId);

    if (index > -1) {
      favorites.splice(index, 1);
    } else {
      favorites.push(promptId);
    }

    localStorage.setItem('favoritePrompts', JSON.stringify(favorites));
    this.renderPrompts();
  },

  /**
   * Set category filter
   */
  setFilter(category) {
    this.currentFilter = category;
    this.renderPrompts();
    this.updateFilterButtons();
  },

  /**
   * Update filter button states
   */
  updateFilterButtons() {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
      if (btn.dataset.category === this.currentFilter) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  },

  /**
   * Set search query
   */
  setSearch(query) {
    this.searchQuery = query;
    this.renderPrompts();
  },

  /**
   * Initialize event listeners
   */
  initEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.setSearch(e.target.value);
      });
    }

    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.setFilter(btn.dataset.category);
      });
    });

    // Event delegation for prompt cards and purchase buttons
    document.addEventListener('click', (e) => {
      // Handle prompt card clicks (view details)
      const promptCard = e.target.closest('.prompt-card');
      if (promptCard && !e.target.closest('[data-action="purchase"]')) {
        const promptId = promptCard.dataset.promptId;
        if (promptId) {
          this.viewPrompt(promptId);
        }
        return;
      }

      // Handle purchase button clicks
      const purchaseBtn = e.target.closest('[data-action="purchase"]');
      if (purchaseBtn) {
        e.stopPropagation(); // Prevent card click
        const promptId = purchaseBtn.dataset.promptId;
        if (promptId) {
          this.purchasePrompt(promptId);
        }
        return;
      }

      // Handle copy bookmarklet buttons in modals
      const copyBtn = e.target.closest('[data-action="copy-bookmarklet"]');
      if (copyBtn) {
        const promptId = copyBtn.dataset.promptId;
        if (promptId) {
          this.copyBookmarklet(promptId);
        }
        return;
      }

      // Handle purchase in modal
      const modalPurchaseBtn = e.target.closest('[data-action="modal-purchase"]');
      if (modalPurchaseBtn) {
        const promptId = modalPurchaseBtn.dataset.promptId;
        if (promptId) {
          this.purchasePrompt(promptId);
        }
        return;
      }
    });
  },

  /**
   * Get user stats
   */
  getStats() {
    const purchased = JSON.parse(localStorage.getItem('purchasedPrompts') || '[]');
    const favorites = JSON.parse(localStorage.getItem('favoritePrompts') || '[]');

    return {
      totalPrompts: this.prompts.length,
      purchasedCount: purchased.length,
      favoritesCount: favorites.length,
      categories: this.categories.length
    };
  },

  /**
   * Render featured prompts
   */
  renderFeatured(containerId = 'featuredPrompts') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const featuredPrompts = this.prompts.filter(p => this.featured.includes(p.id));
    container.innerHTML = featuredPrompts.map(p => this.createPromptCard(p)).join('');
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => PromptPlayground.init());
} else {
  PromptPlayground.init();
}

// Make globally available
window.PromptPlayground = PromptPlayground;
