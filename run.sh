#!/bin/bash

# CLI Panda Runner - uv-powered!
# Run any component without manual activation

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Show help
show_help() {
    echo -e "${MAGENTA}CLI Panda Runner 🐼${NC}"
    echo
    echo "Usage: ./run.sh [component] [args...]"
    echo
    echo "Components:"
    echo "  ai-terminal  - Launch AI Terminal (TypeScript)"
    echo "  lbrxchat     - Launch LBRXCHAT TUI (Python/MLX)"
    echo "  postdevai    - Launch PostDevAI client (Python/MLX)"
    echo "  dragon       - Launch Dragon Node (Rust)"
    echo "  developer    - Launch Developer Node (Rust)"
    echo "  cli          - Launch CLI Panda Python"
    echo "  test         - Test all components (like lbrxWhisper!)"
    echo
    echo "Examples:"
    echo "  ./run.sh lbrxchat"
    echo "  ./run.sh postdevai --connect"
    echo "  ./run.sh cli --help"
    echo "  ./run.sh test         # Test everything!"
    echo
    echo "No virtual environment activation needed - uv handles everything!"
}

# Check uv is installed
check_uv() {
    if ! command -v uv &> /dev/null; then
        echo -e "${RED}Error: uv not found!${NC}"
        echo "Install with: curl -LsSf https://astral.sh/uv/install.sh | sh"
        exit 1
    fi
}

# Main logic
main() {
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi
    
    check_uv
    
    COMPONENT=$1
    shift
    
    case $COMPONENT in
        ai-terminal|ai)
            echo -e "${BLUE}Launching AI Terminal...${NC}"
            cd ai-terminal
            npm start
            ;;
            
        lbrxchat|rag)
            echo -e "${BLUE}Launching LBRXCHAT...${NC}"
            cd lbrxchat
            uv run python -m lbrxchat.tui "$@"
            ;;
            
        postdevai|memory)
            echo -e "${BLUE}Launching PostDevAI client...${NC}"
            cd PostDevAi
            uv run python -m PostDevAi.client "$@"
            ;;
            
        dragon)
            echo -e "${BLUE}Launching Dragon Node...${NC}"
            cd PostDevAi
            ./target/release/dragon_node "$@"
            ;;
            
        developer)
            echo -e "${BLUE}Launching Developer Node...${NC}"
            cd PostDevAi
            ./target/release/developer_node "$@"
            ;;
            
        cli|panda)
            echo -e "${BLUE}Launching CLI Panda...${NC}"
            cd cli
            uv run python cli_panda.py "$@"
            ;;
            
        test|check)
            echo -e "${BLUE}Testing all CLI Panda components...${NC}"
            uv run python test_all.py "$@"
            ;;
            
        *)
            echo -e "${RED}Unknown component: $COMPONENT${NC}"
            echo
            show_help
            exit 1
            ;;
    esac
}

main "$@"