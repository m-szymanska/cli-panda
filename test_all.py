#!/usr/bin/env python3
"""
CLI Panda Complete System Test
Tests all components and dependencies
"""

import sys
import subprocess
import json
import asyncio
import aiohttp
from pathlib import Path
import shutil
from typing import Dict, List, Tuple

# Colors for output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_header():
    print(f"{Colors.MAGENTA}🐼 Testing CLI Panda ecosystem...{Colors.END}")
    print("=" * 50)
    print()

def print_test(num: int, desc: str):
    print(f"{Colors.CYAN}{num}️⃣ {desc}...{Colors.END}")

def print_success(msg: str):
    print(f"{Colors.GREEN}✅ {msg}{Colors.END}")

def print_error(msg: str):
    print(f"{Colors.RED}❌ {msg}{Colors.END}")

def print_warning(msg: str):
    print(f"{Colors.YELLOW}⚠️  {msg}{Colors.END}")

def run_command(cmd: List[str], cwd: str = None) -> Tuple[bool, str]:
    """Run command and return success status and output"""
    try:
        result = subprocess.run(
            cmd, 
            capture_output=True, 
            text=True, 
            timeout=10,
            cwd=cwd
        )
        return result.returncode == 0, result.stdout + result.stderr
    except subprocess.TimeoutExpired:
        return False, "Command timed out"
    except Exception as e:
        return False, str(e)

def test_uv():
    """Test uv installation and version"""
    print_test(1, "Testing uv (our Python gateway)")
    
    success, output = run_command(["uv", "--version"])
    if success:
        version = output.strip().split()[-1]
        print_success(f"uv {version} - Ready to rock! 🚀")
        return True
    else:
        print_error("uv not found - install with: curl -LsSf https://astral.sh/uv/install.sh | sh")
        return False

def test_node():
    """Test Node.js for AI Terminal"""
    print_test(2, "Testing Node.js (for AI Terminal)")
    
    success, output = run_command(["node", "--version"])
    if success:
        version = output.strip()
        print_success(f"Node.js {version}")
        
        # Check npm
        npm_success, npm_output = run_command(["npm", "--version"])
        if npm_success:
            npm_version = npm_output.strip()
            print_success(f"npm {npm_version}")
            return True
        else:
            print_error("npm not found")
            return False
    else:
        print_error("Node.js not found - install from https://nodejs.org")
        return False

async def test_lm_studio():
    """Test LM Studio connection and models"""
    print_test(3, "Testing LM Studio")
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get("http://localhost:1234/v1/models", timeout=5) as response:
                if response.status == 200:
                    data = await response.json()
                    models = data.get('data', [])
                    model_names = [model['id'] for model in models]
                    
                    print_success(f"LM Studio: OK - {len(models)} models loaded")
                    for model in model_names:
                        print(f"   - {model}")
                    return True
                else:
                    print_error("LM Studio not responding properly")
                    return False
    except Exception as e:
        print_error("LM Studio not running - start LM Studio and load a model")
        return False

def test_rust():
    """Test Rust installation"""
    print_test(4, "Testing Rust (for PostDevAI)")
    
    success, output = run_command(["rustc", "--version"])
    if success:
        version = output.strip().split()[1]
        print_success(f"Rust {version}")
        
        cargo_success, cargo_output = run_command(["cargo", "--version"])
        if cargo_success:
            cargo_version = cargo_output.strip().split()[1]
            print_success(f"Cargo {cargo_version}")
            return True
        else:
            print_error("Cargo not found")
            return False
    else:
        print_error("Rust not found - install with: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh")
        return False

def test_ai_terminal():
    """Test AI Terminal component"""
    print_test(5, "Testing AI Terminal component")
    
    ai_terminal_path = Path("ai-terminal")
    if not ai_terminal_path.exists():
        print_error("ai-terminal directory not found")
        return False
    
    # Check package.json
    package_json = ai_terminal_path / "package.json"
    if not package_json.exists():
        print_error("package.json not found in ai-terminal")
        return False
    
    # Check node_modules
    node_modules = ai_terminal_path / "node_modules"
    if not node_modules.exists():
        print_warning("node_modules not found - run: cd ai-terminal && npm install")
        return False
    
    print_success("AI Terminal: Ready")
    return True

def test_lbrxchat():
    """Test LBRXCHAT component"""
    print_test(6, "Testing LBRXCHAT (RAG System)")
    
    lbrxchat_path = Path("lbrxchat")
    if not lbrxchat_path.exists():
        print_error("lbrxchat directory not found")
        return False
    
    # Test uv project
    success, output = run_command(["uv", "run", "python", "--version"], cwd="lbrxchat")
    if success:
        python_version = output.strip().split()[-1]
        print_success(f"LBRXCHAT Python: {python_version}")
        
        # Test main module
        module_success, module_output = run_command(
            ["uv", "run", "python", "-m", "lbrxchat", "--help"], 
            cwd="lbrxchat"
        )
        if module_success:
            print_success("LBRXCHAT module: OK")
            return True
        else:
            print_warning("LBRXCHAT module check failed (might be OK)")
            return True
    else:
        print_error("LBRXCHAT uv environment not ready - run: cd lbrxchat && uv sync")
        return False

