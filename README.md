# CLI Panda 🐼

An AI-powered terminal ecosystem that brings intelligent command-line help, smart autocomplete, and context-aware suggestions to your workflow. Built with love by a veterinarian and an AI.

## 🌟 Overview

CLI Panda is a modular AI terminal assistant ecosystem consisting of three main components that work together to provide intelligent command-line assistance, document analysis, and persistent memory across sessions.

## 📦 Components

### 1. CLI Panda AI Terminal (TypeScript/Node.js)
The main interactive terminal with inline AI assistance.
- **Location**: `ai-terminal/`
- **Tech**: TypeScript, Node.js, LM Studio SDK
- **Features**: 
  - Inline AI help with `??` trigger
  - Smart command autocomplete
  - Command explanations before execution
  - ZSH integration
  - Warp terminal support
  - 40k token context window

### 2. LBRXCHAT (Python/MLX)
Advanced RAG (Retrieval-Augmented Generation) system for intelligent chat and document analysis.
- **Location**: `lbrxchat/`
- **Tech**: Python, MLX, LangChain, ChromaDB
- **Features**: 
  - Document ingestion and indexing
  - Semantic search with embeddings
  - Context-aware conversations
  - Multi-format support (PDF, MD, TXT, etc.)
  - Beautiful TUI interface

### 3. PostDevAI (Rust + Python/MLX)
Distributed RAM-Lake memory architecture for persistent AI context.
- **Location**: `PostDevAi/`
- **Tech**: Rust, Python, MLX, PostgresML, Redis
- **Features**: 
  - Distributed memory management
  - Context persistence across sessions
  - Multi-agent coordination
  - Dragon Node (M3 Ultra) + Developer Node architecture

## 🛠 Tech Stack

