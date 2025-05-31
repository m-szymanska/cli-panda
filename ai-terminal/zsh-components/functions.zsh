# CLI Panda Functions

# Inline AI help function
ai-help() {
    local query="$*"
    if [[ -z "$query" ]]; then
        echo "Usage: ai-help <your question>"
        return 1
    fi
    cli-panda inline "$query"
}

# Explain command before running
ai-run() {
    local cmd="$*"
    if [[ -z "$cmd" ]]; then
        echo "Usage: ai-run <command>"
        return 1
    fi
    
    echo "🤖 Analyzing: $cmd"
    cli-panda explain-command "$cmd"
    
    echo -n "\nExecute? [y/N] "
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        eval "$cmd"
    fi
}

# Smart command suggestion
ai-suggest() {
    local context="$(pwd)"
    local recent_cmds="$(fc -l -10 | tail -5)"
    
    cli-panda suggest \
        --context "$context" \
        --history "$recent_cmds" \
        --query "$*"
}

# Fix last failed command
ai-fix() {
    local last_cmd="$(fc -ln -1)"
    local exit_code="$?"
    
    if [[ $exit_code -eq 0 ]]; then
        echo "Last command succeeded, nothing to fix"
        return 0
    fi
    
    cli-panda fix-command \
        --command "$last_cmd" \
        --exit-code "$exit_code" \
        --error "$(fc -l -1 2>&1)"
}

# Warp-style command block analysis
if [[ -n "$CLI_PANDA_WARP_MODE" ]]; then
    ai-block() {
        # Get current Warp block content
        local block_content="$(warp blocks current 2>/dev/null || echo '')"
        if [[ -n "$block_content" ]]; then
            cli-panda analyze-block "$block_content"
        else
            echo "No Warp block detected"
        fi
    }
fi

# Context-aware completion helper
_ai_context() {
    local current_word="$1"
    local full_line="$2"
    
    # Only trigger on specific patterns
    if [[ "$current_word" =~ ^(git|docker|kubectl|npm|cargo) ]]; then
        cli-panda complete \
            --partial "$full_line" \
            --word "$current_word" \
            --quiet
    fi
}