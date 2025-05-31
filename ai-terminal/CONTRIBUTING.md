# Contributing to CLI Panda AI Terminal

First off, thank you for considering contributing to CLI Panda! 🐼

## Code of Conduct

Be kind, respectful, and constructive. We're all here to learn and build cool stuff together.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **System info** (OS, Node.js version, terminal)
- **Error logs** if applicable
- **Screenshots** if helpful

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. Include:

- **Clear title and description**
- **Use case** - why is this needed?
- **Possible implementation** - if you have ideas
- **Examples** from other tools if applicable

### Pull Requests

1. **Fork & Clone**
   ```bash
   git clone https://github.com/[your-username]/cli-panda.git
   cd cli-panda/ai-terminal
   npm install
   ```

2. **Create Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

3. **Make Changes**
   - Write clean, readable code
   - Follow existing patterns
   - Add tests if applicable
   - Update documentation

4. **Test**
   ```bash
   npm run lint
   npm test
   npm run dev  # manual testing
   ```

5. **Commit**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

6. **Push & PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then open a Pull Request on GitHub.

## Development Setup

### Prerequisites
- Node.js 20+
- npm 9+
- LM Studio (for AI features)
- ZSH (optional, for full integration)

### Setup
```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Build
npm run build

# Lint
npm run lint
npm run lint:fix

# Test
npm test
```

### Project Structure
```
ai-terminal/
├── src/           # TypeScript source
├── zsh-components/  # ZSH integration
├── config/        # Default configs
├── tests/         # Test files
└── dist/          # Built output
```

## Style Guide

### TypeScript
- Use TypeScript strict mode
- Prefer interfaces over types
- Use meaningful variable names
- Document complex functions

### Git Commits
We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `style:` Code style (formatting, semicolons)
- `refactor:` Code change that neither fixes nor adds
- `perf:` Performance improvement
- `test:` Adding tests
- `chore:` Maintenance tasks

### Examples
```
feat: add inline AI trigger for ??
fix: resolve memory leak in terminal emulator
docs: update installation instructions
style: format code with prettier
refactor: extract LM Studio adapter to separate module
test: add unit tests for autocomplete
chore: update dependencies
```

## Testing

- Write tests for new features
- Ensure existing tests pass
- Test manually in different terminals
- Test with different LM Studio models

## Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for public APIs
- Update config examples if needed
- Include examples in your PR description

## Questions?

Feel free to:
- Open an issue for discussion
- Ask in PR comments
- Contact maintainers

## Recognition

Contributors will be recognized in:
- README.md contributors section
- GitHub contributors page
- Release notes

Thank you for making CLI Panda better! 🐼✨