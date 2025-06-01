#!/bin/bash

# CLI Panda Complete Installation Script
# Installs all components with proper error handling

set -euo pipefail

# Check for auto mode from environment
AUTO_MODE="${CLI_PANDA_AUTO_INSTALL:-false}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/LibraxisAI/cli-panda.git"
MIN_NODE_VERSION="20"
MIN_PYTHON_VERSION="3.11"

# Banner
echo -e "${MAGENTA}"
echo "╔═══════════════════════════════════════╗"
echo "║        CLI Panda Installer 🐼         ║"
echo "║   Complete Installation for macOS     ║"
echo "╚═══════════════════════════════════════╝"
echo -e "${NC}"

# Error handler
error_exit() {
    echo -e "\n${RED}❌ Error: $1${NC}" >&2
    echo -e "Installation failed. Please check the error above."
    exit 1
}

# Success message
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Info message
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Warning message
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Get OS info
get_os_info() {
    OS="$(uname -s)"
    ARCH="$(uname -m)"
    
    if [[ "$OS" != "Darwin" ]]; then
        error_exit "This installer is for macOS only. Detected: $OS"
    fi
    
    info "System: macOS on $ARCH"
}

# Check Xcode Command Line Tools
check_xcode() {
    echo -e "\n${BLUE}Checking Xcode Command Line Tools...${NC}"
    
    if ! xcode-select -p &> /dev/null; then
        warning "Xcode Command Line Tools not installed"
        echo "Installing Xcode Command Line Tools..."
        xcode-select --install
        echo "Please complete the installation and run this script again."
        exit 0
    else
        success "Xcode Command Line Tools installed"
    fi
}

# Install Homebrew
install_homebrew() {
    echo -e "\n${BLUE}Checking Homebrew...${NC}"
    
    if ! command_exists brew; then
        warning "Homebrew not found"
        echo "Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        
        # Add to PATH based on architecture
        if [[ "$ARCH" == "arm64" ]]; then
            echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
            eval "$(/opt/homebrew/bin/brew shellenv)"
        else
            echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile
            eval "$(/usr/local/bin/brew shellenv)"
        fi
    fi
    success "Homebrew available"
}

# Install system dependencies
install_dependencies() {
    echo -e "\n${BLUE}Installing system dependencies...${NC}"
    
    # Update Homebrew
    brew update
    
    # Install Git
    if ! command_exists git; then
        brew install git
    fi
    success "Git installed"
    
    # Install Node.js
    if ! command_exists node; then
        brew install node@20
        brew link --overwrite node@20
    fi
    
    # Check Node version
    NODE_VERSION=$(node -v 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt "$MIN_NODE_VERSION" ]; then
        error_exit "Node.js $MIN_NODE_VERSION+ required. Current: $(node -v)"
    fi
    success "Node.js $(node -v) installed"
    
    # Install Python
    if ! command_exists python3; then
        brew install python@3.12
    fi
    
    # Check Python version
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1-2)
    if [[ $(echo "$PYTHON_VERSION >= $MIN_PYTHON_VERSION" | bc) -ne 1 ]]; then
        error_exit "Python $MIN_PYTHON_VERSION+ required. Current: $PYTHON_VERSION"
    fi
    success "Python $PYTHON_VERSION installed"
    
    # Install Rust
    if ! command_exists cargo; then
        info "Installing Rust..."
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        source "$HOME/.cargo/env"
    fi
    success "Rust installed"
    
    # Install additional tools
    brew install cmake pkg-config
    success "Build tools installed"
}

# Install uv (CRITICAL!)
install_uv() {
    echo -e "\n${BLUE}Installing uv - Our Python Gateway...${NC}"
    
    if ! command_exists uv; then
        info "uv is REQUIRED for all Python components"
        curl -LsSf https://astral.sh/uv/install.sh | sh
        
        # Force reload shell config
        if [ -f ~/.zshrc ]; then
            source ~/.zshrc
        elif [ -f ~/.bashrc ]; then
            source ~/.bashrc
        fi
        
        # Add to PATH if still not found
        export PATH="$HOME/.local/bin:$PATH"
    fi
    
    # Verify installation
    if ! command_exists uv; then
        error_exit "uv installation failed. Please install manually and retry."
    fi
    
    UV_VERSION=$(uv --version | cut -d' ' -f2)
    success "uv $UV_VERSION installed - Python is now accessible!"
}

# Verify we're in the right directory
verify_directory() {
    if [ ! -f "pyproject.toml" ] || [ ! -d "ai-terminal" ] || [ ! -d "lbrxchat" ]; then
        error_exit "This script must be run from the CLI Panda root directory!\nPlease run: cd cli-panda && ./install-all.sh"
    fi
    success "CLI Panda directory verified"
}

# Install AI Terminal
install_ai_terminal() {
    echo -e "\n${BLUE}Installing AI Terminal (TypeScript)...${NC}"
    
    cd ai-terminal
    npm install
    
    # Make installer executable and run
    chmod +x install.sh
    if [ "$AUTO_MODE" = "true" ]; then
        # Run with auto responses
        echo "Y" | ./install.sh
    else
        ./install.sh
    fi
    
    cd ..
    success "AI Terminal installed"
}

