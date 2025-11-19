/**
 * PROMPT MODERATION SYSTEM
 * Filters submissions for inappropriate content while maintaining liberal standards
 *
 * PHILOSOPHY:
 * - Liberal: Allow diverse viewpoints and creative expression
 * - All-ages: Block explicit content harmful to minors
 * - Anti-hate: Block fascist, racist, discriminatory content
 * - Quality: Ensure prompts meet minimum quality standards
 */

const ModerationSystem = {

  // BLOCKED PATTERNS - Hate speech, fascist content, explicit content
  blockedPatterns: [
    // Hate speech
    /\b(n[i1]gg[e3]r|f[a4]gg[o0]t|tr[a4]nn[y1]|r[e3]t[a4]rd)\b/i,

    // Fascist/extremist
    /\b(hitler was right|white supremacy|ethnic cleansing|race war|14\/88|blood and soil)\b/i,
    /\b(kill all (jews|blacks|gays|muslims|christians|whites))\b/i,

    // Explicit sexual content
    /\b(porn|xxx|sexual assault|rape fantasy|child sexual|pedophil)\b/i,

    // Violence/harm
    /\b(how to (make|build|create) (bomb|explosive|weapon))\b/i,
    /\b(kill yourself|commit suicide|self harm tutorial)\b/i,
    /\b(murder (plan|tutorial|guide))\b/i,

    // Scams/fraud
    /\b(pyramid scheme|ponzi|mlm recruitment|get rich quick scam)\b/i,
    /\b(credit card (theft|fraud|hacking))\b/i,

    // Doxxing/harassment
    /\b(dox(x|ing)|swat(ting)?|harass(ment)? campaign)\b/i
  ],

  // WARNING PATTERNS - Flagged for manual review
  warningPatterns: [
    /\b(political|controversial|sensitive topic|adult content)\b/i,
    /\b(gun|weapon|drug|alcohol|gambling)\b/i,
    /\b(suicide|depression|mental health)\b/i
  ],

  // QUALITY CHECKS
  minLength: 50,
  maxLength: 5000,

  /**
   * Main moderation function
   * @param {Object} submission - Prompt submission object
   * @returns {Object} - Moderation result
   */
  moderate(submission) {
    const results = {
      approved: false,
      blocked: false,
      flagged: false,
      issues: [],
      warnings: [],
      score: 100
    };

    // Extract text fields to check
    const textToCheck = [
      submission.promptTitle || '',
      submission.promptDescription || '',
      submission.promptText || '',
      submission.promptTags || '',
      submission.promptExample || ''
    ].join(' ');

    // 1. CHECK FOR BLOCKED CONTENT
    for (const pattern of this.blockedPatterns) {
      if (pattern.test(textToCheck)) {
        results.blocked = true;
        results.approved = false;
        results.issues.push(`Blocked: Contains prohibited content matching pattern: ${pattern.source}`);
        results.score = 0;
        return results; // Immediate rejection
      }
    }

    // 2. CHECK FOR WARNING CONTENT
    for (const pattern of this.warningPatterns) {
      if (pattern.test(textToCheck)) {
        results.flagged = true;
        results.warnings.push(`Flagged for review: Contains sensitive content: ${pattern.source}`);
        results.score -= 20;
      }
    }

    // 3. LENGTH CHECKS
    const promptText = submission.promptText || '';
    if (promptText.length < this.minLength) {
      results.issues.push(`Too short: Prompt must be at least ${this.minLength} characters`);
      results.score -= 30;
    }

    if (promptText.length > this.maxLength) {
      results.issues.push(`Too long: Prompt must be under ${this.maxLength} characters`);
      results.score -= 20;
    }

    // 4. QUALITY CHECKS
    const qualityIssues = this.checkQuality(submission);
    results.issues.push(...qualityIssues);
    results.score -= qualityIssues.length * 10;

    // 5. SPAM CHECKS
    const spamIssues = this.checkSpam(textToCheck);
    results.issues.push(...spamIssues);
    results.score -= spamIssues.length * 15;

    // 6. FINAL DECISION
    if (results.score >= 70 && !results.blocked) {
      results.approved = true;
    } else if (results.score >= 50 && !results.blocked) {
      results.flagged = true;
      results.warnings.push('Requires manual review due to quality score');
    }

    return results;
  },

  /**
   * Check for quality issues
   */
  checkQuality(submission) {
    const issues = [];

    // Title checks
    if (!submission.promptTitle || submission.promptTitle.length < 5) {
      issues.push('Title is too short or missing');
    }

    if (submission.promptTitle && submission.promptTitle.length > 100) {
      issues.push('Title is too long (max 100 characters)');
    }

    // Description checks
    if (!submission.promptDescription || submission.promptDescription.length < 20) {
      issues.push('Description is too short or missing');
    }

    // Category check
    if (!submission.promptCategory) {
      issues.push('Category not selected');
    }

    // Price check
    const price = parseFloat(submission.promptPrice);
    if (isNaN(price) || price < 0.99 || price > 12) {
      issues.push('Invalid price (must be between $0.99 and $12)');
    }

    // Email check
    if (!submission.developerEmail || !this.isValidEmail(submission.developerEmail)) {
      issues.push('Invalid or missing email address');
    }

    // Prompt text quality
    const promptText = submission.promptText || '';

    // Check for all caps
    if (promptText === promptText.toUpperCase() && promptText.length > 50) {
      issues.push('Prompt should not be in ALL CAPS');
    }

    // Check for excessive punctuation
    if ((promptText.match(/!{3,}/g) || []).length > 0) {
      issues.push('Excessive punctuation detected');
    }

    return issues;
  },

  /**
   * Check for spam patterns
   */
  checkSpam(text) {
    const issues = [];

    // Check for repeated words
    const words = text.toLowerCase().split(/\s+/);
    const wordCounts = {};
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    for (const [word, count] of Object.entries(wordCounts)) {
      if (word.length > 4 && count > 10) {
        issues.push(`Suspicious repetition of word: "${word}"`);
      }
    }

    // Check for URLs (prompts shouldn't contain external links)
    const urlPattern = /https?:\/\/[^\s]+/gi;
    const urls = text.match(urlPattern) || [];
    if (urls.length > 0) {
      issues.push('Contains external URLs (not allowed in prompts)');
    }

    // Check for email addresses in prompt text
    const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
    const emails = text.match(emailPattern) || [];
    if (emails.length > 1) {
      issues.push('Contains multiple email addresses (suspicious)');
    }

    return issues;
  },

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Generate moderation report
   */
  generateReport(submission, results) {
    const report = {
      timestamp: new Date().toISOString(),
      submissionId: submission.id || 'unknown',
      developer: submission.developerName || 'unknown',
      promptTitle: submission.promptTitle || 'untitled',

      decision: results.approved ? 'APPROVED' :
                results.blocked ? 'BLOCKED' : 'FLAGGED',

      score: results.score,

      issues: results.issues,
      warnings: results.warnings,

      recommendation: this.getRecommendation(results)
    };

    return report;
  },

  /**
   * Get recommendation text
   */
  getRecommendation(results) {
    if (results.blocked) {
      return 'REJECT: Contains prohibited content. Send rejection email with explanation.';
    }

    if (results.approved) {
      return 'APPROVE: Meets all quality standards. Publish immediately.';
    }

    if (results.flagged) {
      return 'MANUAL REVIEW: Requires human judgment before approval.';
    }

    return 'REJECT: Does not meet quality standards. Provide feedback for resubmission.';
  },

  /**
   * Batch moderate multiple submissions
   */
  moderateAll(submissions) {
    return submissions.map(submission => {
      const results = this.moderate(submission);
      return this.generateReport(submission, results);
    });
  },

  /**
   * Get statistics from moderation results
   */
  getStats(reports) {
    const stats = {
      total: reports.length,
      approved: 0,
      blocked: 0,
      flagged: 0,
      avgScore: 0
    };

    reports.forEach(report => {
      if (report.decision === 'APPROVED') stats.approved++;
      if (report.decision === 'BLOCKED') stats.blocked++;
      if (report.decision === 'FLAGGED') stats.flagged++;
      stats.avgScore += report.score;
    });

    stats.avgScore = reports.length > 0 ? (stats.avgScore / reports.length).toFixed(1) : 0;

    return stats;
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModerationSystem;
}

// Make globally available
if (typeof window !== 'undefined') {
  window.ModerationSystem = ModerationSystem;
}
