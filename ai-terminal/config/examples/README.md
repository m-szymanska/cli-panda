# CLI Panda Configuration Examples

This directory contains example configuration files for different use cases.

## Available Examples

### minimal.json
The bare minimum configuration needed to run CLI Panda. Good for getting started quickly.

```bash
cp config/examples/minimal.json ~/.config/cli-panda/config.json
```

### advanced.json
Full-featured configuration with all bells and whistles. Shows all available options.

```bash
cp config/examples/advanced.json ~/.config/cli-panda/config.json
```

### rest-mode.json
Configuration for using REST API mode instead of SDK. Useful for custom LM Studio setups.

```bash
cp config/examples/rest-mode.json ~/.config/cli-panda/config.json
```

### performance.json
Optimized for speed and low resource usage. Disables some features for better performance.

```bash
cp config/examples/performance.json ~/.config/cli-panda/config.json
```

## Configuration Options

### Core Settings
- `mode`: "sdk" or "rest" - How to connect to LM Studio
- `model`: Model name to use (must be loaded in LM Studio)
- `temperature`: 0.0-1.0 - Creativity level
- `maxTokens`: Maximum response length

### Features
- `inlineAI`: Enable ?? trigger for inline help
- `smartAutocomplete`: AI-powered command suggestions
- `contextAwareness`: Remember conversation context
- `warpStyleBlocks`: Support for Warp terminal features

### Performance Tuning
- `cacheResponses`: Cache AI responses
- `streamResponses`: Stream responses as they generate
- `maxConcurrentRequests`: Limit parallel AI requests

## Creating Custom Config

1. Start with an example that's closest to your needs
2. Copy to your config location:
   ```bash
   cp config/examples/advanced.json ~/.config/cli-panda/config.json
   ```
3. Edit with your preferred settings:
   ```bash
   nano ~/.config/cli-panda/config.json
   ```
4. Restart CLI Panda to apply changes

## Tips

- For slower machines, use `performance.json` as a base
- For maximum features, use `advanced.json`
- Test different models to find the best balance of speed/quality
- Adjust `temperature` based on your use case (lower = more predictable)