# Install LBRXCHAT
install_lbrxchat() {
    echo -e "\n${BLUE}Installing LBRXCHAT (RAG System)...${NC}"
    
    cd lbrxchat
    
    # Initialize if needed
    if [ ! -f "pyproject.toml" ]; then
        uv init .
    fi
    
    # Sync dependencies (no activation needed!)
    info "Syncing dependencies with uv..."
    uv sync
    
    # Verify installation
    if uv run python -m lbrxchat --version 2>/dev/null; then
        success "LBRXCHAT ready to use with: uv run python -m lbrxchat.tui"
    else
        warning "LBRXCHAT installed but --version check failed (this is OK)"
    fi
    
    cd ..
}

# Install PostDevAI
install_postdevai() {
    echo -e "\n${BLUE}Installing PostDevAI (Distributed Memory)...${NC}"
    
    cd PostDevAi
    
    # Build Rust components
    info "Building Rust components..."
    cargo build --release
    
    # Initialize Python components
    if [ ! -f "pyproject.toml" ]; then
        uv init .
    fi
    
    # Sync Python dependencies
    info "Syncing Python/MLX dependencies with uv..."
    uv sync
    
    # Verify installation
    if [ -f "./target/release/dragon_node" ]; then
        success "PostDevAI Rust components built"
    fi
    success "PostDevAI ready - Python components: uv run python -m PostDevAi.client"
    
    cd ..
}

# Install CLI component
install_cli() {
    echo -e "\n${BLUE}Installing CLI component (Python)...${NC}"
    
    cd cli
    
    # Initialize if needed
    if [ ! -f "pyproject.toml" ]; then
        uv init .
        # Add core dependencies
        uv add aiohttp rich
    fi
    
    # Sync dependencies
    uv sync
    
    # Make executable
    chmod +x cli_panda.py
    
    # Create global runner script
    cat > ~/.local/bin/cli-panda << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/../../../cli-panda/cli" && uv run python cli_panda.py "$@"
EOF
    chmod +x ~/.local/bin/cli-panda
    
    cd ..
    success "CLI component installed - use 'cli-panda' command"
}

# Setup configuration
setup_config() {
    echo -e "\n${BLUE}Setting up configuration...${NC}"
    
    # Copy environment files
    [ ! -f .env ] && cp .env.example .env
    [ ! -f lbrxchat/.env ] && cp lbrxchat/.env.example lbrxchat/.env
    [ ! -f PostDevAi/.env ] && cp PostDevAi/.env.example PostDevAi/.env
    
    # Create config directory
    mkdir -p ~/.config/cli-panda
    [ ! -f ~/.config/cli-panda/config.json ] && \
        cp ai-terminal/config/default.json ~/.config/cli-panda/config.json
    
    success "Configuration files created"
}

# Check LM Studio
check_lm_studio() {
    echo -e "\n${BLUE}Checking LM Studio...${NC}"
    
    if curl -s -m 2 http://localhost:1234/v1/models > /dev/null 2>&1; then
        success "LM Studio is running"
    else
        warning "LM Studio not detected"
        echo
        echo -e "${YELLOW}⚠️  LM Studio setup needed:${NC}"
        echo "1. Download from https://lmstudio.ai"
        echo "2. Install and launch the app"
        echo "3. Search and download: qwen2.5-7b-instruct"
        echo "4. Load model (Chat tab → Select model)"
        echo "5. Click 'Start Server' (important!)"
        echo
        echo -e "💡 For step-by-step guide: see ${BLUE}INSTALL_FOR_HUMANS.md${NC}"
    fi
}

# Final instructions
show_final_instructions() {
    echo -e "\n${GREEN}╔═══════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║     Installation Complete! 🎉         ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════╝${NC}"
    
    echo -e "\n${BLUE}Next steps:${NC}"
    echo "1. Restart your terminal or run: source ~/.zshrc"
    echo "2. Start LM Studio and load a model"
    echo "3. Test the installation:"
    echo "   - AI Terminal: ai"
    echo "   - Inline help: ?? how to use git"
    echo "   - LBRXCHAT: cd lbrxchat && uv run python -m lbrxchat.tui"
    echo "   - PostDevAI: cd PostDevAi && ./target/release/dragon_node"
    echo "   - CLI Panda: cli-panda --help"
    
    echo -e "\n${BLUE}The uv advantage:${NC}"
    echo "- No need to activate virtual environments!"
    echo "- Just use 'uv run' before any Python command"
    echo "- Dependencies sync automatically"
    echo "- 10-100x faster than pip!"
    
    echo -e "\n${BLUE}Configuration:${NC}"
    echo "- Edit ~/.config/cli-panda/config.json for AI Terminal settings"
    echo "- Edit .env files in each component directory"
    
    echo -e "\n${BLUE}Documentation:${NC}"
    echo "- Main guide: README.md"
    echo "- Installation: INSTALL.md"
    echo "- Component guides in each directory"
    
    echo -e "\n${GREEN}Happy coding with CLI Panda! 🐼${NC}"
}

# Main installation flow
main() {
    # System checks
    get_os_info
    check_xcode
    install_homebrew
    install_dependencies
    install_uv
    
    # Verify we're in the right directory
    verify_directory
    
    # Install components
    install_ai_terminal
    install_lbrxchat
    install_postdevai
    install_cli
    
    # Configuration
    setup_config
    check_lm_studio
    
    # Done!
    show_final_instructions
}

# Run main function
main "$@"