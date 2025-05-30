# Changelog

All notable changes to CLI Panda AI Terminal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2025-05-29

### Added
- Dry-run mode for install.sh (`--dry-run` flag)
- Comprehensive documentation (README, CONTRIBUTING, LICENSE)
- Known issues section in README
- Manual installation instructions
- Contribution guidelines
- Changelog file

### Fixed
- tsx package version (4.21.4 → 4.19.4) to resolve npm install errors
- install.sh npm install command (removed --production flag)

### Changed
- Enhanced install.sh with better error handling and user feedback
- Updated README with clearer structure and troubleshooting
- Improved development setup instructions

## [0.1.0] - 2025-05-29

### Added
- Initial release of CLI Panda AI Terminal
- TypeScript/Node.js implementation
- LM Studio integration (SDK and REST modes)
- ZSH integration with custom functions
- Inline AI assistance (`??` trigger)
- Smart autocomplete with context awareness
- Command explanation features
- Warp-style workflow support
- Bulletproof installer for non-programmers
- Configuration system (~/.config/cli-panda/config.json)
- Support for multiple AI models (Qwen3, Llama3, Mixtral, etc.)

### Features
- `ai` - Launch interactive terminal
- `ai inline` - Quick AI queries
- `ai explain` - Explain commands before execution
- `ai-run` - Explain and execute commands
- `ai-fix` / `wtf` - Fix last command error
- `ai-help` - Get help with commands
- `ai-suggest` - Get command suggestions
- `ai-block` - Analyze code blocks (Warp terminal)

### Technical
- Adapter pattern for SDK/REST switching
- Terminal emulator with blessed UI
- Modular architecture
- ESLint configuration
- Jest test setup
- npm package structure (@libraxis-ai/cli-panda)