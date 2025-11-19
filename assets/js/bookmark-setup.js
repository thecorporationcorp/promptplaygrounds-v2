/**
 * BOOKMARK ORGANIZATION & SETUP SYSTEM
 * Generates browser-compatible bookmark files and setup wizards
 */

const BookmarkSetup = {
  /**
   * Generate Netscape Bookmark File Format (universal browser import)
   * @param {Array} prompts - Array of prompt objects
   * @param {Object} options - Organization options
   * @returns {string} HTML bookmark file content
   */
  generateBookmarkFile(prompts, options = {}) {
    const {
      folderName = 'AI Prompts - PROMPT PLAYGROUNDZs',
      organizeByCa

tegory = true,
      addTimestamps = true
    } = options;

    const timestamp = Math.floor(Date.now() / 1000);

    let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`;

    // Root folder
    html += `    <DT><H3 ADD_DATE="${timestamp}" LAST_MODIFIED="${timestamp}">${folderName}</H3>\n`;
    html += `    <DL><p>\n`;

    if (organizeBycategory) {
      // Organize by category
      const categories = this.groupByCategory(prompts);

      for (const [category, categoryPrompts] of Object.entries(categories)) {
        html += `        <DT><H3 ADD_DATE="${timestamp}">${category}</H3>\n`;
        html += `        <DL><p>\n`;

        for (const prompt of categoryPrompts) {
          const bookmarkletCode = BookmarkletEngine.generate(prompt.prompt, prompt.title);
          const addDate = addTimestamps ? ` ADD_DATE="${timestamp}"` : '';

          html += `            <DT><A HREF="${this.escapeHtml(bookmarkletCode)}" ${addDate}>📌 ${this.escapeHtml(prompt.title)}</A>\n`;
        }

        html += `        </DL><p>\n`;
      }
    } else {
      // Flat list
      for (const prompt of prompts) {
        const bookmarkletCode = BookmarkletEngine.generate(prompt.prompt, prompt.title);
        const addDate = addTimestamps ? ` ADD_DATE="${timestamp}"` : '';

        html += `        <DT><A HREF="${this.escapeHtml(bookmarkletCode)}" ${addDate}>📌 ${this.escapeHtml(prompt.title)}</A>\n`;
      }
    }

    html += `    </DL><p>\n`;
    html += `</DL><p>\n`;

    return html;
  },

  /**
   * Group prompts by category
   * @param {Array} prompts
   * @returns {Object} Categorized prompts
   */
  groupByCategory(prompts) {
    const categories = {};

    prompts.forEach(prompt => {
      const category = prompt.category || 'Uncategorized';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(prompt);
    });

    // Sort categories alphabetically
    return Object.keys(categories)
      .sort()
      .reduce((acc, key) => {
        acc[key] = categories[key];
        return acc;
      }, {});
  },

  /**
   * Download bookmark file
   * @param {string} content - Bookmark file content
   * @param {string} filename - File name
   */
  downloadBookmarkFile(content, filename = 'prompt-playgrounds-bookmarks.html') {
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  },

  /**
   * Generate JSON bookmarks (Chrome format)
   * @param {Array} prompts
   * @returns {Object} Chrome bookmark JSON
   */
  generateChromeBookmarks(prompts) {
    const timestamp = Date.now();

    const categories = this.groupByCategory(prompts);
    const children = [];

    for (const [category, categoryPrompts] of Object.entries(categories)) {
      const folderChildren = categoryPrompts.map(prompt => ({
        type: 'url',
        name: `📌 ${prompt.title}`,
        url: BookmarkletEngine.generate(prompt.prompt, prompt.title),
        date_added: timestamp.toString()
      }));

      children.push({
        type: 'folder',
        name: category,
        date_added: timestamp.toString(),
        date_modified: timestamp.toString(),
        children: folderChildren
      });
    }

    return {
      checksum: '',
      roots: {
        bookmark_bar: {
          children: [{
            type: 'folder',
            name: 'AI Prompts - PROMPT PLAYGROUNDZs',
            date_added: timestamp.toString(),
            date_modified: timestamp.toString(),
            children: children
          }],
          date_added: timestamp.toString(),
          date_modified: timestamp.toString(),
          name: 'Bookmarks bar',
          type: 'folder'
        }
      },
      version: 1
    };
  },

  /**
   * Create setup wizard HTML
   * @param {Array} prompts - User's purchased prompts
   * @returns {string} Setup wizard HTML
   */
  createSetupWizard(prompts) {
    const categories = this.groupByCategory(prompts);

    let html = '<div class="setup-wizard">';
    html += '<h2>📚 Organize Your Bookmarklets</h2>';
    html += '<p class="text-secondary">Drag these organized folders to your bookmarks bar</p>';

    for (const [category, categoryPrompts] of Object.entries(categories)) {
      html += `<div class="bookmark-folder">`;
      html += `  <div class="folder-header">`;
      html += `    <span class="folder-icon">📁</span>`;
      html += `    <span class="folder-name">${category}</span>`;
      html += `    <span class="folder-count">${categoryPrompts.length} prompts</span>`;
      html += `  </div>`;
      html += `  <div class="folder-contents">`;

      categoryPrompts.forEach(prompt => {
        const link = BookmarkletEngine.createBookmarkletLink(prompt);
        html += `    <div class="bookmark-item">${link.outerHTML}</div>`;
      });

      html += `  </div>`;
      html += `</div>`;
    }

    html += '</div>';
    return html;
  },

  /**
   * Get folder structure recommendation
   * @returns {Object} Recommended folder structure
   */
  getFolderStructure() {
    return {
      root: 'AI Prompts',
      folders: [
        {
          name: 'Writing',
          description: 'Email, blog posts, copy',
          icon: '✍️'
        },
        {
          name: 'Coding',
          description: 'Code review, debugging, docs',
          icon: '💻'
        },
        {
          name: 'Marketing',
          description: 'Social media, ads, campaigns',
          icon: '📢'
        },
        {
          name: 'Business',
          description: 'Meetings, reports, presentations',
          icon: '💼'
        },
        {
          name: 'Quick Access',
          description: 'Your most-used prompts',
          icon: '⚡'
        }
      ]
    };
  },

  /**
   * Generate installation instructions
   * @returns {string} HTML instructions
   */
  getInstructions() {
    return `
      <div class="setup-instructions">
        <h3>🎯 Choose Your Setup Method</h3>

        <div class="setup-method">
          <h4>Method 1: One-Click Import (Recommended)</h4>
          <ol>
            <li>Click "Download Bookmarks File" button</li>
            <li>Open your browser's bookmark manager:
              <ul>
                <li><strong>Chrome/Edge:</strong> Ctrl+Shift+O (Win) or Cmd+Shift+O (Mac)</li>
                <li><strong>Firefox:</strong> Ctrl+Shift+B or Cmd+Shift+B</li>
                <li><strong>Safari:</strong> File → Import From → Bookmarks HTML File</li>
              </ul>
            </li>
            <li>Click "Import bookmarks" or "Import from HTML"</li>
            <li>Select the downloaded file</li>
            <li>Done! All your prompts are now organized in folders</li>
          </ol>
        </div>

        <div class="setup-method">
          <h4>Method 2: Manual Drag & Drop</h4>
          <ol>
            <li>Show your bookmarks bar (Ctrl+Shift+B or Cmd+Shift+B)</li>
            <li>Scroll through the folders below</li>
            <li>Drag each bookmarklet to your bookmarks bar</li>
            <li>Create folders manually to stay organized</li>
          </ol>
        </div>

        <div class="setup-method">
          <h4>Method 3: Setup Wizard</h4>
          <ol>
            <li>Click "Launch Setup Wizard"</li>
            <li>Follow the interactive guide</li>
            <li>Drag pre-organized folders to your bookmarks bar</li>
          </ol>
        </div>

        <div class="alert alert-info mt-lg">
          <strong>💡 Pro Tip:</strong> We recommend organizing prompts by category
          (Writing, Coding, Marketing, etc.) for easy access!
        </div>
      </div>
    `;
  },

  /**
   * Escape HTML entities
   * @param {string} str
   * @returns {string}
   */
  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  /**
   * Check browser bookmark import support
   * @returns {Object} Browser capabilities
   */
  checkBrowserSupport() {
    const ua = navigator.userAgent;

    return {
      chrome: /Chrome/.test(ua) && !/Edge/.test(ua),
      firefox: /Firefox/.test(ua),
      safari: /Safari/.test(ua) && !/Chrome/.test(ua),
      edge: /Edge/.test(ua) || /Edg/.test(ua),
      supportsImport: true, // All modern browsers support HTML bookmark import
      supportsJSON: /Chrome/.test(ua) || /Edg/.test(ua) // Chrome/Edge support JSON
    };
  },

  /**
   * Generate browser-specific instructions
   * @returns {string} HTML instructions
   */
  getBrowserInstructions() {
    const browser = this.checkBrowserSupport();

    if (browser.chrome) {
      return `
        <div class="browser-instructions">
          <h4>Chrome Import Instructions:</h4>
          <ol>
            <li>Press <code>Ctrl+Shift+O</code> (Windows) or <code>Cmd+Shift+O</code> (Mac)</li>
            <li>Click the <strong>⋮</strong> menu (top right)</li>
            <li>Select <strong>"Import bookmarks"</strong></li>
            <li>Choose the downloaded HTML file</li>
          </ol>
        </div>
      `;
    } else if (browser.firefox) {
      return `
        <div class="browser-instructions">
          <h4>Firefox Import Instructions:</h4>
          <ol>
            <li>Press <code>Ctrl+Shift+B</code> (Windows) or <code>Cmd+Shift+B</code> (Mac)</li>
            <li>Click <strong>"Import and Backup"</strong></li>
            <li>Select <strong>"Import Bookmarks from HTML..."</strong></li>
            <li>Choose the downloaded HTML file</li>
          </ol>
        </div>
      `;
    } else if (browser.safari) {
      return `
        <div class="browser-instructions">
          <h4>Safari Import Instructions:</h4>
          <ol>
            <li>Go to <strong>File → Import From → Bookmarks HTML File...</strong></li>
            <li>Choose the downloaded HTML file</li>
            <li>Bookmarks will appear in a new folder</li>
          </ol>
        </div>
      `;
    } else if (browser.edge) {
      return `
        <div class="browser-instructions">
          <h4>Edge Import Instructions:</h4>
          <ol>
            <li>Press <code>Ctrl+Shift+O</code> (Windows) or <code>Cmd+Shift+O</code> (Mac)</li>
            <li>Click <strong>"⋯ More options"</strong></li>
            <li>Select <strong>"Import favorites"</strong></li>
            <li>Choose <strong>"Favorites or bookmarks HTML file"</strong></li>
            <li>Select the downloaded HTML file</li>
          </ol>
        </div>
      `;
    }

    return `
      <div class="browser-instructions">
        <h4>Import Instructions:</h4>
        <p>Open your browser's bookmark manager and look for an "Import" option.
        Select the downloaded HTML file to import all your bookmarklets at once.</p>
      </div>
    `;
  }
};

// Make globally available
if (typeof window !== 'undefined') {
  window.BookmarkSetup = BookmarkSetup;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BookmarkSetup;
}
