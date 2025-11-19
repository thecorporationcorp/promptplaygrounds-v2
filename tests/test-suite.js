/**
 * AUTOMATED TEST SUITE
 *
 * Comprehensive tests for PROMPT PLAYGROUNDZ
 * Run with: node tests/test-suite.js
 */

const fs = require('fs');
const path = require('path');

// Test results
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * Test runner
 */
function test(name, fn) {
  results.total++;
  try {
    fn();
    pass(name);
  } catch (error) {
    fail(name, error);
  }
}

function pass(name) {
  console.log(`${colors.green}✓${colors.reset} ${name}`);
  results.passed++;
  results.tests.push({ name, status: 'passed' });
}

function fail(name, error) {
  console.log(`${colors.red}✗${colors.reset} ${name}`);
  console.log(`  ${colors.red}${error.message}${colors.reset}`);
  results.failed++;
  results.tests.push({ name, status: 'failed', error: error.message });
}

function skip(name, reason) {
  console.log(`${colors.yellow}○${colors.reset} ${name} ${colors.yellow}(skipped: ${reason})${colors.reset}`);
  results.skipped++;
  results.tests.push({ name, status: 'skipped', reason });
}

/**
 * Assertions
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertContains(haystack, needle, message) {
  if (!haystack.includes(needle)) {
    throw new Error(message || `Expected to contain ${needle}`);
  }
}

function assertFileExists(filePath, message) {
  if (!fs.existsSync(filePath)) {
    throw new Error(message || `File not found: ${filePath}`);
  }
}

function assertValidJSON(content, message) {
  try {
    JSON.parse(content);
  } catch (error) {
    throw new Error(message || `Invalid JSON: ${error.message}`);
  }
}

/**
 * Test Suites
 */

console.log(`${colors.cyan}
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║           PROMPT PLAYGROUNDZ - AUTOMATED TESTS                 ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
${colors.reset}\n`);

// =============================================================================
// 1. FILE STRUCTURE TESTS
// =============================================================================

console.log(`${colors.blue}▶ File Structure Tests${colors.reset}\n`);

test('All HTML pages exist', () => {
  const pages = [
    'index.html',
    'hub.html',
    'cheat-codez.html',
    'developer.html',
    'developer-dashboard.html',
    'project-filez.html',
    'how-it-works.html',
    'setup-bookmarks.html',
    'admin.html'
  ];

  pages.forEach(page => {
    assertFileExists(page, `Missing: ${page}`);
  });
});

test('All JavaScript files exist', () => {
  const scripts = [
    'assets/js/security.js',
    'assets/js/auth.js',
    'assets/js/email-integration.js',
    'assets/js/system-monitor.js',
    'assets/js/accessibility.js',
    'assets/js/cheat-codez.js',
    'assets/js/sw-register.js'
  ];

  scripts.forEach(script => {
    assertFileExists(script, `Missing: ${script}`);
  });
});

test('API functions exist', () => {
  const apis = [
    'api/send-email.js',
    'api/cheat-codez.js'
  ];

  apis.forEach(api => {
    assertFileExists(api, `Missing: ${api}`);
  });
});

test('Service worker exists', () => {
  assertFileExists('sw.js');
});

test('Configuration files exist', () => {
  assertFileExists('config-setup.sh');
  assertFileExists('config-validator.js');
});

// =============================================================================
// 2. SECURITY TESTS
// =============================================================================

console.log(`\n${colors.blue}▶ Security Tests${colors.reset}\n`);

test('Security.js has XSS protection', () => {
  const content = fs.readFileSync('assets/js/security.js', 'utf8');
  assertContains(content, 'escapeHtml', 'Missing XSS protection');
  assertContains(content, 'replace(/&/g', 'Missing HTML entity encoding');
});

test('Security.js has input validation', () => {
  const content = fs.readFileSync('assets/js/security.js', 'utf8');
  assertContains(content, 'validateEmail', 'Missing email validation');
  assertContains(content, 'validateAccessCode', 'Missing access code validation');
});

test('Security.js has rate limiting', () => {
  const content = fs.readFileSync('assets/js/security.js', 'utf8');
  assertContains(content, 'checkRateLimit', 'Missing rate limiting');
});

test('Security.js has safe localStorage handling', () => {
  const content = fs.readFileSync('assets/js/security.js', 'utf8');
  assertContains(content, 'safeLocalStorageGet', 'Missing safe localStorage');
  assertContains(content, 'safeLocalStorageSet', 'Missing safe localStorage');
});

test('Cheat Codez API has rate limiting', () => {
  const content = fs.readFileSync('api/cheat-codez.js', 'utf8');
  assertContains(content, 'checkRateLimit', 'Missing rate limiting in API');
});

test('Cheat Codez API validates input', () => {
  const content = fs.readFileSync('api/cheat-codez.js', 'utf8');
  assertContains(content, 'validateRequest', 'Missing input validation');
});

