# CLI Panda - Instalacja dla Ludzi (nie-programistów) 🐼

> Jeszcze nigdy nie programowałeś? Nie problem! Ten przewodnik jest napisany tak, jakbyś był moim 70-letnim wujkiem.

## 📋 Co będziesz robić:
1. ⏱️ **5 minut** - instalacja podstawowych narzędzi
2. ⏱️ **3 minuty** - pobranie CLI Panda  
3. ⏱️ **10 minut** - instalacja LM Studio i modelu AI
4. ⏱️ **2 minuty** - test czy działa

**Razem: ~20 minut**

---

## 🔧 KROK 1: Przygotowanie komputera (5 min)

### 1.1 Otwórz Terminal
- Naciśnij **Cmd + Spacja**
- Wpisz: **Terminal**
- Naciśnij **Enter**
- Pojawi się czarne okno z tekstem - to jest Terminal

### 1.2 Zainstaluj narzędzia programistyczne
Skopiuj i wklej tę linię do Terminala (Cmd+V), potem naciśnij Enter:

```bash
xcode-select --install
```

- Pojawi się okno z przyciskiem **"Zainstaluj"** - kliknij go
- Poczekaj ~5 minut aż się zainstaluje
- Może poprosić o hasło do komputera - wpisz je

---

## 📦 KROK 2: Pobierz CLI Panda (3 min)

### 2.1 Pobierz pliki
W Terminalu skopiuj i wklej:

```bash
curl -LsSf https://raw.githubusercontent.com/LibraxisAI/cli-panda/main/install.sh | sh
cd ~/cli-panda
```

### 2.2 Uruchom automatyczną instalację
```bash
chmod +x install-all.sh
./install-all.sh
```

**To będzie trwało ~10 minut.** Pójdź zrób sobie kawę ☕

---

## 🤖 KROK 3: Zainstaluj LM Studio (AI Brain) (10 min)

### 3.1 Pobierz LM Studio
1. Otwórz przeglądarkę
2. Idź na: **https://lmstudio.ai**
3. Kliknij duży niebieski przycisk **"Download for macOS"**
4. Poczekaj aż się pobierze (~200MB)

### 3.2 Zainstaluj LM Studio
1. Otwórz pobrany plik (zwykle w folderze Downloads)
2. Przeciągnij **LM Studio** do folderu **Applications**
3. Otwórz **LM Studio** z folderu Applications

### 3.3 Pobierz model AI (WAŻNE!)
W LM Studio:

1. **Kliknij ikonę 🔍 (Search)** po lewej stronie
2. **W polu search wpisz:** `qwen3-8b`
3. **Znajdź:** "Qwen/Qwen2.5-7B-Instruct-GGUF"
4. **Kliknij przycisk "Download"** przy `qwen2.5-7b-instruct-q4_k_m.gguf`
5. **Poczekaj ~10 minut** aż się pobierze (to duży plik!)

### 3.4 Uruchom model
1. **Kliknij ikonę 💬 (Chat)** po lewej
2. **Kliknij "Select a model to load"**
3. **Wybierz** ten model który pobrałeś
4. **Kliknij "Load Model"**
5. **Poczekaj** aż się załaduje (pasek postępu)
6. **Kliknij "Start Server"** (ważne!)

**Widzisz zielone światełko i "Server running"? SUPER! 🎉**

---

## ✅ KROK 4: Test czy działa (2 min)

### 4.1 Restart Terminal
1. **Zamknij Terminal** (Cmd+Q)
2. **Otwórz Terminal ponownie** (Cmd+Spacja → Terminal)

### 4.2 Test CLI Panda
Wpisz w Terminal:

```bash
ai
```

**Powinno się pojawić kolorowe okno CLI Panda! 🐼**

### 4.3 Test AI pomocy
Wpisz:
```bash
?? jak sprawdzić wolne miejsce na dysku
```

**Dostałeś odpowiedź? DZIAŁA! 🚀**

---

## 🎉 GRATULACJE!

Właśnie zainstalowałeś zaawansowany system AI dla terminala!

### Co możesz teraz robić:

```bash
ai                           # Uruchom AI Terminal
?? jak skopiować plik        # Zapytaj o cokolwiek  
ai-run "ls -la"             # Wyjaśni komendę i wykona
ai-fix                      # Naprawi ostatni błąd
```

### Dodatkowe komponenty:
```bash
./run.sh test               # Test czy wszystko działa
./run.sh lbrxchat          # RAG system (analiza dokumentów)
```

---

## 🆘 Coś nie działa?

### "ai: command not found"
```bash
source ~/.zshrc
```

### "LM Studio not responding"
1. Otwórz LM Studio
2. Kliknij Chat → Load Model  
3. Kliknij "Start Server"

### "Permission denied"
```bash
chmod +x install-all.sh
```

### Dalej nie działa?
1. **Napisz issue:** https://github.com/LibraxisAI/cli-panda/issues
2. **Dołącz:** jakiej komendy użyłeś i jaki błąd dostałeś
3. **System:** którą wersję macOS masz

---

## 🤓 Co właśnie zainstalowałeś?

**CLI Panda** to inteligentny asystent terminala który:
- Odpowiada na pytania o komendy
- Wyjaśnia co robią komendy przed wykonaniem  
- Naprawia błędy automatycznie
- Analizuje dokumenty (LBRXCHAT)
- Pamięta historię (PostDevAI)

**Wszystko działa lokalnie** - Twoje dane nie opuszczają komputera!

**Witaj w świecie AI! 🐼✨**