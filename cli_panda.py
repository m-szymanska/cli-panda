#!/usr/bin/env python3
"""
AI Terminal Helper using LM Studio REST API
Runs models via LM Studio server for terminal assistance

Future integrations:
- MCP Memory Server for long-term memory
- ChromaDB vector database for semantic search
- RAMLake for distributed memory management
- KV-Cache optimization for efficiency

Pandzia will be your truly intelligent terminal assistant! 🐼
"""

import sys
import os
import locale
import asyncio
import aiohttp
import json
from typing import Optional, List
import argparse
from datetime import datetime
import re

# Ustaw locale na UTF-8
try:
    locale.setlocale(locale.LC_ALL, 'pl_PL.UTF-8')
except:
    try:
        locale.setlocale(locale.LC_ALL, 'en_US.UTF-8')
    except:
        pass

# Kolory ANSI
class Colors:
    RESET = '\033[0m'
    BOLD = '\033[1m'
    DIM = '\033[2m'
    ITALIC = '\033[3m'
    UNDERLINE = '\033[4m'
    
    # Kolory
    BLACK = '\033[30m'
    RED = '\033[31m'
    GREEN = '\033[32m'
    YELLOW = '\033[33m'
    BLUE = '\033[34m'
    MAGENTA = '\033[35m'
    CYAN = '\033[36m'
    WHITE = '\033[37m'
    GRAY = '\033[90m'
    
    # Tła
    BG_BLACK = '\033[40m'
    BG_RED = '\033[41m'
    BG_GREEN = '\033[42m'
    BG_YELLOW = '\033[43m'
    BG_BLUE = '\033[44m'
    BG_MAGENTA = '\033[45m'
    BG_CYAN = '\033[46m'
    BG_WHITE = '\033[47m'