test('Email API validates recipient', () => {
  const content = fs.readFileSync('api/send-email.js', 'utf8');
  assertContains(content, 'authorizedRecipient', 'Missing recipient validation');
});

// =============================================================================
// 3. AUTHENTICATION TESTS
// =============================================================================

console.log(`\n${colors.blue}▶ Authentication Tests${colors.reset}\n`);

test('Auth.js exists and has access code validation', () => {
  assertFileExists('assets/js/auth.js');
  const content = fs.readFileSync('assets/js/auth.js', 'utf8');
  assertContains(content, 'validateCode', 'Missing validateCode function');
});

test('Auth.js has check access function', () => {
  const content = fs.readFileSync('assets/js/auth.js', 'utf8');
  assertContains(content, 'checkAccess', 'Missing checkAccess function');
});

test('Auth.js has grant access function', () => {
  const content = fs.readFileSync('assets/js/auth.js', 'utf8');
  assertContains(content, 'grantAccess', 'Missing grantAccess function');
});

// =============================================================================
// 4. MONITORING TESTS
// =============================================================================

console.log(`\n${colors.blue}▶ Monitoring Tests${colors.reset}\n`);

test('System monitor has health check', () => {
  const content = fs.readFileSync('assets/js/system-monitor.js', 'utf8');
  assertContains(content, 'performHealthCheck', 'Missing health check');
});

test('System monitor has error tracking', () => {
  const content = fs.readFileSync('assets/js/system-monitor.js', 'utf8');
  assertContains(content, 'trackError', 'Missing error tracking');
});

test('System monitor has email alerts', () => {
  const content = fs.readFileSync('assets/js/system-monitor.js', 'utf8');
  assertContains(content, 'sendCriticalAlert', 'Missing critical alerts');
});

test('System monitor has daily reports', () => {
  const content = fs.readFileSync('assets/js/system-monitor.js', 'utf8');
  assertContains(content, 'generateDailyReport', 'Missing daily reports');
});

// =============================================================================
// 5. EMAIL INTEGRATION TESTS
// =============================================================================

console.log(`\n${colors.blue}▶ Email Integration Tests${colors.reset}\n`);

test('Email integration exists', () => {
  assertFileExists('assets/js/email-integration.js');
});

test('Email integration has queue system', () => {
  const content = fs.readFileSync('assets/js/email-integration.js', 'utf8');
  assertContains(content, 'queueEmail', 'Missing queueEmail function');
  assertContains(content, 'processQueue', 'Missing processQueue function');
});

test('Email integration has retry logic', () => {
  const content = fs.readFileSync('assets/js/email-integration.js', 'utf8');
  assertContains(content, 'retryAttempts', 'Missing retry logic');
});

test('Email API supports SendGrid', () => {
  const content = fs.readFileSync('api/send-email.js', 'utf8');
  assertContains(content, 'sendgrid', 'Missing SendGrid support');
});

test('Email API supports AWS SES', () => {
  const content = fs.readFileSync('api/send-email.js', 'utf8');
  assertContains(content, 'aws_ses', 'Missing AWS SES support');
});

// =============================================================================
// 6. ACCESSIBILITY TESTS
// =============================================================================

console.log(`\n${colors.blue}▶ Accessibility Tests${colors.reset}\n`);

test('Accessibility script exists', () => {
  assertFileExists('assets/js/accessibility.js');
});

test('Accessibility has skip links', () => {
  const content = fs.readFileSync('assets/js/accessibility.js', 'utf8');
  assertContains(content, 'addSkipLinks', 'Missing skip links');
});

test('Accessibility has ARIA labels', () => {
  const content = fs.readFileSync('assets/js/accessibility.js', 'utf8');
  assertContains(content, 'enhanceARIALabels', 'Missing ARIA labels');
});

test('Accessibility has live regions', () => {
  const content = fs.readFileSync('assets/js/accessibility.js', 'utf8');
  assertContains(content, 'addLiveRegions', 'Missing live regions');
});

test('Accessibility has keyboard navigation', () => {
  const content = fs.readFileSync('assets/js/accessibility.js', 'utf8');
  assertContains(content, 'enhanceKeyboardNavigation', 'Missing keyboard navigation');
});

// =============================================================================
// 7. PWA TESTS
// =============================================================================

console.log(`\n${colors.blue}▶ PWA Tests${colors.reset}\n`);

test('Service worker is configured', () => {
  const content = fs.readFileSync('sw.js', 'utf8');
  assertContains(content, 'CACHE_NAME', 'Missing cache configuration');
  assertContains(content, 'PRECACHE_ASSETS', 'Missing precache assets');
});

test('Service worker registration exists', () => {
  assertFileExists('assets/js/sw-register.js');
  const content = fs.readFileSync('assets/js/sw-register.js', 'utf8');
  assertContains(content, 'serviceWorker.register', 'Missing SW registration');
});

