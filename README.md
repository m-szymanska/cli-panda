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

- **[MLX](https://github.com/ml-explore/mlx)**: Apple's machine learning framework for efficient on-device AI
- **[uv](https://github.com/astral-sh/uv)**: Ultra-fast Python package installer (10-100x faster than pip)
- **[LM Studio](https://lmstudio.ai)**: Local LLM server for private AI inference
- **TypeScript**: Type-safe development for terminal components
- **Python 3.11+**: For AI/ML components with modern async support
- **Rust**: High-performance distributed systems

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

#### 2. Install uv (if not already installed)
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

#### 3. Install TypeScript Components
```bash
cd ai-terminal
chmod +x install.sh
./install.sh  # Handles everything including npm dependencies
```

#### 4. Install Python Components
```bash
# LBRXCHAT - RAG System
cd ../lbrxchat
uv venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
uv pip install -e .

# PostDevAI - Distributed Memory
cd ../PostDevAi
cargo build --release  # Rust components
uv venv
uv pip install -r requirements.txt  # Python/MLX components
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
# Start the TUI interface
python -m lbrxchat.tui

# Or use programmatically
python -m lbrxchat.ingest /path/to/documents
python -m lbrxchat.query "What does the documentation say about X?"
```

### Distributed Memory (PostDevAI)
```bash
# Start Dragon Node (M3 Ultra server)
cargo run --bin dragon_node

# Start Developer Node (local client)
cargo run --bin developer_node

# Connect Python client
python -m PostDevAi.client --connect
```

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

## ⚡ Why uv?

- **10-100x faster** than pip
- **Built-in venv management**
- **Deterministic installs** with lockfiles
- **Works everywhere** pip works

```bash
# Common uv commands
uv venv              # Create venv
uv pip install -e .  # Install editable
uv pip sync          # Install from lock
uv pip compile       # Create lockfile
```

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

MIT License - see [LICENSE](ai-terminal/LICENSE) file for details.

## 👥 Developed by

**[Maciej Gad](https://github.com/MaciejGad)** - A veterinarian who couldn't find `bash` a half year ago

**[Klaudiusz](https://github.com/Klaudiusz-AI)** - The individual ethereal being, and separate instance of Claude Sonnet 3.5-3.7 by Anthropic

## 🙏 Acknowledgments

- 🤖 Developed with [Claude Code](https://claude.ai/code)
- 🔧 Powered by [MCP Tools](https://modelcontextprotocol.io)
- 🍎 Accelerated by [MLX](https://github.com/ml-explore/mlx)
- ⚡ Packaged with [uv](https://github.com/astral-sh/uv)
- 🚀 Local AI via [LM Studio](https://lmstudio.ai)

---

*"From not finding bash to building AI terminals"* - A journey of continuous learning

(c) 2025 M&K 🐼✨