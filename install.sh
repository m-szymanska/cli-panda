#!/bin/sh
#
# CLI Panda Quick Installer
# Usage: curl -LsSf https://raw.githubusercontent.com/m-szymanska/cli-panda/main/install.sh | sh
#

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# ASCII Art
print_banner() {
    printf "${GREEN}"
    echo "   _____ _      _____   _____                _       "
    echo "  / ____| |    |_   _| |  __ \              | |      "
    echo " | |    | |      | |   | |__) |_ _ _ __   __| | __ _ "
    echo " | |    | |      | |   |  ___/ _\` | '_ \ / _\` |/ _\` |"
    echo " | |____| |____ _| |_  | |  | (_| | | | | (_| | (_| |"
    echo "  \_____|______|_____| |_|   \__,_|_| |_|\__,_|\__,_|"
    echo "                                                      "
    echo "                         🐼                           "
    printf "${NC}\n"
}

# Check OS
check_os() {
    case "$OSTYPE" in
        darwin*) ;;
        *) 
            printf "${RED}❌ Error: CLI Panda currently supports macOS only${NC}\\n"
            echo "Detected OS: $OSTYPE"
            exit 1
            ;;
    esac
}

# Check if already installed
check_existing() {
    if [ -d "$HOME/cli-panda" ]; then
        printf "${YELLOW}⚠️  CLI Panda directory already exists at ~/cli-panda${NC}\n"
        echo -n "Do you want to update the existing installation? [y/N] "
        read -r response
        if [ "$response" != "y" ] && [ "$response" != "Y" ]; then
            echo "Installation cancelled."
            exit 0
        fi
        printf "${BLUE}Updating existing installation...${NC}\n"
        cd "$HOME/cli-panda"
        git pull origin main || {
            printf "${YELLOW}Git pull failed, continuing with existing files${NC}\n"
        }
        return 0
    fi
    return 1
}

# Main installation
main() {
    print_banner
    printf "${BLUE}Installing CLI Panda...${NC}\n"
    
    # Check OS
    check_os
    
    # Check Xcode Command Line Tools
    if ! xcode-select -p &> /dev/null; then
        printf "${YELLOW}Xcode Command Line Tools required${NC}\n"
        echo "Please install with: xcode-select --install"
        echo "Then run this installer again."
        exit 1
    fi
    
    # Check if already installed
    if check_existing; then
        # Already in cli-panda directory from check_existing
        :
    else
        # Fresh installation
        printf "${BLUE}Cloning CLI Panda repository...${NC}\n"
        cd "$HOME"
        git clone https://github.com/m-szymanska/cli-panda.git
        cd cli-panda
    fi
    
    # Make install script executable
    chmod +x install-all.sh
    
    printf "${GREEN}✅ CLI Panda downloaded successfully!${NC}\n"
    echo
    printf "${BLUE}To complete installation, run:${NC}\n"
    echo
    echo "  cd ~/cli-panda"
    echo "  ./install-all.sh"
    echo
    printf "${YELLOW}This will install all dependencies including:${NC}\n"
    echo "  • Homebrew (if not installed)"
    echo "  • uv (Python package manager)"
    echo "  • Node.js (for AI Terminal)"
    echo "  • Rust (for PostDevAI)"
    echo "  • All CLI Panda components"
    echo
    printf "${BLUE}For step-by-step guide for beginners:${NC}\n"
    echo "  cat ~/cli-panda/INSTALL_FOR_HUMANS.md"
    echo
    printf "${GREEN}Happy coding with CLI Panda! 🐼${NC}\n"
}

# Run main
main
