#!/bin/sh
#
# CLI Panda One-Line Installer
# Usage: curl -LsSf https://raw.githubusercontent.com/m-szymanska/cli-panda/main/install.sh | sh
#
# Inspired by rustup, uv, and brew installers
# This script does EVERYTHING in one go, just like brew and uv

set -e

# Colors (for printf)
if [ -t 1 ]; then
    GREEN='\033[0;32m'
    BLUE='\033[0;34m'
    YELLOW='\033[1;33m'
    RED='\033[0;31m'
    MAGENTA='\033[0;35m'
    NC='\033[0m'
else
    GREEN=''
    BLUE=''
    YELLOW=''
    RED=''
    MAGENTA=''
    NC=''
fi

# Configuration
REPO_URL="https://github.com/m-szymanska/cli-panda.git"
INSTALL_DIR="$HOME/cli-panda"

# ASCII Art
print_banner() {
    printf "${GREEN}"
    printf "   _____ _      _____   _____                _       \n"
    printf "  / ____| |    |_   _| |  __ \              | |      \n"
    printf " | |    | |      | |   | |__) |_ _ _ __   __| | __ _ \n"
    printf " | |    | |      | |   |  ___/ _\` | '_ \ / _\` |/ _\` |\n"
    printf " | |____| |____ _| |_  | |  | (_| | | | | (_| | (_| |\n"
    printf "  \_____|______|_____| |_|   \__,_|_| |_|\__,_|\__,_|\n"
    printf "                                                      \n"
    printf "                         🐼                           \n"
    printf "${NC}\n"
}

# Error handler
error_exit() {
    printf "${RED}❌ Error: %s${NC}\n" "$1" >&2
    exit 1
}

# Check OS
check_os() {
    case "$OSTYPE" in
        darwin*) ;;
        *) 
            error_exit "CLI Panda currently supports macOS only (detected: $OSTYPE)"
            ;;
    esac
}

# Download and extract
download_cli_panda() {
    printf "${BLUE}Installing CLI Panda...${NC}\n"
    
    # Check if directory exists
    if [ -d "$INSTALL_DIR" ]; then
        printf "${YELLOW}⚠️  CLI Panda directory already exists at ~/cli-panda${NC}\n"
        printf "Do you want to update the existing installation? [y/N] "
        read -r response
        if [ "$response" != "y" ] && [ "$response" != "Y" ]; then
            printf "Installation cancelled.\n"
            exit 0
        fi
        printf "${YELLOW}Updating existing installation...${NC}\n"
        cd "$INSTALL_DIR"
        git pull origin main 2>/dev/null || {
            printf "${YELLOW}Git pull failed, continuing with existing files${NC}\n"
        }
    else
        # Clone repository
        printf "${BLUE}Cloning CLI Panda repository...${NC}\n"
        cd "$HOME"
        git clone "$REPO_URL" || error_exit "Failed to download CLI Panda"
        cd "$INSTALL_DIR"
    fi
}

# Run full installation
run_installation() {
    printf "${BLUE}Running full installation...${NC}\n"
    
    # Make install script executable
    chmod +x install-all.sh
    
    # Create a wrapper that handles interactive prompts
    cat > install-wrapper.sh << 'EOF'
#!/bin/bash
# Auto-respond to prompts
export DEBIAN_FRONTEND=noninteractive
export HOMEBREW_NO_AUTO_UPDATE=1
export CLI_PANDA_AUTO_INSTALL=true

# Function to auto-respond
auto_install() {
    # For AI Terminal LM Studio prompt
    printf "Y\n"
}

# Run install-all.sh with auto responses
auto_install | ./install-all.sh
EOF
    
    chmod +x install-wrapper.sh
    
    # Run the installation
    if ./install-wrapper.sh; then
        rm -f install-wrapper.sh
        return 0
    else
        rm -f install-wrapper.sh
        return 1
    fi
}

# Setup shell integration
setup_shell() {
    printf "${BLUE}Setting up shell integration...${NC}\n"
    
    # Backup .zshrc if exists
    if [ -f "$HOME/.zshrc" ]; then
        BACKUP_FILE="$HOME/.zshrc.backup.$(date +%Y%m%d_%H%M%S)"
        cp "$HOME/.zshrc" "$BACKUP_FILE"
        printf "${GREEN}✅ Created backup: $BACKUP_FILE${NC}\n"
    fi
    
    # Add CLI Panda to .zshrc if not already there
    if ! grep -q "CLI Panda" "$HOME/.zshrc" 2>/dev/null; then
        cat >> "$HOME/.zshrc" << 'EOF'

# CLI Panda AI Terminal
export PATH="$HOME/.local/bin:$PATH"
[ -f "$HOME/.zsh/cli-panda/init.zsh" ] && source "$HOME/.zsh/cli-panda/init.zsh"
EOF
        printf "${GREEN}✅ Added CLI Panda to ~/.zshrc${NC}\n"
    fi
}

# Main installation
main() {
    print_banner
    
    # Check prerequisites
    check_os
    
    # Check Xcode Command Line Tools
    if ! xcode-select -p &> /dev/null; then
        printf "${RED}Xcode Command Line Tools required${NC}\n"
        printf "Installing automatically...\n"
        xcode-select --install 2>/dev/null || {
            printf "Please install manually with: xcode-select --install\n"
            printf "Then run this installer again.\n"
            exit 1
        }
        
        # Wait for installation
        printf "Waiting for Xcode Command Line Tools installation...\n"
        while ! xcode-select -p &> /dev/null; do
            sleep 5
        done
    fi
    
    # Download CLI Panda
    download_cli_panda
    
    # Run full installation
    if run_installation; then
        # Setup shell integration
        setup_shell
        
        printf "\n${GREEN}🎉 CLI Panda installed successfully!${NC}\n"
        printf "\n"
        printf "${MAGENTA}Next steps:${NC}\n"
        printf "  1. Restart your terminal or run:\n"
        printf "     ${BLUE}source ~/.zshrc${NC}\n"
        printf "  2. Start AI Terminal:\n"
        printf "     ${BLUE}ai${NC}\n"
        printf "  3. Use inline AI assistance:\n"
        printf "     ${BLUE}??${NC} your question here\n"
        printf "\n"
        printf "${YELLOW}Remember to:${NC}\n"
        printf "  • Download LM Studio from https://lmstudio.ai\n"
        printf "  • Load the qwen3-8b model\n"
        printf "  • Start the local server (port 1234)\n"
        printf "\n"
        printf "${GREEN}Happy coding with CLI Panda! 🐼${NC}\n"
    else
        error_exit "Installation failed. Check errors above."
    fi
}

# Ensure we're not running as root
if [ "$(id -u)" -eq 0 ]; then 
   error_exit "Please don't run this installer as root"
fi

# Run main installation
main