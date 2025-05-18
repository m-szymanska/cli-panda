#!/bin/bash

# CLI Panda Installation Script

echo "🐼 Installing CLI Panda..."

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check Python version
PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
REQUIRED_VERSION="3.8"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Python $PYTHON_VERSION is installed, but version $REQUIRED_VERSION or higher is required."
    exit 1
fi

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv "$PROJECT_DIR/venv"

# Activate virtual environment
source "$PROJECT_DIR/venv/bin/activate"

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r "$PROJECT_DIR/requirements.txt"

# Create symlink to cli_panda
echo "🔗 Creating command aliases..."
PYTHON_PATH="$PROJECT_DIR/venv/bin/python"

# Create executable wrapper
cat > "$PROJECT_DIR/ai" << EOF
#!/bin/bash
$PYTHON_PATH $PROJECT_DIR/cli_panda.py "\$@"
EOF

chmod +x "$PROJECT_DIR/ai"

# Add to PATH in shell config
SHELL_CONFIG="$HOME/.zshrc"
if [ -f "$HOME/.bashrc" ]; then
    SHELL_CONFIG="$HOME/.bashrc"
fi

# Check if already in PATH
if ! grep -q "CLI_PANDA_PATH" "$SHELL_CONFIG"; then
    echo "" >> "$SHELL_CONFIG"
    echo "# CLI Panda" >> "$SHELL_CONFIG"
    echo "export CLI_PANDA_PATH=\"$PROJECT_DIR\"" >> "$SHELL_CONFIG"
    echo "export PATH=\"\$CLI_PANDA_PATH:\$PATH\"" >> "$SHELL_CONFIG"
    echo "alias ai=\"\$CLI_PANDA_PATH/ai\"" >> "$SHELL_CONFIG"
    echo "alias ask=\"\$CLI_PANDA_PATH/ai\"" >> "$SHELL_CONFIG"
    echo "alias wtf=\"\$CLI_PANDA_PATH/ai --explain-error\"" >> "$SHELL_CONFIG"
fi

echo "✅ Installation complete!"
echo ""
echo "🎉 CLI Panda is ready to use!"
echo "   - Run 'ai' to start chatting"
echo "   - Run 'ask <question>' for quick questions"
echo "   - Run 'wtf' to explain the last error"
echo ""
echo "📝 Don't forget to restart your terminal or run:"
echo "   source $SHELL_CONFIG"