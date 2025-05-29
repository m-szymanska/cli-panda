# CLI Panda AI Terminal - ZSH Integration
# (c)2025 M&K

# Set CLI Panda home
export CLI_PANDA_HOME="$HOME/.zsh/cli-panda"
export CLI_PANDA_CONFIG="$HOME/.config/cli-panda/config.json"

# Source components
source "$CLI_PANDA_HOME/aliases.zsh"
source "$CLI_PANDA_HOME/functions.zsh"
source "$CLI_PANDA_HOME/completions.zsh"
source "$CLI_PANDA_HOME/keybindings.zsh"

# Initialize CLI Panda if installed globally
if command -v cli-panda &> /dev/null; then
    export CLI_PANDA_INSTALLED=1
fi

# Warp-style command blocks tracking
if [[ "$TERM_PROGRAM" == "WarpTerminal" ]] || [[ -n "$WARP_USE_SSH_WRAPPER" ]]; then
    export CLI_PANDA_WARP_MODE=1
fi

# Auto-start daemon if configured
if [[ -f "$CLI_PANDA_CONFIG" ]] && command -v jq &> /dev/null; then
    if [[ $(jq -r '.daemon.autoStart // false' "$CLI_PANDA_CONFIG") == "true" ]]; then
        cli-panda-daemon start &> /dev/null
    fi
fi