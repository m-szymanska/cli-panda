# CLI Panda Installation Guide 🐼

Complete installation instructions for setting up CLI Panda on a fresh macOS system.

## Prerequisites

### System Requirements
- Apple Silicon Mac (M1/M2/M3) or Intel Mac
- macOS 14.0 or later
- At least 16GB RAM (32GB+ recommended for full features)
- 10GB free disk space

### Required Software

1. **Xcode Command Line Tools**
   ```bash
   xcode-select --install
   ```

2. **Homebrew**
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   
   # Add Homebrew to PATH (for Apple Silicon)
   echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
   eval "$(/opt/homebrew/bin/brew shellenv)"
   ```

3. **Git**
   ```bash
   brew install git
   ```

## Step 1: Clone Repository

```bash
git clone https://github.com/LibraxisAI/cli-panda.git
cd cli-panda
```

## Step 2: Install System Dependencies

### Core Dependencies
```bash
# Node.js 20+ (for AI Terminal)
brew install node@20

# Python 3.11+ (for ML components)
brew install python@3.12

# Rust (for PostDevAI)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"

# Additional tools
brew install cmake pkg-config
```

### Install uv (REQUIRED - Our Python Gateway)
```bash
# This is THE MOST IMPORTANT STEP for Python components!
curl -LsSf https://astral.sh/uv/install.sh | sh
source ~/.zshrc  # or restart terminal

# Verify installation
uv --version  # Should show 0.5.x or higher
```

## Step 3: Install LM Studio

1. Download LM Studio from [https://lmstudio.ai](https://lmstudio.ai)
2. Install the app by dragging to Applications
3. Launch LM Studio
4. Download a model (recommended: `qwen3-8b` or `llama3-8b`)
5. Start the local server (it runs on `http://localhost:1234`)

## Step 4: Install CLI Panda Components

### Option A: Quick Install (Recommended)

```bash
# Run the all-in-one installer
./scripts/install.sh
```

### Option B: Manual Installation

#### 1. AI Terminal (TypeScript/Node.js)
```bash
cd ai-terminal
npm install
./install.sh

# Verify installation
source ~/.zshrc
ai --version
```

#### 2. LBRXCHAT (Python/MLX RAG System)
```bash
cd ../lbrxchat

# Initialize uv project (if needed)
uv init .

# Add all dependencies
uv add -r requirements.txt  # If requirements.txt exists
# OR directly add packages
uv add mlx mlx-lm textual numpy scikit-learn chromadb langchain

# Run without activation!
uv run python -m lbrxchat --help
```

#### 3. PostDevAI (Rust + Python)
```bash
cd ../PostDevAi

# Build Rust components
cargo build --release

# Initialize uv and add Python dependencies
uv init .
uv add -r requirements.txt
# OR directly
uv add mlx mlx-lm grpcio grpcio-tools protobuf pydantic

# Verify installation
./target/release/dragon_node --version
uv run python -m PostDevAi.client --help
```

#### 4. CLI Component (Python)
```bash
cd ../cli

# Initialize uv project
uv init .
uv add aiohttp rich

# Make executable
chmod +x cli_panda.py

# Run with uv
uv run python cli_panda.py --help
```

## Step 5: Configuration

### Environment Variables
```bash
# Copy example files
cp .env.example .env
cp lbrxchat/.env.example lbrxchat/.env
cp PostDevAi/.env.example PostDevAi/.env

# Edit with your settings
nano .env
```

### AI Terminal Configuration
```bash
# Copy default config
mkdir -p ~/.config/cli-panda
cp ai-terminal/config/default.json ~/.config/cli-panda/config.json

# Edit if needed
nano ~/.config/cli-panda/config.json
```

## Step 6: Verify Installation

### 🧪 Test Everything at Once (Recommended!)

```bash
# One command to test all components (like lbrxWhisper!)
./run.sh test

# Or directly
uv run python test_all.py
```

This comprehensive test will check:
- uv installation and version
- Node.js and npm for AI Terminal
- LM Studio connection and loaded models
- Rust toolchain for PostDevAI
- All Python components with uv
- MLX availability on Apple Silicon
- Live streaming chat functionality

### Test Each Component Manually

1. **AI Terminal**
   ```bash
   # Start interactive terminal
   ai
   
   # Test inline AI
   ?? how to list files
   
   # Exit with Ctrl+C
   ```

2. **LBRXCHAT**
   ```bash
   cd lbrxchat
   uv run python -m lbrxchat.tui
   # Exit with Ctrl+C
   ```

3. **PostDevAI**
   ```bash
   cd PostDevAi
   # Start Dragon Node (in one terminal)
   ./target/release/dragon_node
   
   # Start Developer Node (in another terminal)
   ./target/release/developer_node
   ```

4. **CLI Panda Python**
   ```bash
   cd cli
   uv run python cli_panda.py --help
   ```

## Step 7: Optional MLX Models

For better performance on Apple Silicon:

```bash
# In any Python component directory
cd lbrxchat  # or PostDevAi

# MLX is already added if you followed steps above
# Just download optimized models
uv run python -c "from mlx_lm import load; load('mlx-community/Qwen2.5-7B-Instruct-4bit')"
```

## Troubleshooting

### Common Issues

1. **"Command not found: ai"**
   ```bash
   source ~/.zshrc
   # or add to PATH manually
   export PATH="$HOME/.local/bin:$PATH"
   ```

2. **LM Studio connection error**
   - Make sure LM Studio is running
   - Check if server is started on port 1234
   - Load a model in LM Studio

3. **Python package conflicts**
   ```bash
   # uv handles this automatically!
   uv sync --refresh  # Force refresh dependencies
   
   # Or start fresh
   rm -rf .venv uv.lock
   uv sync
   ```

4. **Rust compilation errors**
   ```bash
   # Update Rust
   rustup update
   # Clean and rebuild
   cargo clean
   cargo build --release
   ```

5. **Permission denied**
   ```bash
   chmod +x install.sh
   chmod +x ~/.local/bin/cli-panda
   ```

### System-Specific Issues

**macOS Ventura/Sonoma**
- May need to allow terminal access in System Preferences > Privacy & Security

**Apple Silicon (M1/M2/M3)**
- Ensure all tools are ARM64 native
- Use Homebrew from `/opt/homebrew`

**Intel Macs**
- MLX features will be disabled (CPU only)
- Use Homebrew from `/usr/local`

## Next Steps

1. **Configure your preferred model** in LM Studio
2. **Read component documentation:**
   - [AI Terminal Guide](ai-terminal/README.md)
   - [LBRXCHAT Guide](lbrxchat/README.md)
   - [PostDevAI Guide](PostDevAi/README.md)
3. **Join the community** at [GitHub Discussions](https://github.com/LibraxisAI/cli-panda/discussions)

## Support

- **Issues**: [GitHub Issues](https://github.com/LibraxisAI/cli-panda/issues)
- **Documentation**: Check README files in each component directory
- **Community**: Ask questions in GitHub Discussions

---

Happy coding with CLI Panda! 🐼✨