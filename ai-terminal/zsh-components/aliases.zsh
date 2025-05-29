# CLI Panda Aliases

# Main AI terminal
alias ai='cli-panda'
alias aii='cli-panda interactive'
alias aiq='cli-panda quick'

# Quick AI queries
alias '??'='cli-panda inline'
alias '?!'='cli-panda explain'
alias '?@'='cli-panda suggest'

# Command helpers
alias wtf='cli-panda explain-last-error'
alias howto='cli-panda howto'
alias fixit='cli-panda fix-command'

# Model management
alias ai-models='cli-panda models list'
alias ai-load='cli-panda models load'
alias ai-config='cli-panda config edit'

# Warp-style blocks (if in Warp)
if [[ -n "$CLI_PANDA_WARP_MODE" ]]; then
    alias aiblock='cli-panda warp-block'
    alias aisplit='cli-panda warp-split'
fi