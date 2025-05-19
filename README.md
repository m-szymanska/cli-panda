# ~% CLI@Panda

An intelligent terminal assistant powered by LM Studio that brings AI capabilities directly to your command line.

## Features

- >à Context-aware responses with 40k token window
- =­ Visible reasoning process
- =' Terminal command assistance
- =Ý Code generation and debugging
- <¨ Rich terminal formatting with colors
- =¾ Persistent conversation memory
- =€ Fast local AI inference via LM Studio

## Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/cli-panda.git
cd cli-panda

# Install dependencies
pip install -r requirements.txt

# Install as command
./scripts/install.sh
```

## Usage

```bash
# Start interactive chat
ai

# Quick question
ask "how to find large files?"

# Explain last error
wtf

# Model management
ai model --list
ai model --load qwen3-8b
ai model --status
```

## Development Roadmap

See [Development Steps](docs/development-steps.md) for detailed roadmap.

## Architecture

CLI Panda consists of:
- Core AI interface powered by LM Studio
- Terminal integration layer
- Context management system
- Future: MCP memory server integration
- Future: ChromaDB vector search
- Future: Plugin system for extensibility

## Requirements

- macOS/Linux/Windows
- Python 3.8+
- LM Studio running locally
- Compatible AI model (Qwen3-8B recommended)

## Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

## License

MIT License