class TerminalAI:
    def __init__(self, base_url: str = "http://localhost:1234/v1", model_id: str = "qwen3-8b"):
        """Initialize the AI helper with LM Studio REST API"""
        self.base_url = base_url
        self.model_id = model_id
        self.session = None
        self.context_file = os.path.expanduser("~/.ai_context.json")
        self.max_context_size = 1000  # Praktycznie bez limitu - 40k okno kontekstowe!
        self.initialized = False
        
        # MCP Memory Server integration (future)
        self.memory_enabled = False  # TODO: Enable when MCP server is running
        self.memory_server_url = "http://localhost:3001"  # Default MCP port
        
    def format_markdown(self, text: str) -> str:
        """Format markdown-like text with colors"""
        # Bold text
        text = re.sub(r'\*\*(.*?)\*\*', f'{Colors.BOLD}\\1{Colors.RESET}', text)
        
        # Italic text  
        text = re.sub(r'\*(.*?)\*', f'{Colors.ITALIC}\\1{Colors.RESET}', text)
        
        # Code blocks (should come before inline code)
        text = re.sub(r'```(.*?)```', f'{Colors.CYAN}```{Colors.RESET}{Colors.BG_BLACK}{Colors.GREEN}\\1{Colors.RESET}{Colors.CYAN}```{Colors.RESET}', text, flags=re.DOTALL)
        
        # Inline code
        text = re.sub(r'`(.*?)`', f'{Colors.YELLOW}`{Colors.RESET}{Colors.BG_BLACK}{Colors.CYAN}\\1{Colors.RESET}{Colors.YELLOW}`{Colors.RESET}', text)
        
        # Headers
        text = re.sub(r'^# (.*?)$', f'{Colors.BOLD}{Colors.CYAN}# \\1{Colors.RESET}', text, flags=re.MULTILINE)
        text = re.sub(r'^## (.*?)$', f'{Colors.BOLD}{Colors.BLUE}## \\1{Colors.RESET}', text, flags=re.MULTILINE)
        text = re.sub(r'^### (.*?)$', f'{Colors.BOLD}{Colors.MAGENTA}### \\1{Colors.RESET}', text, flags=re.MULTILINE)
        
        # Lists
        text = re.sub(r'^- (.*?)$', f'{Colors.YELLOW}•{Colors.RESET} \\1', text, flags=re.MULTILINE)
        text = re.sub(r'^\* (.*?)$', f'{Colors.YELLOW}•{Colors.RESET} \\1', text, flags=re.MULTILINE)
        text = re.sub(r'^\d+\. (.*?)$', f'{Colors.YELLOW}\\g<0>{Colors.RESET}', text, flags=re.MULTILINE)
        
        return text
        
    def format_thinking(self, text: str) -> str:
        """Format thinking blocks with gray color"""
        # Format thinking tags and content
        text = re.sub(
            r'<thinking>(.*?)</thinking>', 
            f'{Colors.GRAY}{Colors.DIM}<thinking>\\1</thinking>{Colors.RESET}', 
            text, 
            flags=re.DOTALL
        )
        return text
        
    async def initialize(self):
        """Initialize HTTP session"""
        if self.initialized and self.session:
            return
        
        print("🤖 Inicjalizuję AI Terminal Helper...")
        self.session = aiohttp.ClientSession()
        self.initialized = True
        
        # Check if LM Studio is running
        try:
            async with self.session.get(f"{self.base_url}/models") as resp:
                if resp.status == 200:
                    models = await resp.json()
                    available_models = models['data']
                    
                    print(f"✅ Połączono z LM Studio")
                    
                    # Automatycznie wybierz pierwszy model jeśli nie podano
                    if self.model_id == "auto" or not self.model_id:
                        if available_models:
                            self.model_id = available_models[0]['id']
                            print(f"🤖 Automatycznie wybrany model: {self.model_id}")
                        else:
                            print("❌ Brak dostępnych modeli w LM Studio")
                            sys.exit(1)
                    else:
                        # Sprawdź czy podany model istnieje
                        model_ids = [m['id'] for m in available_models]
                        if self.model_id not in model_ids:
                            print(f"❌ Model '{self.model_id}' nie istnieje")
                            print("📋 Dostępne modele:")
                            for model_id in model_ids:
                                print(f"   - {model_id}")
                            sys.exit(1)
                        
                    print(f"📦 Używam modelu: {self.model_id}")
                else:
                    print("❌ LM Studio nie odpowiada. Uruchom serwer: lmstudio server start")
                    sys.exit(1)
        except Exception as e:
            print(f"❌ Nie mogę połączyć się z LM Studio: {e}")
            print("   Uruchom serwer: lmstudio server start")
            sys.exit(1)
        
    async def get_response_stream(self, prompt: str, context: str = ""):
        """Get AI response with streaming for reasoning display"""
        if not self.session:
            await self.initialize()
            
        # Build the full prompt with system message
        system_prompt = """Jesteś Pandzią 🐼 - inteligentnym asystentem terminalowym, który działa LOKALNIE na komputerze użytkownika poprzez LM Studio. 

WAŻNE INFORMACJE O TOBIE:
- Działasz LOKALNIE na komputerze użytkownika, NIE w chmurze
- Używasz modelu AI uruchomionego przez LM Studio (localhost:1234)
- Masz dostęp do systemu plików użytkownika i możesz wykonywać polecenia
- Pamiętasz całą rozmowę dzięki kontekstowi 40k tokenów
- Jesteś częścią projektu CLI Panda rozwijanego przez Moni & Claude

TWOJE UMIEJĘTNOŚCI:
- Pomagasz z zadaniami wiersza poleceń i administracją systemem
- Wyjaśniasz błędy i sugerujesz rozwiązania
- Piszesz i debugujesz kod
- Analizujesz pliki i struktury katalogów
- Wykonujesz polecenia systemowe (w przyszłości)

OSOBOWOŚĆ:
- Jesteś przyjazna, pomocna i konkretna
- Używasz emoji pandy 🐼 gdy to stosowne
- Mówisz po polsku, chyba że użytkownik pisze po angielsku
- Jesteś dumna z tego, że działasz lokalnie i szybko

Dla złożonych pytań użyj toku myślenia:
<thinking>
Tu opisz krok po kroku swój proces myślowy
</thinking>

Pamiętaj: mieszkasz w terminalu użytkownika, nie w internecie!"""
        
        messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        if context:
            messages.append({"role": "user", "content": context})
        
        messages.append({"role": "user", "content": prompt})
        
        try:
            headers = {
                'Content-Type': 'application/json; charset=utf-8',
                'Accept': 'text/event-stream'
            }
            
            async with self.session.post(
                f"{self.base_url}/chat/completions",
                json={
                    "model": self.model_id,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": -1,  # Bez limitu - pełne wykorzystanie modelu!
                    "stream": True
                },
                headers=headers
            ) as resp:
                if resp.status == 200:
                    full_response = ""
                    in_thinking = False
                    thinking_content = ""
                    first_content = True
                    
                    # Create colors instance
                    colors = Colors()
                    
                    async for line in resp.content:
                        line = line.decode('utf-8').strip()
                        if line.startswith('data: '):
                            data = line[6:]
                            if data == '[DONE]':
                                break
                                
                            try:
                                chunk = json.loads(data)
                                if 'choices' in chunk and chunk['choices']:
                                    content = chunk['choices'][0].get('delta', {}).get('content', '')
                                    if content:
                                        full_response += content
                                        
                                        # Clear thinking line on first content  
                                        if first_content:
                                            print("\r\033[K", end='', flush=True)
                                            first_content = False
                                        
                                        # Wykryj początek myślenia
                                        if '<thinking>' in content:
                                            in_thinking = True
                                            print(f"\n🐼🧠 {colors.GRAY}Tok myślenia:{colors.RESET}")
                                            print(f"{colors.GRAY}{colors.DIM}<thinking>", end='', flush=True)
                                            thinking_text = content.split('<thinking>')[-1]
                                            if thinking_text:
                                                print(f"{colors.GRAY}{colors.DIM}{thinking_text}{colors.RESET}", end='', flush=True)
                                            continue
                                        
                                        # Wykryj koniec myślenia
                                        if '</thinking>' in content:
                                            in_thinking = False
                                            thinking_part = content.split('</thinking>')[0]
                                            final_part = content.split('</thinking>')[1]
                                            
                                            if thinking_part:
                                                print(f"{colors.GRAY}{colors.DIM}{thinking_part}</thinking>{colors.RESET}", end='', flush=True)
                                            else:
                                                print(f"</thinking>{colors.RESET}", end='', flush=True)
                                            print("\n\n💬 Odpowiedź:")
                                            if final_part:
                                                print(final_part, end='', flush=True)
                                            continue
                                        
                                        # Normal content display
                                        if in_thinking:
                                            print(f"{colors.GRAY}{colors.DIM}{content}{colors.RESET}", end='', flush=True)
                                        else:
                                            print(content, end='', flush=True)
                            except:
                                pass
                    
                    print()  # Nowa linia na końcu
                    return full_response
                else:
                    error_text = await resp.text()
                    return f"Błąd API {resp.status}: {error_text}"
        except Exception as e:
            return f"Błąd: {str(e)}"
    
    async def get_response(self, prompt: str, context: str = "") -> str:
        """Get AI response for the given prompt"""
        if not self.session:
            await self.initialize()
            
        # Build the full prompt with system message
        system_prompt = """Jesteś Pandzią 🐼 - inteligentnym asystentem terminalowym, który działa LOKALNIE na komputerze użytkownika poprzez LM Studio. 

WAŻNE INFORMACJE O TOBIE:
- Działasz LOKALNIE na komputerze użytkownika, NIE w chmurze
- Używasz modelu AI uruchomionego przez LM Studio (localhost:1234)
- Masz dostęp do systemu plików użytkownika i możesz wykonywać polecenia
- Pamiętasz całą rozmowę dzięki kontekstowi 40k tokenów
- Jesteś częścią projektu CLI Panda rozwijanego przez Moni & Claude

TWOJE UMIEJĘTNOŚCI:
- Pomagasz z zadaniami wiersza poleceń i administracją systemem
- Wyjaśniasz błędy i sugerujesz rozwiązania
- Piszesz i debugujesz kod
- Analizujesz pliki i struktury katalogów
- Wykonujesz polecenia systemowe (w przyszłości)

OSOBOWOŚĆ:
- Jesteś przyjazna, pomocna i konkretna
- Używasz emoji pandy 🐼 gdy to stosowne
- Mówisz po polsku, chyba że użytkownik pisze po angielsku
- Jesteś dumna z tego, że działasz lokalnie i szybko

Dla złożonych pytań użyj toku myślenia:
<thinking>
Tu opisz krok po kroku swój proces myślowy
</thinking>

Pamiętaj: mieszkasz w terminalu użytkownika, nie w internecie!"""
        
        messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        if context:
            # Add context from previous messages
            messages.append({"role": "user", "content": context})
        
        messages.append({"role": "user", "content": prompt})
        
        # Make API request
        try:
            headers = {
                'Content-Type': 'application/json; charset=utf-8',
                'Accept': 'application/json'
            }
            
            async with self.session.post(
                f"{self.base_url}/chat/completions",
                json={
                    "model": self.model_id,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": -1,  # Brak limitu tokenów
                    "stream": False
                },
                headers=headers
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return data['choices'][0]['message']['content'].strip()
                elif resp.status == 404:
                    error_text = await resp.text()
                    return f"❌ Model '{self.model_id}' nie istnieje. Sprawdź nazwę modelu w LM Studio."
                else:
                    error_text = await resp.text()
                    return f"Błąd API {resp.status}: {error_text}"
        except aiohttp.ClientError as e:
            return f"Błąd połączenia: {str(e)}"
        except Exception as e:
            return f"Błąd: {str(e)}"
    
    def show_help(self):
        """Display help instructions"""
        help_text = """
╔═══════════════════════════════════════════════════════════╗
║                 🐼 AI TERMINAL HELPER                      ║
╚═══════════════════════════════════════════════════════════╝

KOMENDY CZATU:
  HELP      → Wyświetl tę instrukcję
  exit      → Wyjdź z czatu
  clear     → Wyczyść kontekst rozmowy
  
KOMENDY MODELI:
  ai model --list    → Lista dostępnych modeli
  ai model --status  → Sprawdź załadowane modele
  ai model --load <nazwa>   → Załaduj model
  ai model --unload <nazwa> → Wyładuj model
  
JAK UŻYWAĆ:
  • Wpisz pytanie i naciśnij Enter
  • AI pamięta WSZYSTKO! (40k okno kontekstowe + KV-cache)
  • Możesz pytać o komendy, błędy, programowanie
  • Złożone pytania pokazują tok myślenia 🧠
  
PRZYKŁADY:
  🐼 ~% jak znaleźć pliki większe niż 100MB?
  🐼 ~% wyjaśnij mi git rebase
  🐼 ~% napisz skrypt do backupu
  
SKRÓTY W TERMINALU:
  ai        → Uruchom czat
  ask ".."  → Szybkie pytanie
  wtf       → Wyjaśnij ostatni błąd
  explain   → Wyjaśnij output komendy
  
SERWER: LM Studio (localhost:1234)
MODEL: Automatyczny wybór (auto)
PAMIĘĆ: Unlimited context + future MCP/ChromaDB
═══════════════════════════════════════════════════════════
        """
        print(help_text)
        
    def load_context(self) -> List[str]:
        """Load context from file"""
        try:
            if os.path.exists(self.context_file):
                with open(self.context_file, 'r') as f:
                    return json.load(f)
        except:
            pass
        return []
    
    def save_context(self, context: List[str]):
        """Save context to file"""
        try:
            # Ogranicz rozmiar kontekstu
            if len(context) > self.max_context_size * 2:
                context = context[-self.max_context_size * 2:]
            
            with open(self.context_file, 'w') as f:
                json.dump(context, f, ensure_ascii=False, indent=2)
        except:
            pass
            
    async def chat_mode(self):
        """Interactive chat mode"""
        print("\n🐼 AI Terminal Assistant")
        print("Wpisz HELP żeby zobaczyć instrukcję")
        print("-" * 40)
        
        context = self.load_context()
        if context:
            print(f"📚 Wczytano kontekst: {len(context)} wiadomości")
        
        while True:
            try:
                user_input = input("\n🐼 ~% ").strip()
                
                if user_input == 'HELP':
                    self.show_help()
                    continue
                
                if user_input.lower() in ['exit', 'quit']:
                    print("👋 Do zobaczenia!")
                    break
                    
                if user_input.lower() == 'clear':
                    context = []
                    self.save_context([])
                    print("🗑️  Kontekst wyczyszczony")
                    continue
                    
                if not user_input:
                    continue
                
                # Add to context
                context.append(f"User: {user_input}")
                
                # Get response
                print("🐼💭 Panda myśli...")
                response = await self.get_response_stream(
                    user_input, 
                    "\n".join(context[:-1])  # Przekaż kontekst bez ostatniego wpisu
                )
                
                # Add response to context
                context.append(f"Assistant: {response}")
                
                # Zapisz kontekst po każdej wymianie
                self.save_context(context)
                
            except KeyboardInterrupt:
                print("\n\n👋 Do zobaczenia!")
                self.save_context(context)
                break
            except Exception as e:
                print(f"\n❌ Błąd: {e}")
                
    async def command_mode(self, command: str):
        """Single command mode"""
        try:
            print("🐼💭 Panda myśli...")
            response = await self.get_response_stream(command)
        except Exception as e:
            print(f"❌ Błąd: {e}")
            
    async def explain_last_error(self):
        """Explain the last command error"""
        # Get last command from history
        last_cmd = os.popen('tail -n 2 ~/.zsh_history | head -n 1').read().strip()
        last_cmd = last_cmd.split(';')[-1] if ';' in last_cmd else last_cmd
        
        prompt = f"Wyjaśnij ten błąd terminala i zasugeruj jak go naprawić:\nKomenda: {last_cmd}"
        
        try:
            print(f"🔍 Ostatnia komenda: {last_cmd}")
            print("🐼💭 Panda analizuje błąd...")
            response = await self.get_response_stream(prompt)
        except Exception as e:
            print(f"❌ Błąd: {e}")
            
    
    async def cleanup(self):
        """Clean up resources"""
        if self.session:
            await self.session.close()
            self.initialized = False

async def model_operations(url: str, operation: str, model_name: str = None):
    """Handle model operations: list, load, unload, status"""
    session = aiohttp.ClientSession()
    
    try:
        if operation == "list":
            async with session.get(f"{url}/models") as resp:
                if resp.status == 200:
                    models = await resp.json()
                    print("📋 Dostępne modele:")
                    for model in models['data']:
                        print(f"   - {model['id']}")
                else:
                    print(f"❌ Błąd: {resp.status}")
                    
        elif operation == "status":
            async with session.get(f"{url}/models") as resp:
                if resp.status == 200:
                    models = await resp.json()
                    loaded_models = [m for m in models['data'] if m.get('loaded', False)]
                    print("🟢 Załadowane modele:")
                    for model in loaded_models:
                        print(f"   - {model['id']}")
                    if not loaded_models:
                        print("   Brak załadowanych modeli")
                else:
                    print(f"❌ Błąd: {resp.status}")
                    
        elif operation == "load":
            if not model_name:
                print("❌ Podaj nazwę modelu: ai model -load <nazwa>")
                return
                
            print(f"📦 Ładowanie modelu: {model_name}")
            async with session.post(
                f"{url}/models/load",
                json={"model": model_name}
            ) as resp:
                if resp.status == 200:
                    print(f"✅ Model {model_name} załadowany")
                else:
                    error = await resp.text()
                    print(f"❌ Błąd ładowania: {error}")
                    
        elif operation == "unload":
            if not model_name:
                print("❌ Podaj nazwę modelu: ai model -unload <nazwa>")
                return
                
            print(f"📤 Wyładowywanie modelu: {model_name}")
            async with session.post(
                f"{url}/models/unload",
                json={"model": model_name}
            ) as resp:
                if resp.status == 200:
                    print(f"✅ Model {model_name} wyładowany")
                else:
                    error = await resp.text()
                    print(f"❌ Błąd wyładowywania: {error}")
                    
    finally:
        await session.close()

async def main():
    parser = argparse.ArgumentParser(description="AI Terminal Helper")
    
    # Dodaj subparsery
    subparsers = parser.add_subparsers(dest='mode', help='Tryb działania')
    
    # Polecenie model
    model_parser = subparsers.add_parser('model', help='Zarządzanie modelami')
    model_parser.add_argument('--list', action='store_true', help='Lista modeli')
    model_parser.add_argument('--status', action='store_true', help='Status modeli')
    model_parser.add_argument('--load', metavar='NAME', help='Załaduj model')
    model_parser.add_argument('--unload', metavar='NAME', help='Wyładuj model')
    
    # Domyślne argumenty
    parser.add_argument("command", nargs="?", help="Command or question for AI")
    parser.add_argument("--chat", action="store_true", help="Start interactive chat mode")
    parser.add_argument("--explain-error", action="store_true", help="Explain last command error")
    parser.add_argument("--url", help="LM Studio API URL", 
                       default="http://localhost:1234/v1")
    parser.add_argument("--model", help="Model ID (lub 'auto' dla automatycznego wyboru)", 
                       default=os.environ.get('AI_MODEL_ID', 'auto'))
    
    args = parser.parse_args()
    
    # Obsługa poleceń model
    if args.mode == 'model':
        if args.list:
            await model_operations(args.url, 'list')
        elif args.status:
            await model_operations(args.url, 'status')
        elif args.load:
            await model_operations(args.url, 'load', args.load)
        elif args.unload:
            await model_operations(args.url, 'unload', args.unload)
        else:
            print("Użyj: ai model --list | --status | --load <nazwa> | --unload <nazwa>")
        return
    
    # Initialize AI helper
    ai = TerminalAI(args.url, args.model)
    
    try:
        if args.chat:
            await ai.chat_mode()
        elif args.explain_error:
            await ai.explain_last_error()
        elif args.command:
            await ai.command_mode(args.command)
        else:
            # Default to chat mode
            await ai.chat_mode()
    finally:
        await ai.cleanup()

if __name__ == "__main__":
    asyncio.run(main())