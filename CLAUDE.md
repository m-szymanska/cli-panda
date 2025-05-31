# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Testing
```bash
# Test all components (like lbrxWhisper test suite)
uv run python test_all.py

# Test individual components
cd lbrxchat && uv sync
cd PostDevAi && cargo build --release
cd ai-terminal && npm install
```

### Building & Running
```bash
# uv is our ONLY Python gateway - no pip, no conda, no poetry
uv sync                              # Install/sync dependencies
uv run python -m lbrxchat.tui       # LBRXCHAT RAG system
uv run python cli_panda.py          # CLI component

# Rust components (PostDevAI)
cargo build --release               # Build all Rust binaries
cargo run --bin dragon_node         # Start Dragon Node
cargo run --bin developer_node      # Start Developer Node

# AI Terminal (TypeScript)
npm install                          # Install dependencies
npm run build                        # Build TypeScript
```

### Linting & Formatting
```bash
# Python (all components use same config from pyproject.toml)
uv run ruff check .                  # Lint Python code
uv run ruff format .                 # Format Python code
uv run mypy .                        # Type checking

# Rust
cargo clippy                         # Lint Rust code
cargo fmt                           # Format Rust code

# TypeScript
npm run lint                         # Lint TypeScript (in ai-terminal/)
npm run format                       # Format TypeScript
```

## Architecture Overview

### Project Structure (Three Main Components)
```
cli-panda/
├── ai-terminal/           # TypeScript/Node.js - Interactive terminal with AI
├── lbrxchat/             # Python/MLX - RAG system for document analysis  
├── PostDevAi/            # Rust + Python/MLX - Distributed memory architecture
├── cli/                  # Python - CLI component
├── test_all.py           # Comprehensive test suite (inspired by lbrxWhisper)
├── install-all.sh        # Complete installation script
└── install.sh            # Quick curl|sh installer
```

### Key Technologies
- **uv**: Primary Python package manager (10-100x faster than pip) - NEVER use pip/conda/poetry
- **MLX**: Apple's ML framework for on-device AI acceleration (Apple Silicon only)
- **LM Studio**: Local LLM server for private AI inference
- **PostDevAI Architecture**: Dragon Node (M3 Ultra server) + Developer Node (local client)

### PostDevAI Hybrid Memory System
- **RAM-Lake**: 200GB hot storage in RAM for sub-ms access
- **Persistent Storage**: 1TB RocksDB with ZSTD compression for cold data
- **Automatic Hot/Cold Tiering**: 24h retention with background sync
- **TUI Visualization**: Real-time monitoring of memory performance

## Phase 2 Enhanced Terminal Capabilities ✅ COMPLETE!

### New Features (Just Implemented)
```bash
# Command execution from AI chat
!ls -la                          # Execute commands directly
!git status                      # Run git commands
!npm install                     # Install dependencies

# File analysis and reading
?? analyze package.json          # Deep file analysis with AI
?? read src/index.ts            # Read and explain code files
?? list files                   # Show all analyzable files
?? files for debugging          # AI suggests relevant files

# Git integration and assistance  
?? git status                   # Comprehensive repo analysis
?? git recommendations          # Smart workflow suggestions
?? generate commit message      # AI-powered commit messages
```

### Security & Safety Features
- **Command Blacklist**: Dangerous commands (rm -rf /, sudo shutdown, etc.) are blocked
- **File Size Limits**: Max 100KB files for analysis
- **Extension Filtering**: Only safe file types analyzed
- **Error Handling**: Graceful failures with helpful messages

### Implementation Files
- `src/features/file-analyzer.ts` - File reading and analysis
- `src/features/git-assistant.ts` - Git operations and recommendations  
- `src/features/inline-ai.ts` - Enhanced with new command handlers
- `src/index.ts` - Command execution with security safeguards

## Development Workflow

### Python Components (uv-first approach)
```bash
# NO virtual environment activation needed!
uv init projet                       # Create new project
uv add numpy pandas                  # Add dependencies  
uv sync                             # Install everything
uv run python main.py               # Run with auto-sync
```

### Installation Process
1. **Quick Install**: `curl -LsSf https://raw.githubusercontent.com/m-szymanska/cli-panda/main/install.sh | sh`
2. **Complete Setup**: `cd ~/cli-panda && ./install-all.sh`
3. **LM Studio Setup**: Download, install, load qwen2.5-7b-instruct model, start server

### Testing Strategy
- **Comprehensive Test Suite**: `test_all.py` tests all 10 components
- **LM Studio Integration**: Streaming chat test with 45s timeout (moved to end)
- **Component Isolation**: Each component tested independently
- **Error Handling**: PostDevAI marked as WIP, graceful failure handling

## Important Implementation Notes

### uv Philosophy
- CLI Panda is "uv-first" - it's the exclusive Python gateway
- No manual virtual environment activation ever needed
- All Python commands use `uv run` prefix
- Automatic dependency syncing and Python version management

### PostDevAI Status
- Phase 3 (Memory & Persistence) is COMPLETE
- Hybrid Memory system fully implemented
- Work in progress features should be marked as optional in tests
- Always run `uv sync` for lbrxchat during installation

### Repository Configuration
- Main repo is `m-szymanska/cli-panda` (not LibraxisAI)
- Configured for non-technical users with INSTALL_FOR_HUMANS.md
- curl|sh installer pattern like brew/uv/rust

### Component Dependencies
- **AI Terminal**: TypeScript, Node.js 20+, LM Studio SDK
- **LBRXCHAT**: Python 3.11+, MLX, LangChain, ChromaDB
- **PostDevAI**: Rust, Python, MLX, RocksDB, Redis
- **System Requirements**: Apple Silicon Mac, macOS 14.0+, LM Studio

### Code Style Preferences
- Follow existing patterns in each component
- Use MLX for all ML workloads on Apple Silicon
- Implement streaming for LM Studio interactions
- Handle errors gracefully with colored terminal output
- Always use `uv run` for Python scripts