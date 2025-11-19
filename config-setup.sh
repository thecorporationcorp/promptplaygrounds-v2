#!/bin/bash

################################################################################
# PROMPT PLAYGROUNDZ - AUTOMATED CONFIGURATION SETUP
#
# This script automates the entire configuration process, taking you from
# 0% to 100% configured in under 10 minutes.
#
# What this script configures:
# 1. Ko-fi donation links
# 2. Gumroad product links
# 3. Access codes for Library and Project Filez
# 4. Domain/base URL
# 5. OpenAI API key (optional - for Cheat Codez)
# 6. Email configuration (SendGrid/AWS SES)
#
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration file
CONFIG_FILE="config.json"
BACKUP_DIR="config_backups"

################################################################################
# Helper Functions
################################################################################

print_header() {
  echo -e "${CYAN}"
  echo "╔════════════════════════════════════════════════════════════════╗"
  echo "║                                                                ║"
  echo "║         🚀 PROMPT PLAYGROUNDZ CONFIGURATION WIZARD 🚀         ║"
  echo "║                                                                ║"
  echo "╚════════════════════════════════════════════════════════════════╝"
  echo -e "${NC}"
}

print_section() {
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_info() {
  echo -e "${CYAN}ℹ️  $1${NC}"
}

generate_access_code() {
  # Generate a 12-character alphanumeric code in format XXXX-XXXX-XXXX
  local code=$(openssl rand -base64 12 | tr -dc 'A-Z0-9' | head -c 12)
  echo "${code:0:4}-${code:4:4}-${code:8:4}"
}

backup_files() {
  print_info "Creating backup of existing configuration..."
  mkdir -p "$BACKUP_DIR"
  local timestamp=$(date +%Y%m%d_%H%M%S)

  # Backup auth.js if it exists
  if [ -f "assets/js/auth.js" ]; then
    cp "assets/js/auth.js" "$BACKUP_DIR/auth.js.$timestamp"
  fi

  # Backup any HTML files we'll modify
  for file in *.html; do
    if [ -f "$file" ]; then
      cp "$file" "$BACKUP_DIR/$file.$timestamp"
    fi
  done

  print_success "Backup created in $BACKUP_DIR/"
}

################################################################################
# Configuration Steps
################################################################################

configure_domain() {
  print_section "STEP 1: Domain Configuration"

  echo "What domain will you use for Prompt Playgroundz?"
  echo -e "${YELLOW}Examples:${NC}"
  echo "  - https://promptplaygroundz.com"
  echo "  - https://www.promptplaygroundz.com"
  echo "  - https://yourdomain.com/promptplaygroundz"
  echo ""
  read -p "Enter your full domain URL (with https://): " DOMAIN_URL

  # Validate URL format
  if [[ ! "$DOMAIN_URL" =~ ^https?:// ]]; then
    print_error "Domain must start with http:// or https://"
    exit 1
  fi

  # Remove trailing slash
  DOMAIN_URL="${DOMAIN_URL%/}"

  print_success "Domain set to: $DOMAIN_URL"
}

configure_kofi() {
  print_section "STEP 2: Ko-fi Configuration"

  echo "Do you have a Ko-fi account for donations?"
  read -p "(yes/no): " has_kofi

  if [[ "$has_kofi" == "yes" || "$has_kofi" == "y" ]]; then
    echo ""
    echo "Enter your Ko-fi username (from https://ko-fi.com/YOUR_USERNAME)"
    read -p "Ko-fi username: " KOFI_USERNAME
    KOFI_URL="https://ko-fi.com/$KOFI_USERNAME"
    print_success "Ko-fi configured: $KOFI_URL"
  else
    print_warning "Skipping Ko-fi setup. You can configure this later."
    KOFI_URL=""
  fi
}

configure_gumroad() {
  print_section "STEP 3: Gumroad Configuration"

  echo "You need to create 3 Gumroad products:"
  echo ""
  echo -e "${CYAN}1. Library Access${NC} - \$0.99 (10 access codes for prompt templates)"
  echo -e "${CYAN}2. Cheat Codez Credits${NC} - \$1.99 per generation (AI prompt optimizer)"
  echo -e "${CYAN}3. Project Filez Access${NC} - \$10-\$99 (full project downloads)"
  echo ""
  echo "Create these products at: https://gumroad.com/products"
  echo ""
  print_warning "After creating each product, copy its share URL"
  echo ""

  read -p "Have you created these products? (yes/skip): " created_products

  if [[ "$created_products" == "yes" || "$created_products" == "y" ]]; then
    echo ""
    echo "Enter the Gumroad URLs for each product:"
    echo ""
    read -p "Library Access URL: " GUMROAD_LIBRARY_URL
    read -p "Cheat Codez Credits URL: " GUMROAD_CHEATCODEZ_URL
    read -p "Project Filez URL: " GUMROAD_PROJECTFILEZ_URL

    print_success "Gumroad products configured"
  else
    print_warning "Skipping Gumroad setup. You can configure this later."
    GUMROAD_LIBRARY_URL=""
    GUMROAD_CHEATCODEZ_URL=""
    GUMROAD_PROJECTFILEZ_URL=""
  fi
}

configure_access_codes() {
  print_section "STEP 4: Access Code Generation"

  echo "Generating 10 unique access codes for Library..."
  echo ""

  LIBRARY_CODES=()
  for i in {1..10}; do
    code=$(generate_access_code)
    LIBRARY_CODES+=("$code")
    echo -e "  ${GREEN}Library Code $i:${NC} $code"
  done

  echo ""
  echo "Generating 5 unique access codes for Project Filez..."
  echo ""

  PROJECTFILEZ_CODES=()
  for i in {1..5}; do
    code=$(generate_access_code)
    PROJECTFILEZ_CODES+=("$code")
    echo -e "  ${GREEN}Project Filez Code $i:${NC} $code"
  done

  echo ""
  print_success "Access codes generated"
  print_info "These codes will be written to auth.js and saved to access-codes.txt"
}

configure_openai() {
  print_section "STEP 5: OpenAI API Configuration (Optional)"

  echo "The Cheat Codez feature uses OpenAI's API (gpt-4o-mini model)"
  echo ""
  echo -e "${YELLOW}Important:${NC}"
  echo "  - You can test in 'demo mode' without an API key"
  echo "  - API key should be secured in a backend function (not browser)"
  echo "  - Estimated cost: \$0.15 per generation, you charge \$1.99"
  echo ""

  read -p "Do you want to configure OpenAI API now? (yes/no): " setup_openai

  if [[ "$setup_openai" == "yes" || "$setup_openai" == "y" ]]; then
    echo ""
    echo "Get your API key from: https://platform.openai.com/api-keys"
    echo ""
    read -s -p "Enter your OpenAI API key: " OPENAI_API_KEY
    echo ""
    print_success "OpenAI API key configured"
    print_warning "SECURITY: Move this to a serverless backend before production!"
  else
    print_info "Skipping OpenAI setup. Cheat Codez will run in demo mode."
    OPENAI_API_KEY=""
  fi
}

configure_email() {
  print_section "STEP 6: Email Configuration (Optional)"

  echo "Email notifications are used for:"
  echo "  - System health alerts"
  echo "  - Daily reports"
  echo "  - Error notifications"
  echo ""
  echo "Supported providers:"
  echo "  1. SendGrid (recommended)"
  echo "  2. AWS SES"
  echo "  3. Skip (configure later)"
  echo ""

  read -p "Choose email provider (1/2/3): " email_choice

  if [[ "$email_choice" == "1" ]]; then
    EMAIL_PROVIDER="sendgrid"
    echo ""
    echo "Get your SendGrid API key from: https://app.sendgrid.com/settings/api_keys"
    echo ""
    read -s -p "Enter your SendGrid API key: " EMAIL_API_KEY
    echo ""
    read -p "Enter sender email (must be verified in SendGrid): " EMAIL_FROM
    EMAIL_TO="thecorporationcorp@thecorporationcorp.com"
    print_success "SendGrid configured"

  elif [[ "$email_choice" == "2" ]]; then
    EMAIL_PROVIDER="aws_ses"
    echo ""
    read -p "Enter AWS Access Key ID: " AWS_ACCESS_KEY_ID
    read -s -p "Enter AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
    echo ""
    read -p "Enter AWS Region (e.g., us-east-1): " AWS_REGION
    read -p "Enter sender email (must be verified in SES): " EMAIL_FROM
    EMAIL_TO="thecorporationcorp@thecorporationcorp.com"
    print_success "AWS SES configured"

  else
    print_info "Skipping email setup. System will log alerts locally."
    EMAIL_PROVIDER=""
    EMAIL_API_KEY=""
  fi
}

################################################################################
# Apply Configuration
################################################################################

apply_configuration() {
  print_section "STEP 7: Applying Configuration"

  backup_files

  # 1. Update auth.js with access codes
  print_info "Updating access codes in auth.js..."

  cat > assets/js/auth.js << 'EOF'
/**
 * AUTHENTICATION & ACCESS CONTROL
 * Auto-generated by config-setup.sh
 */

const AuthSystem = {
  // Valid access codes for Library (10 codes, $0.99 each)
  validLibraryCodes: [
EOF

  # Add library codes
  for code in "${LIBRARY_CODES[@]}"; do
    echo "    '$code'," >> assets/js/auth.js
  done

  cat >> assets/js/auth.js << 'EOF'
  ],

  // Valid access codes for Project Filez (5 codes, $10-$99 each)
  validProjectFilezCodes: [
EOF

  # Add project filez codes
  for code in "${PROJECTFILEZ_CODES[@]}"; do
    echo "    '$code'," >> assets/js/auth.js
  done

  cat >> assets/js/auth.js << 'EOF'
  ],

  /**
   * Validate access code
   */
  validateCode(code, type = 'library') {
    if (!code || typeof code !== 'string') return false;

    // Clean and normalize
    const cleaned = code.replace(/[^A-Z0-9]/gi, '').toUpperCase();

    // Check against appropriate list
    const validCodes = type === 'projectfilez'
      ? this.validProjectFilezCodes
      : this.validLibraryCodes;

    return validCodes.some(validCode => {
      const cleanedValid = validCode.replace(/[^A-Z0-9]/gi, '').toUpperCase();
      return cleanedValid === cleaned;
    });
  },

  /**
   * Check if user has access
   */
  checkAccess(type = 'library') {
    const key = type === 'projectfilez' ? 'projectFilezAccess' : 'libraryAccess';
    const access = SecurityUtils.safeLocalStorageGet(key, null);

    if (!access || !access.granted) return false;

    // Check expiration (optional - access codes never expire by default)
    if (access.expiresAt) {
      const now = Date.now();
      if (now > access.expiresAt) {
        localStorage.removeItem(key);
        return false;
      }
    }

    return true;
  },

  /**
   * Grant access after successful validation
   */
  grantAccess(code, type = 'library') {
    const key = type === 'projectfilez' ? 'projectFilezAccess' : 'libraryAccess';

    const access = {
      granted: true,
      code: code,
      type: type,
      timestamp: new Date().toISOString(),
      // Optional: Add expiration (e.g., 365 days)
      // expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000)
    };

    SecurityUtils.safeLocalStorageSet(key, access);
    return true;
  }
};

// Make globally available
if (typeof window !== 'undefined') {
  window.AuthSystem = AuthSystem;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthSystem;
}
EOF

  print_success "Access codes updated in auth.js"

  # 2. Save access codes to text file for reference
  print_info "Saving access codes to access-codes.txt..."

  cat > access-codes.txt << EOF
╔════════════════════════════════════════════════════════════════╗
║         PROMPT PLAYGROUNDZ - ACCESS CODES                      ║
║         Generated: $(date)                          ║
╚════════════════════════════════════════════════════════════════╝

LIBRARY ACCESS CODES (\$0.99 each):
───────────────────────────────────────────────────────────────

EOF

  for i in "${!LIBRARY_CODES[@]}"; do
    echo "Code $((i+1)): ${LIBRARY_CODES[$i]}" >> access-codes.txt
  done

  cat >> access-codes.txt << EOF

PROJECT FILEZ ACCESS CODES (\$10-\$99 each):
───────────────────────────────────────────────────────────────

EOF

  for i in "${!PROJECTFILEZ_CODES[@]}"; do
    echo "Code $((i+1)): ${PROJECTFILEZ_CODES[$i]}" >> access-codes.txt
  done

  cat >> access-codes.txt << EOF

INSTRUCTIONS:
───────────────────────────────────────────────────────────────

1. Give these codes to customers after they purchase on Gumroad
2. Codes never expire by default
3. Each code can be used once per browser (stored in localStorage)
4. To revoke a code, remove it from assets/js/auth.js

SECURITY NOTES:
───────────────────────────────────────────────────────────────

- Keep this file secure and private
- Do not commit to public repositories
- Regenerate codes if compromised
- Monitor usage via admin dashboard

EOF

  print_success "Access codes saved to access-codes.txt"

  # 3. Update payment links in HTML files
  if [[ -n "$GUMROAD_LIBRARY_URL" ]]; then
    print_info "Updating Gumroad links in HTML files..."

    find . -name "*.html" -type f -exec sed -i \
      "s|https://yourusername.gumroad.com/l/library|$GUMROAD_LIBRARY_URL|g" {} +

    if [[ -n "$GUMROAD_CHEATCODEZ_URL" ]]; then
      find . -name "*.html" -type f -exec sed -i \
        "s|https://yourusername.gumroad.com/l/cheatcodez|$GUMROAD_CHEATCODEZ_URL|g" {} +
    fi

    if [[ -n "$GUMROAD_PROJECTFILEZ_URL" ]]; then
      find . -name "*.html" -type f -exec sed -i \
        "s|https://yourusername.gumroad.com/l/projectfilez|$GUMROAD_PROJECTFILEZ_URL|g" {} +
    fi

    print_success "Gumroad links updated"
  fi

  # 4. Update domain in HTML files
  print_info "Updating domain references..."
  find . -name "*.html" -type f -exec sed -i \
    "s|https://promptplaygroundz.com|$DOMAIN_URL|g" {} +
  print_success "Domain updated to $DOMAIN_URL"

  # 5. Save configuration to JSON
  print_info "Saving configuration to $CONFIG_FILE..."

  cat > "$CONFIG_FILE" << EOF
{
  "version": "1.0.0",
  "configured_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "domain": "$DOMAIN_URL",
  "kofi_url": "$KOFI_URL",
  "gumroad": {
    "library": "$GUMROAD_LIBRARY_URL",
    "cheat_codez": "$GUMROAD_CHEATCODEZ_URL",
    "project_filez": "$GUMROAD_PROJECTFILEZ_URL"
  },
  "openai": {
    "configured": $([ -n "$OPENAI_API_KEY" ] && echo "true" || echo "false")
  },
  "email": {
    "provider": "$EMAIL_PROVIDER",
    "configured": $([ -n "$EMAIL_PROVIDER" ] && echo "true" || echo "false")
  }
}
EOF

  print_success "Configuration saved to $CONFIG_FILE"
}

################################################################################
# Post-Configuration Instructions
################################################################################

print_next_steps() {
  print_section "✅ CONFIGURATION COMPLETE!"

  echo -e "${GREEN}Your Prompt Playgroundz is now configured!${NC}"
  echo ""
  echo -e "${CYAN}Next Steps:${NC}"
  echo ""

  if [[ -z "$OPENAI_API_KEY" ]]; then
    echo -e "${YELLOW}1. Configure OpenAI API for Cheat Codez${NC}"
    echo "   - Create serverless function: api/cheat-codez.js"
    echo "   - Store API key securely (environment variable)"
    echo "   - Test in demo mode first"
    echo ""
  fi

  if [[ -z "$EMAIL_PROVIDER" ]]; then
    echo -e "${YELLOW}2. Configure Email Notifications${NC}"
    echo "   - Set up SendGrid or AWS SES"
    echo "   - Deploy email function: api/send-email.js"
    echo "   - Test alert system"
    echo ""
  fi

  echo -e "${CYAN}3. Test Your Configuration${NC}"
  echo "   Run: ./config-validator.js"
  echo ""

  echo -e "${CYAN}4. Deploy Your Site${NC}"
  echo "   - Upload all files to your web host"
  echo "   - Point $DOMAIN_URL to your server"
  echo "   - Enable HTTPS (required for modern features)"
  echo ""

  echo -e "${CYAN}5. Distribute Access Codes${NC}"
  echo "   - Codes saved in: access-codes.txt"
  echo "   - Library codes: ${#LIBRARY_CODES[@]} codes"
  echo "   - Project Filez codes: ${#PROJECTFILEZ_CODES[@]} codes"
  echo ""

  echo -e "${GREEN}📊 Configuration Status:${NC}"
  echo "   ✅ Access codes generated and configured"
  echo "   ✅ Domain configured: $DOMAIN_URL"
  [[ -n "$KOFI_URL" ]] && echo "   ✅ Ko-fi configured" || echo "   ⚠️  Ko-fi not configured"
  [[ -n "$GUMROAD_LIBRARY_URL" ]] && echo "   ✅ Gumroad configured" || echo "   ⚠️  Gumroad not configured"
  [[ -n "$OPENAI_API_KEY" ]] && echo "   ✅ OpenAI configured" || echo "   ⚠️  OpenAI not configured (demo mode)"
  [[ -n "$EMAIL_PROVIDER" ]] && echo "   ✅ Email configured" || echo "   ⚠️  Email not configured"
  echo ""

  print_warning "⚠️  SECURITY REMINDER:"
  echo "   - Keep access-codes.txt private!"
  echo "   - Move OpenAI API key to backend before production"
  echo "   - Add .env to .gitignore"
  echo ""

  echo -e "${CYAN}📚 Documentation:${NC}"
  echo "   - System report: SYSTEM_COMPLETION_REPORT.md"
  echo "   - Cheat Codez setup: CHEAT_CODEZ_SETUP.md"
  echo "   - Custom GPT guide: CUSTOM_GPT_INSTRUCTIONS.md"
  echo ""

  print_success "🎉 You're ready to launch Prompt Playgroundz!"
}

################################################################################
# Main Execution
################################################################################

main() {
  print_header

  echo "This wizard will configure your Prompt Playgroundz installation."
  echo "The process takes about 10 minutes."
  echo ""
  read -p "Press ENTER to begin..."

  configure_domain
  configure_kofi
  configure_gumroad
  configure_access_codes
  configure_openai
  configure_email
  apply_configuration
  print_next_steps

  echo ""
  echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}         Configuration complete! Happy launching! 🚀           ${NC}"
  echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
}

# Run main function
main