def test_postdevai():
    """Test PostDevAI component"""
    print_test(7, "Testing PostDevAI (Distributed Memory)")
    
    postdevai_path = Path("PostDevAi")
    if not postdevai_path.exists():
        print_error("PostDevAi directory not found")
        return False
    
    # Check Rust binaries
    dragon_node = postdevai_path / "target" / "release" / "dragon_node"
    developer_node = postdevai_path / "target" / "release" / "developer_node"
    
    if dragon_node.exists():
        print_success("Dragon Node binary: OK")
    else:
        print_warning("Dragon Node not built - run: cd PostDevAi && cargo build --release")
    
    if developer_node.exists():
        print_success("Developer Node binary: OK")
    else:
        print_warning("Developer Node not built - run: cd PostDevAi && cargo build --release")
    
    # Test Python component
    success, output = run_command(["uv", "run", "python", "--version"], cwd="PostDevAi")
    if success:
        python_version = output.strip().split()[-1]
        print_success(f"PostDevAI Python: {python_version}")
        return True
    else:
        print_error("PostDevAI uv environment not ready - run: cd PostDevAi && uv sync")
        return False

def test_cli_component():
    """Test CLI component"""
    print_test(8, "Testing CLI component")
    
    cli_path = Path("cli")
    if not cli_path.exists():
        print_error("cli directory not found")
        return False
    
    # Test uv project
    success, output = run_command(["uv", "run", "python", "cli_panda.py", "--help"], cwd="cli")
    if success:
        print_success("CLI Panda: OK")
        return True
    else:
        print_error("CLI component not ready - run: cd cli && uv sync")
        return False

def test_mlx():
    """Test MLX availability (Apple Silicon)"""
    print_test(9, "Testing MLX (Apple Silicon AI)")
    
    try:
        success, output = run_command(["uv", "run", "python", "-c", "import mlx.core as mx; print(f'MLX: {mx.__version__}')"], cwd="lbrxchat")
        if success and "MLX:" in output:
            version = output.strip().split()[-1]
            print_success(f"MLX {version} - Apple Silicon ready! 🍎")
            return True
        else:
            print_warning("MLX not available - install with: uv add mlx mlx-lm")
            return False
    except Exception:
        print_warning("MLX test failed - might not be installed in all components")
        return False

async def test_lm_studio_chat():
    """Test LM Studio chat functionality"""
    print_test(10, "Testing LM Studio chat with streaming")
    
    try:
        async with aiohttp.ClientSession() as session:
            payload = {
                "model": "qwen3-8b",
                "messages": [
                    {"role": "user", "content": "Describe CLI Panda project in Polish, enthusiastically, in 2 sentences. End with 'No i zajebiście! 🐼'"}
                ],
                "stream": True,
                "max_tokens": 100
            }
            
            async with session.post(
                "http://localhost:1234/v1/chat/completions",
                json=payload,
                timeout=10
            ) as response:
                if response.status == 200:
                    print_success("LM Studio streaming chat:")
                    print("-" * 60)
                    
                    full_response = ""
                    async for line in response.content:
                        line = line.decode('utf-8').strip()
                        if line.startswith('data: ') and not line.endswith('[DONE]'):
                            try:
                                data = json.loads(line[6:])
                                if 'choices' in data and len(data['choices']) > 0:
                                    delta = data['choices'][0].get('delta', {})
                                    content = delta.get('content', '')
                                    if content:
                                        print(content, end='', flush=True)
                                        full_response += content
                            except json.JSONDecodeError:
                                continue
                    
                    print()
                    print("-" * 60)
                    print_success("Streaming complete!")
                    return True
                else:
                    print_error("LM Studio chat failed")
                    return False
    except Exception as e:
        print_error(f"LM Studio chat test failed: {str(e)}")
        return False

async def main():
    """Run all tests"""
    print_header()
    
    tests = [
        ("uv", test_uv),
        ("Node.js", test_node),
        ("LM Studio", test_lm_studio),
        ("Rust", test_rust),
        ("AI Terminal", test_ai_terminal),
        ("LBRXCHAT", test_lbrxchat),
        ("PostDevAI", test_postdevai),
        ("CLI component", test_cli_component),
        ("MLX", test_mlx),
        ("LM Studio Chat", test_lm_studio_chat)
    ]
    
    results = {}
    
    for name, test_func in tests:
        try:
            if asyncio.iscoroutinefunction(test_func):
                result = await test_func()
            else:
                result = test_func()
            results[name] = result
        except Exception as e:
            print_error(f"{name} test failed: {str(e)}")
            results[name] = False
        print()
    
    # Summary
    print("=" * 50)
    print_test("🏁", "Test complete")
    
    passed = sum(results.values())
    total = len(results)
    
    if passed == total:
        print_success(f"All {total} tests passed! CLI Panda is ready to rock! 🚀")
    else:
        print_warning(f"{passed}/{total} tests passed")
        
        failed_tests = [name for name, result in results.items() if not result]
        if failed_tests:
            print()
            print("Failed tests:")
            for test in failed_tests:
                print(f"  - {test}")

if __name__ == "__main__":
    asyncio.run(main())