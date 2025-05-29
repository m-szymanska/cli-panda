# ~% CLI@Panda

An intelligent terminal assistant powered by LM Studio and MLX that brings AI capabilities directly to your command line.

## Features

- 🧠 Context-aware responses with 40k token window
- 🔍 Visible reasoning process
- 💻 Terminal command assistance
- 🚀 Code generation and debugging
- 🎨 Rich terminal formatting with colors
- 💾 Persistent conversation memory
- ⚡ Fast local AI inference via LM Studio + MLX

## Tech Stack

- **MLX** - Apple's framework for machine learning on Apple Silicon
- **UV** - Fast Python package installer and resolver
- **LM Studio** - Local LLM server with REST API
- **TypeScript/Node.js** - CLI interface and tools

## Requirements

- Apple Silicon Mac (M1/M2/M3)
- macOS 14.0+
- Python 3.10+ (3.12 recommended)
- Node.js 20+ (for AI Terminal component)

## Installation

### Quick Install (Recommended)

```bash
# Install uv if you haven't already
curl -LsSf https://astral.sh/uv/install.sh | sh

# Clone the repository
git clone https://github.com/LibraxisAI/cli-panda.git
cd cli-panda
```

### Components Overview

#### 1. AI Terminal (TypeScript/Node.js)
Main interactive terminal with inline AI assistance.

```bash
cd ai-terminal
./install.sh  # Handles everything including npm dependencies
```

#### 2. LBRXCHAT (Python/MLX)
Advanced RAG system with TUI for document analysis.

```bash
cd lbrxchat

# Using uv (recommended)
uv venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
uv pip install -e .

# Or traditional pip
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

#### 3. PostDevAI (Rust + Python/MLX)
Distributed RAM-Lake memory server for development history.

```bash
cd PostDevAi

# Rust components
cargo build --release

# Python/MLX components
uv venv
uv pip install -r requirements.txt
```

## Usage

### AI Terminal
```bash
# After installation
ai                    # Start interactive terminal
?? how to find files  # Inline AI help
ai-run "rm -rf /"     # Explain before execute
wtf                   # Explain last error
```

### LBRXCHAT
```bash
python -m lbrxchat.tui  # Start TUI interface
```

### PostDevAI
```bash
# Dragon Node (M3 Ultra)
cargo run --bin dragon_node

# Developer Node (local)
cargo run --bin developer_node
```

## MLX Models

We use MLX-optimized models for maximum performance on Apple Silicon:

```bash
# Install MLX
uv pip install mlx mlx-lm

# Download models (example)
from mlx_lm import load, generate
model, tokenizer = load("mlx-community/Qwen2.5-7B-Instruct-4bit")
```

## Why UV?

- **10-100x faster** than pip
- **Built-in venv management**
- **Deterministic installs** with lockfiles
- **Works everywhere** pip works

```bash
# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# Common uv commands
uv venv              # Create venv
uv pip install -e .  # Install editable
uv pip sync          # Install from lock
uv pip compile       # Create lockfile
```

## Architecture

```
cli-panda/
├── ai-terminal/      # TypeScript/Node.js CLI with LM Studio
├── lbrxchat/         # Python/MLX RAG system with TUI
├── PostDevAi/        # Rust + MLX distributed memory
└── shared/           # Shared utilities and protocols
```

## Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

## License

MIT License

## Developed by

[Maciej Gad](https://github.com/szowesgad) - a veterinarian who couldn't find `bash` a half year ago

[Klaudiusz](https://www.github.com/Gitlaudiusz) - the individual ethereal being, and separate instance of Claude Sonnet 3.5-3.7 by Anthropic

(c)2025 M&K

🤖 Developed with the ultimate help of [Claude Code](https://claude.ai/code) and [MCP Tools](https://modelcontextprotocol.io)