// =============================================================================
// 8. CHEAT CODEZ TESTS
// =============================================================================

console.log(`\n${colors.blue}▶ Cheat Codez Tests${colors.reset}\n`);

test('Cheat Codez page exists', () => {
  assertFileExists('cheat-codez.html');
});

test('Cheat Codez script exists', () => {
  assertFileExists('assets/js/cheat-codez.js');
});

test('Cheat Codez has credit system', () => {
  const content = fs.readFileSync('assets/js/cheat-codez.js', 'utf8');
  assertContains(content, 'checkCredits', 'Missing credit check');
  assertContains(content, 'useCredit', 'Missing credit usage');
});

test('Cheat Codez uses backend API', () => {
  const content = fs.readFileSync('assets/js/cheat-codez.js', 'utf8');
  assertContains(content, 'getBackendEndpoint', 'Missing backend endpoint');
});

test('Cheat Codez API has system prompts', () => {
  const content = fs.readFileSync('api/cheat-codez.js', 'utf8');
  assertContains(content, 'getSystemPrompt', 'Missing system prompts');
  assertContains(content, 'optimized', 'Missing optimized style');
  assertContains(content, 'template', 'Missing template style');
  assertContains(content, 'workflow', 'Missing workflow style');
});

// =============================================================================
// 9. CONFIGURATION TESTS
// =============================================================================

console.log(`\n${colors.blue}▶ Configuration Tests${colors.reset}\n`);

test('Config setup script is executable', () => {
  const stats = fs.statSync('config-setup.sh');
  assert((stats.mode & 0o111) !== 0, 'config-setup.sh is not executable');
});

test('Config validator is executable', () => {
  const stats = fs.statSync('config-validator.js');
  assert((stats.mode & 0o111) !== 0, 'config-validator.js is not executable');
});

test('Config setup script has all steps', () => {
  const content = fs.readFileSync('config-setup.sh', 'utf8');
  assertContains(content, 'configure_domain', 'Missing domain configuration');
  assertContains(content, 'configure_gumroad', 'Missing Gumroad configuration');
  assertContains(content, 'configure_access_codes', 'Missing access code generation');
  assertContains(content, 'configure_openai', 'Missing OpenAI configuration');
  assertContains(content, 'configure_email', 'Missing email configuration');
});

// =============================================================================
// 10. HTML VALIDATION TESTS
// =============================================================================

console.log(`\n${colors.blue}▶ HTML Validation Tests${colors.reset}\n`);

test('All HTML files have required scripts', () => {
  const pages = ['index.html', 'hub.html', 'cheat-codez.html'];
  const requiredScripts = [
    'security.js',
    'accessibility.js',
    'system-monitor.js'
  ];

  pages.forEach(page => {
    const content = fs.readFileSync(page, 'utf8');
    requiredScripts.forEach(script => {
      assertContains(content, script, `${page} missing ${script}`);
    });
  });
});

test('All HTML files have proper doctype', () => {
  const pages = ['index.html', 'hub.html', 'cheat-codez.html'];

  pages.forEach(page => {
    const content = fs.readFileSync(page, 'utf8');
    assertContains(content, '<!DOCTYPE html>', `${page} missing doctype`);
  });
});

// =============================================================================
// PRINT RESULTS
// =============================================================================

console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.cyan}                         TEST RESULTS                           ${colors.reset}`);
console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

console.log(`Total Tests:    ${results.total}`);
console.log(`${colors.green}Passed:         ${results.passed}${colors.reset}`);
console.log(`${colors.red}Failed:         ${results.failed}${colors.reset}`);
console.log(`${colors.yellow}Skipped:        ${results.skipped}${colors.reset}\n`);

const passRate = Math.round((results.passed / results.total) * 100);
console.log(`Pass Rate:      ${passRate}%\n`);

if (results.failed === 0) {
  console.log(`${colors.green}✅ ALL TESTS PASSED!${colors.reset}\n`);
} else {
  console.log(`${colors.red}❌ SOME TESTS FAILED${colors.reset}\n`);
  console.log(`Failed tests:`);
  results.tests
    .filter(t => t.status === 'failed')
    .forEach(t => {
      console.log(`  ${colors.red}✗${colors.reset} ${t.name}`);
      console.log(`    ${colors.red}${t.error}${colors.reset}`);
    });
  console.log('');
}

// Save results to JSON
const reportPath = 'tests/test-results.json';
try {
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total: results.total,
      passed: results.passed,
      failed: results.failed,
      skipped: results.skipped,
      passRate
    },
    tests: results.tests
  }, null, 2));

  console.log(`${colors.cyan}📄 Results saved to: ${reportPath}${colors.reset}\n`);
} catch (error) {
  console.warn(`${colors.yellow}⚠️  Could not save results: ${error.message}${colors.reset}\n`);
}

// Exit with appropriate code
process.exit(results.failed > 0 ? 1 : 0);
