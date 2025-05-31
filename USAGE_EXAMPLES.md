# 🐼 CLI Panda Usage Examples

Complete guide to using CLI Panda's enhanced AI Terminal with Phase 2 capabilities.

## 🚀 Quick Start

```bash
# Install CLI Panda (one-liner)
curl -LsSf https://raw.githubusercontent.com/m-szymanska/cli-panda/main/install.sh | sh

# Complete setup
cd ~/cli-panda && ./install-all.sh

# Start AI Terminal
ai
```

## 💬 Basic AI Help

```bash
# Get inline AI assistance
?? how to find large files
?? what does this error mean: permission denied
?? how to configure nginx reverse proxy
?? best practices for git workflow

# Explain complex commands
ai explain "find . -name '*.log' -mtime +30 -delete"
ai explain "docker run -it --rm -v $(pwd):/app node:18 npm test"
```

## 🚀 Command Execution (NEW!)

Execute commands directly from AI chat with `!`:

```bash
# File operations
!ls -la
!find . -name "*.js" -type f
!du -sh * | sort -hr

# Git operations
!git status
!git log --oneline -10
!git diff HEAD~1

# Development tasks
!npm install
!npm run test
!docker ps
!kubectl get pods

# System information
!ps aux | grep node
!df -h
!top -l 1 -s 0 | grep "CPU usage"
```

### Security Features
```bash
# These dangerous commands are BLOCKED:
!rm -rf /          # ❌ Blocked for safety
!sudo shutdown     # ❌ Blocked for safety
!format C:         # ❌ Blocked for safety

# Safe commands work normally:
!rm temp.txt       # ✅ Safe file deletion
!sudo nginx -t     # ✅ Safe config test
```

## 📄 File Analysis (NEW!)

Analyze any file with AI assistance:

```bash
# Analyze specific files
?? analyze package.json
?? analyze src/index.ts
?? read Dockerfile
?? analyze .env.example

# List analyzable files
?? list files
?? files

# Get file suggestions based on intent
?? files for debugging
?? files for configuration
?? files for testing
?? suggest files for performance optimization
```

### Supported File Types
- **Code**: `.js`, `.ts`, `.py`, `.rs`, `.go`, `.java`, `.cpp`, `.c`
- **Config**: `.json`, `.yaml`, `.yml`, `.toml`, `.env`, `.conf`
- **Docs**: `.md`, `.txt`, `.rst`
- **Scripts**: `.sh`, `.zsh`, `.bash`
- **Web**: `.html`, `.css`, `.xml`, `.svg`

### File Analysis Examples

```bash
# Package.json analysis
?? analyze package.json
# Result: Dependencies, scripts, security issues, optimization suggestions

# TypeScript code analysis  
?? analyze src/components/Header.tsx
# Result: Component structure, props, hooks usage, best practices

# Configuration analysis
?? analyze docker-compose.yml
# Result: Services overview, volumes, networks, security recommendations

# Environment analysis
?? analyze .env.example
# Result: Required variables, security concerns, missing defaults
```

## 🔧 Git Integration (NEW!)

Comprehensive git assistance:

```bash
# Repository status and analysis
?? git status
?? git
# Result: Branch info, staged/unstaged files, untracked files, recommendations

# Get workflow recommendations
?? git recommendations
?? git help
?? git what should i do
# Result: Next steps based on current repo state

# Generate smart commit messages
?? generate commit message
?? commit message
?? git commit message
# Result: AI-generated conventional commit message based on staged changes
```

### Git Workflow Examples

```bash
# Typical workflow with AI assistance:

# 1. Check repository status
?? git status
# Shows: 3 modified files, 2 untracked files

# 2. Get recommendations
?? git recommendations
# Suggests: stage files, review changes, commit workflow

# 3. Stage files
!git add src/ docs/

# 4. Generate commit message
?? generate commit message
# Result: "feat: implement user authentication with JWT tokens"

# 5. Commit with suggested message
!git commit -m "feat: implement user authentication with JWT tokens"

# 6. Push changes
!git push origin main
```

## 🧠 Advanced AI Interactions

### Contextual Help
```bash
# AI understands your current context
?? how to debug this npm error
?? why is my docker build failing
?? optimize this package.json for production
?? what security issues do I have in my code
```

### Development Workflows
```bash
# Project setup assistance
?? analyze this new project structure
?? what dependencies are missing
?? how to configure CI/CD for this project

# Debugging assistance  
?? analyze error logs
?? files for debugging performance issues
?? git status after deployment failure

# Code review assistance
?? analyze recent changes
?? files modified today
?? generate commit message for refactoring
```

## 📋 Practical Scenarios

### Scenario 1: New Project Analysis
```bash
# Clone and analyze a new project
!git clone https://github.com/example/project.git
!cd project

# Get project overview
?? list files
?? analyze package.json
?? analyze README.md
?? files for configuration

# Check project status
?? git status
?? git recommendations
```

### Scenario 2: Debugging Production Issue
```bash
# Check system status
!ps aux | grep node
!docker ps
!kubectl get pods

# Analyze configuration
?? analyze docker-compose.yml
?? analyze kubernetes/deployment.yaml
?? files for debugging

# Check logs and git history
!git log --oneline -20
?? git status
?? what changed recently
```

### Scenario 3: Code Review Preparation
```bash
# Check what's changed
?? git status
!git diff --name-only

# Analyze modified files
?? analyze src/api/auth.js
?? analyze tests/auth.test.js

# Generate proper commit message
?? generate commit message

# Final commit and push
!git add .
!git commit -m "fix: resolve authentication token expiration issue"
!git push origin feature/auth-fix
```

## 🎯 Tips and Best Practices

### Command Execution Tips
- Use `!` for any shell command
- Commands run in your current directory
- Output is captured and displayed in AI chat
- Dangerous commands are automatically blocked

### File Analysis Tips
- Files are analyzed with full context awareness
- AI provides security, performance, and best practice insights
- Maximum file size: 100KB (configurable)
- Binary files are automatically skipped

### Git Integration Tips
- `?? git status` shows comprehensive repository analysis
- AI generates commit messages based on actual code changes
- Recommendations adapt to your current workflow stage
- Works with any git repository

### Performance Tips
- File analysis is cached for faster repeated access
- Git operations use native git commands for speed
- Command execution runs asynchronously
- All operations respect your system resources

## 🚨 Troubleshooting

### Common Issues

**AI Terminal not responding:**
```bash
# Check LM Studio is running
!curl -s http://localhost:1234/v1/models
# Restart AI Terminal
ai
```

**File analysis failing:**
```bash
# Check file permissions
!ls -la filename.js
# Check file size (max 100KB)
!du -h filename.js
```

**Git commands not working:**
```bash
# Verify git repository
!git status
# Check git configuration
!git config --list
```

**Command execution blocked:**
```bash
# If a safe command is blocked, report it as an issue
# Use regular terminal for dangerous operations
# Check command syntax and try again
```

## 🎨 Customization

### AI Terminal Configuration
```bash
# Edit configuration
ai config --edit

# Show current config
ai config
```

### File Analysis Configuration
```bash
# Configure supported file types in:
# ~/.config/cli-panda/config.json
```

### Git Integration Configuration
```bash
# Git integration uses your global git config
!git config --global user.name "Your Name"
!git config --global user.email "your.email@example.com"
```

---

**Happy coding with CLI Panda! 🐼✨**

For more information:
- [README.md](README.md) - Main documentation
- [INSTALL_FOR_HUMANS.md](INSTALL_FOR_HUMANS.md) - Step-by-step installation
- [CLAUDE.md](CLAUDE.md) - Developer documentation