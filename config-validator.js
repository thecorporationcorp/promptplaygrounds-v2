#!/usr/bin/env node

/**
 * PROMPT PLAYGROUNDZ - CONFIGURATION VALIDATOR
 *
 * Validates that all required configuration is complete and correct.
 * Run this after config-setup.sh to verify your installation.
 *
 * Usage: node config-validator.js
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Validation results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  checks: []
};

/**
 * Helper functions
 */
function printHeader() {
  console.log(`${colors.cyan}
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║      🔍 PROMPT PLAYGROUNDZ CONFIGURATION VALIDATOR 🔍         ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
${colors.reset}`);
}

function printSection(title) {
  console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
}

function pass(message) {
  console.log(`${colors.green}✅ PASS:${colors.reset} ${message}`);
  results.passed++;
  results.checks.push({ status: 'pass', message });
}

function fail(message) {
  console.log(`${colors.red}❌ FAIL:${colors.reset} ${message}`);
  results.failed++;
  results.checks.push({ status: 'fail', message });
}

function warn(message) {
  console.log(`${colors.yellow}⚠️  WARN:${colors.reset} ${message}`);
  results.warnings++;
  results.checks.push({ status: 'warn', message });
}

function info(message) {
  console.log(`${colors.cyan}ℹ️  INFO:${colors.reset} ${message}`);
}

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

function readJSON(filePath) {
  try {
    const content = readFile(filePath);
    return content ? JSON.parse(content) : null;
  } catch {
    return null;
  }
}

/**
 * Validation checks
 */

function validateFileStructure() {
  printSection('FILE STRUCTURE');

  const requiredFiles = [
    'index.html',
    'hub.html',
    'developer.html',
    'developer-dashboard.html',
    'cheat-codez.html',
    'project-filez.html',
    'how-it-works.html',
    'setup-bookmarks.html',
    'admin.html',
    'assets/js/auth.js',
    'assets/js/cheat-codez.js',
    'assets/js/security.js',
    'assets/js/system-monitor.js',
    'assets/css/style.css',
    'config.json'
  ];

  requiredFiles.forEach(file => {
    if (fileExists(file)) {
      pass(`Found ${file}`);
    } else {
      fail(`Missing ${file}`);
    }
  });
}

function validateConfiguration() {
  printSection('CONFIGURATION');

  // Check config.json
  const config = readJSON('config.json');

  if (!config) {
    fail('config.json not found or invalid JSON');
    return;
  }

  pass('config.json exists and is valid JSON');

  // Validate domain
  if (config.domain && config.domain.startsWith('http')) {
    pass(`Domain configured: ${config.domain}`);
  } else {
    fail('Domain not configured or invalid');
  }

  // Validate Gumroad links
  if (config.gumroad) {
    if (config.gumroad.library && config.gumroad.library.includes('gumroad.com')) {
      pass('Gumroad Library link configured');
    } else {
      warn('Gumroad Library link not configured');
    }

    if (config.gumroad.cheat_codez && config.gumroad.cheat_codez.includes('gumroad.com')) {
      pass('Gumroad Cheat Codez link configured');
    } else {
      warn('Gumroad Cheat Codez link not configured');
    }

    if (config.gumroad.project_filez && config.gumroad.project_filez.includes('gumroad.com')) {
      pass('Gumroad Project Filez link configured');
    } else {
      warn('Gumroad Project Filez link not configured');
    }
  } else {
    warn('Gumroad configuration section missing');
  }

  // Validate OpenAI
  if (config.openai && config.openai.configured) {
    pass('OpenAI API configured');
  } else {
    warn('OpenAI API not configured (Cheat Codez will run in demo mode)');
  }

  // Validate Email
  if (config.email && config.email.configured) {
    pass(`Email configured (${config.email.provider})`);
  } else {
    warn('Email not configured (alerts will be logged locally)');
  }
}

