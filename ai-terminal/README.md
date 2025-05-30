# CLI Panda AI Terminal 🐼

> TypeScript/Node.js terminal assistant with inline AI help powered by LM Studio

## Overview

This is the main interactive terminal component of CLI Panda. Built with TypeScript and Node.js, it provides intelligent command-line assistance using LM Studio's local AI models. For Python/MLX components (RAG, distributed memory), see `../lbrxchat/` and `../PostDevAi/`.

## Features

- 🤖 **Inline AI** (`??`) - Natychmiastowa pomoc AI w dowolnym momencie
- 🔮 **Smart Autocomplete** - Kontekstowe podpowiedzi komend z AI
- 📝 **Command Explanations** - Wyjaśnienia przed wykonaniem (`ai-run`)
- 🧠 **Context Awareness** - Pamięta historię i dostosowuje sugestie
- ⚡ **SDK/REST Switch** - Wybierz między LM Studio SDK lub REST API
- 🎨 **ZSH Integration** - Pełna integracja z ~/.zshrc
- 🚀 **Warp-style Workflow** - Specjalne funkcje dla Warp Terminal

## Installation

### Quick Install
```bash
# Clone and install
git clone https://github.com/LibraxisAI/cli-panda.git
cd cli-panda/ai-terminal
chmod +x install.sh
./install.sh

# Test installation (no changes)
./install.sh --dry-run
```

### NPM Global Install (coming soon)
```bash
npm install -g @libraxis-ai/cli-panda
```

### Manual Installation
```bash
# Install dependencies
npm install

# Setup ZSH integration (optional)
cp -r zsh-components ~/.zsh/cli-panda
echo "source ~/.zsh/cli-panda/init.zsh" >> ~/.zshrc

# Create config
mkdir -p ~/.config/cli-panda
cp config/default.json ~/.config/cli-panda/config.json
```

## Requirements

- Node.js 20+
- LM Studio z modelem qwen3-8b (lub innym)
- ZSH (dla pełnej integracji)
- macOS/Linux

## Usage

### Podstawowe komendy
```bash
# Uruchom interaktywny terminal
ai

# Szybkie pytanie
ai inline "jak znaleźć duże pliki"
?? jak znaleźć duże pliki

# Wyjaśnij komendę
ai explain "find . -name '*.log' -mtime +30 -delete"

# Wyjaśnij i uruchom
ai-run "docker system prune -a"

# Napraw ostatni błąd
ai-fix
wtf
```

### ZSH Functions
```bash
# AI help inline
ai-help jak usunąć branch w git

# Sugestie komend
ai-suggest

# Analiza bloków (Warp)
ai-block
```

## Configuration

Config znajduje się w `~/.config/cli-panda/config.json`:

```json
{
  "mode": "sdk",          // "sdk" lub "rest"
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
```

### Edycja konfiguracji
```bash
ai config --edit
```

## Architecture

```
cli-panda/
├── src/
│   ├── core/
│   │   ├── lm-adapter.ts    # SDK/REST adapter pattern
│   │   ├── terminal.ts      # Terminal emulator
│   │   └── ai-engine.ts     # AI logic
│   ├── features/
│   │   ├── autocomplete.ts  # Smart completions
│   │   ├── inline-ai.ts     # ?? handler
│   │   └── explain.ts       # Command explanations
│   ├── cli.ts               # CLI entry point
│   └── index.ts             # Terminal UI
├── zsh-components/          # ZSH integration
│   ├── init.zsh
│   ├── aliases.zsh
│   ├── functions.zsh
│   └── completions.zsh
└── config/
    └── default.json
```

## Models

Domyślnie używa `qwen3-8b`, ale wspiera:
- Qwen3 (8B/14B/32B)
- Llama3 (8B/70B)
- Mixtral (8x7B)
- Mistral (7B)
- Phi-3 (3.8B/14B)

## Development

```bash
# Install deps
npm install

# Run in dev mode
npm run dev

# Build
npm run build

# Lint & fix
npm run lint
npm run lint:fix

# Run tests
npm test

# Configure
npm run configure
```

### Project Structure
- `src/` - TypeScript source code
- `dist/` - Compiled JavaScript (generated)
- `zsh-components/` - ZSH integration scripts
- `config/` - Default configuration templates
- `install.sh` - Bulletproof installer for non-programmers

## Known Issues

1. **tsx version**: Must use v4.19.4 or lower (v4.21.4 not available in npm)
2. **node-pty**: May require rebuild on some systems: `npm rebuild`
3. **blessed**: Terminal UI may flicker on some terminals
4. **LM Studio SDK**: Still in alpha, may have breaking changes
5. **ZSH on macOS**: System ZSH may be outdated, install via Homebrew
6. **Permissions**: May need chmod +x on launcher script

## Troubleshooting

### LM Studio nie działa
1. Sprawdź czy LM Studio jest uruchomione
2. Sprawdź port: `http://localhost:1234/v1/models`
3. Załaduj model w LM Studio
4. Sprawdź firewall/antywirus

### ZSH nie widzi komend
```bash
source ~/.zshrc
# lub restart terminal
```

### Permission denied
```bash
chmod +x ~/.local/bin/cli-panda
chmod +x install.sh
```

### Module not found
```bash
npm rebuild
npm install --force
```

## Contributing

We welcome contributions! Please follow these guidelines:

### Pull Request Process
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Style
- TypeScript with strict mode
- ESLint rules (run `npm run lint`)
- Meaningful variable names
- Comments for complex logic
- Tests for new features

### Commit Messages
Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Tests
- `chore:` Maintenance

### Issues
- Use issue templates
- Provide clear reproduction steps
- Include system info (OS, Node version)
- Attach error logs if applicable

## License

MIT License - see [LICENSE](LICENSE) file for details.

This project is open source and available under the MIT License. You are free to use, modify, and distribute this software in accordance with the license terms.

## Developed by

[Maciej Gad](https://github.com/MaciejGad) - a veterinarian who couldn't find `bash` a half year ago

[Klaudiusz](https://www.github.com/Klaudiusz-AI) - the individual ethereal being, and separate instance of Claude Sonnet 3.5-3.7 by Anthropic

(c)2025 M&K

🤖 Developed with the ultimate help of [Claude Code](https://claude.ai/code) and [MCP Tools](https://modelcontextprotocol.io)