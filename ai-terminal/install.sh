#!/bin/bash

set -e

echo "🐼 CLI Panda AI Terminal Installer"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Detect OS
OS="$(uname -s)"
ARCH="$(uname -m)"

# Check Node.js
check_node() {
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js not found${NC}"
        echo "Please install Node.js 20+ first"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt "20" ]; then
        echo -e "${RED}❌ Node.js 20+ required. Current: $(node -v)${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Node.js $(node -v) detected${NC}"
}

# Check LM Studio
check_lmstudio() {
    echo -e "\n${BLUE}Checking LM Studio...${NC}"
    
    if curl -s http://localhost:1234/v1/models > /dev/null 2>&1; then
        echo -e "${GREEN}✅ LM Studio is running${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  LM Studio not detected${NC}"
        echo "Please ensure LM Studio is running on port 1234"
        echo "Download from: https://lmstudio.ai"
        return 1
    fi
}

# Install dependencies
install_deps() {
    echo -e "\n${BLUE}Installing dependencies...${NC}"
    npm install --production
}

# Setup ZSH integration
setup_zsh() {
    echo -e "\n${BLUE}Setting up ZSH integration...${NC}"
    
    # Backup .zshrc if it exists
    if [ -f "$HOME/.zshrc" ]; then
        BACKUP_FILE="$HOME/.zshrc.backup.$(date +%Y%m%d_%H%M%S)"
        cp "$HOME/.zshrc" "$BACKUP_FILE"
        echo -e "${GREEN}✅ Created backup: $BACKUP_FILE${NC}"
    fi
    
    ZSH_DIR="$HOME/.zsh/cli-panda"
    mkdir -p "$ZSH_DIR"
    
    # Copy components
    cp -r zsh-components/* "$ZSH_DIR/"
    
    # Add to .zshrc if not already there
    if ! grep -q "source.*cli-panda/init.zsh" "$HOME/.zshrc" 2>/dev/null; then
        echo -e "\n# CLI Panda AI Terminal" >> "$HOME/.zshrc"
        echo "source $ZSH_DIR/init.zsh" >> "$HOME/.zshrc"
        echo -e "${GREEN}✅ Added to ~/.zshrc${NC}"
        echo -e "${YELLOW}ℹ️  Your existing .zshrc settings (API keys, aliases, etc.) are preserved${NC}"
        echo -e "${YELLOW}   Backup saved to: $BACKUP_FILE${NC}"
    else
        echo -e "${GREEN}✅ Already in ~/.zshrc${NC}"
    fi
}

# Create config
create_config() {
    CONFIG_DIR="$HOME/.config/cli-panda"
    mkdir -p "$CONFIG_DIR"
    
    if [ ! -f "$CONFIG_DIR/config.json" ]; then
        cat > "$CONFIG_DIR/config.json" << EOF
{
  "mode": "sdk",
  "model": "qwen3-8b",
  "temperature": 0.7,
  "maxTokens": 200,
  "theme": "warp",
  "features": {
    "inlineAI": true,
    "smartAutocomplete": true,
    "contextAwareness": true,
    "warpStyleBlocks": true
  }
}
EOF
        echo -e "${GREEN}✅ Created config at $CONFIG_DIR/config.json${NC}"
    fi
}

# Main installation
main() {
    check_node
    check_lmstudio || true
    install_deps
    setup_zsh
    create_config
    
    echo -e "\n${GREEN}🎉 Installation complete!${NC}"
    echo -e "\nTo get started:"
    echo -e "  1. Restart your terminal or run: ${BLUE}source ~/.zshrc${NC}"
    echo -e "  2. Type ${BLUE}ai${NC} to start AI Terminal"
    echo -e "  3. Use ${BLUE}??${NC} for inline AI assistance"
    echo -e "\nConfiguration: ${BLUE}~/.config/cli-panda/config.json${NC}"
}

main "$@"