function validateAccessCodes() {
  printSection('ACCESS CODES');

  const authContent = readFile('assets/js/auth.js');

  if (!authContent) {
    fail('auth.js not found');
    return;
  }

  // Check for library codes
  const libraryCodesMatch = authContent.match(/validLibraryCodes:\s*\[([\s\S]*?)\]/);
  if (libraryCodesMatch) {
    const codes = libraryCodesMatch[1].match(/['"][A-Z0-9\-]{14}['"]/g) || [];
    if (codes.length >= 10) {
      pass(`Found ${codes.length} Library access codes`);
    } else if (codes.length > 0) {
      warn(`Only ${codes.length} Library codes found (recommended: 10+)`);
    } else {
      fail('No Library access codes found');
    }
  } else {
    fail('validLibraryCodes not found in auth.js');
  }

  // Check for project filez codes
  const projectFilezCodesMatch = authContent.match(/validProjectFilezCodes:\s*\[([\s\S]*?)\]/);
  if (projectFilezCodesMatch) {
    const codes = projectFilezCodesMatch[1].match(/['"][A-Z0-9\-]{14}['"]/g) || [];
    if (codes.length >= 5) {
      pass(`Found ${codes.length} Project Filez access codes`);
    } else if (codes.length > 0) {
      warn(`Only ${codes.length} Project Filez codes found (recommended: 5+)`);
    } else {
      fail('No Project Filez access codes found');
    }
  } else {
    fail('validProjectFilezCodes not found in auth.js');
  }

  // Check for access-codes.txt backup
  if (fileExists('access-codes.txt')) {
    pass('access-codes.txt backup file exists');
  } else {
    warn('access-codes.txt not found (codes should be backed up)');
  }
}

function validateSecurity() {
  printSection('SECURITY');

  const securityContent = readFile('assets/js/security.js');

  if (!securityContent) {
    fail('security.js not found');
    return;
  }

  // Check for XSS protection
  if (securityContent.includes('escapeHtml')) {
    pass('XSS protection (escapeHtml) present');
  } else {
    fail('XSS protection missing');
  }

  // Check for input validation
  if (securityContent.includes('validateEmail')) {
    pass('Email validation present');
  } else {
    fail('Email validation missing');
  }

  // Check for rate limiting
  if (securityContent.includes('checkRateLimit')) {
    pass('Rate limiting present');
  } else {
    warn('Rate limiting not found');
  }

  // Check for safe localStorage handling
  if (securityContent.includes('safeLocalStorageGet') && securityContent.includes('safeLocalStorageSet')) {
    pass('Safe localStorage handling present');
  } else {
    fail('Safe localStorage handling missing');
  }
}

function validateMonitoring() {
  printSection('SYSTEM MONITORING');

  const monitorContent = readFile('assets/js/system-monitor.js');

  if (!monitorContent) {
    fail('system-monitor.js not found');
    return;
  }

  pass('system-monitor.js exists');

  // Check for health checks
  if (monitorContent.includes('performHealthCheck')) {
    pass('Health check system present');
  } else {
    fail('Health check system missing');
  }

  // Check for error tracking
  if (monitorContent.includes('trackError') || monitorContent.includes('window.addEventListener(\'error\'')) {
    pass('Error tracking present');
  } else {
    warn('Error tracking not found');
  }

  // Check for daily reports
  if (monitorContent.includes('generateDailyReport')) {
    pass('Daily report generation present');
  } else {
    warn('Daily report generation not found');
  }

  // Check for email alerts
  if (monitorContent.includes('sendCriticalAlert') || monitorContent.includes('queueEmail')) {
    pass('Email alert system present');
  } else {
    warn('Email alert system not found');
  }
}

function validateBranding() {
  printSection('BRANDING & CONTENT');

  const indexContent = readFile('index.html');

  if (!indexContent) {
    fail('index.html not found');
    return;
  }

  // Check for correct branding (Playgroundz with Z)
  if (indexContent.includes('Playgroundz')) {
    pass('Branding uses "Playgroundz" (with Z)');
  } else {
    warn('Branding may need update to "Playgroundz"');
  }

  // Check for navigation links
  const requiredLinks = [
    'hub.html',
    'cheat-codez.html',
    'project-filez.html',
    'how-it-works.html'
  ];

  requiredLinks.forEach(link => {
    if (indexContent.includes(link)) {
      pass(`Navigation includes ${link}`);
    } else {
      fail(`Navigation missing link to ${link}`);
    }
  });
}

function validateDeploymentReadiness() {
  printSection('DEPLOYMENT READINESS');

  // Check for .gitignore
  if (fileExists('.gitignore')) {
    const gitignore = readFile('.gitignore');
    if (gitignore && gitignore.includes('config.json')) {
      pass('.gitignore includes config.json');
    } else {
      warn('.gitignore should include config.json');
    }
    if (gitignore && gitignore.includes('access-codes.txt')) {
      pass('.gitignore includes access-codes.txt');
    } else {
      warn('.gitignore should include access-codes.txt');
    }
  } else {
    warn('.gitignore not found');
  }

  // Check for README
  if (fileExists('README.md')) {
    pass('README.md exists');
  } else {
    warn('README.md not found (recommended for documentation)');
  }

  // Check for documentation
  const docs = [
    'SYSTEM_COMPLETION_REPORT.md',
    'CHEAT_CODEZ_SETUP.md',
    'ROADMAP_TO_99.md'
  ];

  docs.forEach(doc => {
    if (fileExists(doc)) {
      pass(`Documentation: ${doc} exists`);
    } else {
      warn(`Documentation: ${doc} not found`);
    }
  });
}

function printSummary() {
  printSection('VALIDATION SUMMARY');

  const total = results.passed + results.failed + results.warnings;
  const passRate = total > 0 ? Math.round((results.passed / total) * 100) : 0;

  console.log(`${colors.white}Total Checks: ${total}${colors.reset}`);
  console.log(`${colors.green}✅ Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${results.failed}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Warnings: ${results.warnings}${colors.reset}`);
  console.log(`\n${colors.cyan}Pass Rate: ${passRate}%${colors.reset}\n`);

  // Determine overall status
  let status, statusColor, statusIcon;
  if (results.failed === 0 && results.warnings === 0) {
    status = 'EXCELLENT';
    statusColor = colors.green;
    statusIcon = '🎉';
  } else if (results.failed === 0 && results.warnings <= 5) {
    status = 'GOOD';
    statusColor = colors.green;
    statusIcon = '✅';
  } else if (results.failed <= 3) {
    status = 'NEEDS ATTENTION';
    statusColor = colors.yellow;
    statusIcon = '⚠️';
  } else {
    status = 'CRITICAL ISSUES';
    statusColor = colors.red;
    statusIcon = '❌';
  }

  console.log(`${statusColor}${statusIcon} Overall Status: ${status}${colors.reset}\n`);

  // Print recommendations
  if (results.failed > 0 || results.warnings > 0) {
    console.log(`${colors.cyan}RECOMMENDATIONS:${colors.reset}\n`);

    if (results.failed > 0) {
      console.log(`${colors.red}Critical Issues (${results.failed}):${colors.reset}`);
      results.checks
        .filter(check => check.status === 'fail')
        .forEach(check => {
          console.log(`  • ${check.message}`);
        });
      console.log('');
    }

    if (results.warnings > 0) {
      console.log(`${colors.yellow}Warnings (${results.warnings}):${colors.reset}`);
      results.checks
        .filter(check => check.status === 'warn')
        .forEach(check => {
          console.log(`  • ${check.message}`);
        });
      console.log('');
    }

    console.log(`${colors.cyan}Next Steps:${colors.reset}`);
    if (results.failed > 0) {
      console.log('  1. Fix all failed checks before deploying');
      console.log('  2. Run config-setup.sh again if needed');
    }
    if (results.warnings > 0) {
      console.log('  3. Address warnings for optimal configuration');
      console.log('  4. Review documentation for setup guidance');
    }
    console.log('  5. Re-run this validator after making changes\n');
  } else {
    console.log(`${colors.green}🚀 Your configuration is complete and ready for deployment!${colors.reset}\n`);
    console.log(`${colors.cyan}Next Steps:${colors.reset}`);
    console.log('  1. Upload files to your web server');
    console.log('  2. Configure HTTPS (required)');
    console.log('  3. Test all features in production');
    console.log('  4. Monitor system health via admin dashboard\n');
  }

  // Save report
  const reportPath = 'validation-report.json';
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total,
      passed: results.passed,
      failed: results.failed,
      warnings: results.warnings,
      passRate
    },
    status,
    checks: results.checks
  };

  try {
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`${colors.cyan}📄 Report saved to: ${reportPath}${colors.reset}\n`);
  } catch (error) {
    warn(`Could not save report: ${error.message}`);
  }
}

/**
 * Main execution
 */
function main() {
  printHeader();

  // Change to script directory
  const scriptDir = path.dirname(__filename);
  if (scriptDir) {
    process.chdir(scriptDir);
  }

  // Run all validation checks
  validateFileStructure();
  validateConfiguration();
  validateAccessCodes();
  validateSecurity();
  validateMonitoring();
  validateBranding();
  validateDeploymentReadiness();

  // Print summary
  printSummary();

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };
