#!/bin/bash
#
# CLI Panda Quick Installer
# Usage: curl -LsSf https://raw.githubusercontent.com/LibraxisAI/cli-panda/main/install.sh | sh
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
    echo -e "${GREEN}"
    echo "   _____ _      _____   _____                _       "
    echo "  / ____| |    |_   _| |  __ \              | |      "
    echo " | |    | |      | |   | |__) |_ _ _ __   __| | __ _ "
    echo " | |    | |      | |   |  ___/ _\` | '_ \ / _\` |/ _\` |"
    echo " | |____| |____ _| |_  | |  | (_| | | | | (_| | (_| |"
    echo "  \_____|______|_____| |_|   \__,_|_| |_|\__,_|\__,_|"
    echo "                                                      "
    echo "                         🐼                           "
    echo -e "${NC}"
}

# Check OS
check_os() {
    if [[ "$OSTYPE" != "darwin"* ]]; then
        echo -e "${RED}❌ Error: CLI Panda currently supports macOS only${NC}"
        echo "Detected OS: $OSTYPE"
        exit 1
    fi
}

# Check if already installed
check_existing() {
    if [ -d "$HOME/cli-panda" ]; then
        echo -e "${YELLOW}⚠️  CLI Panda directory already exists at ~/cli-panda${NC}"
        echo -n "Do you want to update the existing installation? [y/N] "
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            echo "Installation cancelled."
            exit 0
        fi
        echo -e "${BLUE}Updating existing installation...${NC}"
        cd "$HOME/cli-panda"
        git pull origin main || {
            echo -e "${YELLOW}Git pull failed, continuing with existing files${NC}"
        }
        return 0
    fi
    return 1
}

# Main installation
main() {
    print_banner
    echo -e "${BLUE}Installing CLI Panda...${NC}"
    
    # Check OS
    check_os
    
    # Check Xcode Command Line Tools
    if ! xcode-select -p &> /dev/null; then
        echo -e "${YELLOW}Xcode Command Line Tools required${NC}"
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
        echo -e "${BLUE}Cloning CLI Panda repository...${NC}"
        cd "$HOME"
        git clone https://github.com/LibraxisAI/cli-panda.git
        cd cli-panda
    fi
    
    # Make install script executable
    chmod +x install-all.sh
    
    echo -e "${GREEN}✅ CLI Panda downloaded successfully!${NC}"
    echo
    echo -e "${BLUE}To complete installation, run:${NC}"
    echo
    echo "  cd ~/cli-panda"
    echo "  ./install-all.sh"
    echo
    echo -e "${YELLOW}This will install all dependencies including:${NC}"
    echo "  • Homebrew (if not installed)"
    echo "  • uv (Python package manager)"
    echo "  • Node.js (for AI Terminal)"
    echo "  • Rust (for PostDevAI)"
    echo "  • All CLI Panda components"
    echo
    echo -e "${BLUE}For step-by-step guide for beginners:${NC}"
    echo "  cat ~/cli-panda/INSTALL_FOR_HUMANS.md"
    echo
    echo -e "${GREEN}Happy coding with CLI Panda! 🐼${NC}"
}

# Run main
main