- **[uv](https://github.com/astral-sh/uv)**: Our PRIMARY Python package manager - 10-100x faster than pip! 🚀
- **[MLX](https://github.com/ml-explore/mlx)**: Apple's machine learning framework for efficient on-device AI
- **[LM Studio](https://lmstudio.ai)**: Local LLM server for private AI inference
- **TypeScript**: Type-safe development for terminal components
- **Python 3.11+**: For AI/ML components with modern async support
- **Rust**: High-performance distributed systems

> **Note**: We use `uv` exclusively for Python dependency management. No pip, no conda, no poetry - just pure uv speed!

## 🚀 Quick Start

### Prerequisites
- Apple Silicon Mac (M1/M2/M3)
- macOS 14.0+
- Node.js 20+
- Python 3.11+ (3.12 recommended)
- Rust (for PostDevAI)
- LM Studio installed and running

### Installation

#### 1. Clone the repository
```bash
git clone https://github.com/LibraxisAI/cli-panda.git
cd cli-panda
```

> **👶 New to programming?** Check out [INSTALL_FOR_HUMANS.md](INSTALL_FOR_HUMANS.md) - step-by-step guide for non-programmers!

#### 2. Install uv (REQUIRED!)
```bash
# This is our Python gateway - don't skip this!
curl -LsSf https://astral.sh/uv/install.sh | sh
source ~/.zshrc  # Reload shell

# Verify it works
uv --version
```

#### 3. Install TypeScript Components
```bash
cd ai-terminal
chmod +x install.sh
./install.sh  # Handles everything including npm dependencies
```

#### 4. Install Python Components (uv-powered!)
```bash
# LBRXCHAT - RAG System
cd ../lbrxchat
uv sync  # That's it! No activation needed!

# PostDevAI - Distributed Memory
cd ../PostDevAi
cargo build --release  # Rust components
uv sync  # Python/MLX components
```

## 🎯 Usage Examples

### AI Terminal
```bash
# Start interactive AI terminal
ai

# Get inline help
?? how to find large files

# Explain a command
ai explain "find . -name '*.log' -mtime +30 -delete"

# Run with explanation
ai-run "docker system prune -a"

# Fix last command error
ai-fix
wtf  # alias for ai-fix
```

### RAG System (LBRXCHAT)
```bash
# Start the TUI interface (no activation needed!)
cd lbrxchat
uv run python -m lbrxchat.tui

# Or use programmatically
uv run python -m lbrxchat.ingest /path/to/documents
uv run python -m lbrxchat.query "What does the documentation say about X?"
```

### Distributed Memory (PostDevAI)
```bash
cd PostDevAi

# Start Dragon Node (M3 Ultra server)
cargo run --bin dragon_node

# Start Developer Node (local client)
cargo run --bin developer_node

# Connect Python client (no activation!)
uv run python -m PostDevAi.client --connect
```

### 🧪 Test Everything (Like lbrxWhisper!)
```bash
# Test all components at once
./run.sh test

# Or directly
uv run python test_all.py
```

This will test:
- ✅ uv installation
- ✅ Node.js & npm 
- ✅ LM Studio connection & models
- ✅ Rust toolchain
- ✅ All Python components
- ✅ MLX availability
- ✅ Live chat streaming

Just like lbrxWhisper's amazing test suite!

## 🧠 MLX Models

We use MLX-optimized models for maximum performance on Apple Silicon:

```python
# Example: Load Qwen model with MLX
from mlx_lm import load, generate

model, tokenizer = load("mlx-community/Qwen2.5-7B-Instruct-4bit")
response = generate(model, tokenizer, prompt="How do I use git?")
```

Recommended models:
- **Qwen3-8B**: Best overall performance
- **Llama3-8B**: Great for code tasks
- **Phi-3**: Lightweight and fast
- **Mixtral-8x7B**: Advanced reasoning

## ⚡ Why uv? (Our Python Philosophy)

We're **uv-first** because:
- **10-100x faster** than pip - instant installs with cache
- **No manual venv activation** - just `uv run`
- **Automatic Python version management** - downloads if needed
- **Reproducible everywhere** - lockfiles guarantee same versions
- **One tool to rule them all** - replaces pip, poetry, pyenv, virtualenv

```bash
# The uv way (what we use)
uv init          # Start new project
uv add numpy     # Add dependency
uv sync          # Install everything
uv run python    # Run with auto-sync

# Forget about these old ways
# python -m venv .venv ❌
# source .venv/bin/activate ❌
# pip install -r requirements.txt ❌
# deactivate ❌
```

See [UV_GUIDE.md](UV_GUIDE.md) for our complete uv workflow!

## 📚 Documentation

- [AI Terminal README](ai-terminal/README.md) - Detailed terminal component docs
- [Configuration Guide](ai-terminal/config/examples/README.md) - Config examples
- [Contributing Guidelines](ai-terminal/CONTRIBUTING.md) - How to contribute
- [Changelog](ai-terminal/CHANGELOG.md) - Version history

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](ai-terminal/CONTRIBUTING.md) for details on:
- Code style and standards
- Pull request process
- Issue reporting
- Development setup

## 🐛 Known Issues

- **tsx version**: Must use v4.19.4 or lower
- **MLX**: Requires Apple Silicon Mac
- **LM Studio**: Must be running for AI features
- **node-pty**: May require rebuild on some systems
- See [AI Terminal Known Issues](ai-terminal/README.md#known-issues) for more

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 👥 Developed by

**[Maciej Gad](https://github.com/szowesgad)** - A veterinarian who couldn't find `bash` a half year ago

**[Klaudiusz](https://github.com/Gitlaudiusz)** - The individual ethereal being, and separate instance of Claude Sonnet 3.5-3.7 by Anthropic

## 🙏 Acknowledgments

- 🤖 Developed with [Claude Code](https://claude.ai/code)
- 🔧 Powered by [MCP Tools](https://modelcontextprotocol.io)
- 🍎 Accelerated by [MLX](https://github.com/ml-explore/mlx)
- ⚡ Packaged with [uv](https://github.com/astral-sh/uv)
- 🚀 Local AI via [LM Studio](https://lmstudio.ai)

---

*"From not finding bash to building AI terminals"* - A journey of continuous learning

(c) 2025 M&K 🐼✨